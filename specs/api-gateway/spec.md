# Spec: API Gateway

**ID:** SPEC-GWY-001
**Serviço:** api-gateway
**Status:** Draft
**Revisores:** [ ] PM [ ] Arquiteto [ ] QA [ ] Security

---

## 1. Visão Geral

O api-gateway é o único ponto de entrada de todos os clientes externos. Valida JWT, aplica rate limiting, roteia para os microserviços internos, injeta Correlation ID em todas as requisições e aplica circuit breaker por serviço. Baseado em Spring Cloud Gateway.

---

## 2. Responsabilidades

| Responsabilidade | Implementação |
|-----------------|---------------|
| Roteamento | Spring Cloud Gateway RouteLocator |
| Validação de JWT | GlobalFilter customizado chamando user-service /internal/auth/validate-token |
| Rate limiting | Spring Cloud Gateway RateLimiter (Redis-backed, token bucket) |
| Correlation ID | GlobalFilter que injeta `X-Correlation-Id` em todas as requests |
| Circuit breaker | Resilience4j CircuitBreaker por serviço downstream |
| CORS | Spring Cloud Gateway CORS config |
| Logging | GatewayFilter que loga request + response (sem body, apenas headers e status) |

---

## 3. Tabela de Rotas

| Path | Serviço | Auth | Rate Limit |
|------|---------|------|------------|
| `/api/v1/auth/**` | user-service:8081 | Público (🔓) | 20 req/min por IP |
| `/api/v1/users/**` | user-service:8081 | JWT obrigatório | 60 req/min por userId |
| `/api/v1/transactions/**` | payment-service:8082 | JWT obrigatório | 100 req/min por userId |
| `/api/v1/orders/**` | order-service:8083 | JWT obrigatório | 60 req/min por userId |
| `/internal/**` | — | Bloqueado externamente | — |

---

## 4. Fluxo de uma Requisição Autenticada

```
Cliente
    ↓
1. GlobalFilter: inject X-Correlation-Id (se ausente, gerar UUID)
    ↓
2. RateLimitFilter: verificar limite por IP/userId no Redis
    ↓
3. AuthFilter: validar JWT via POST /internal/auth/validate-token
              (result cacheado no Redis por 30s para o mesmo token)
    ↓
4. CircuitBreakerFilter: verificar se serviço destino está UP
    ↓
5. Route: encaminhar para serviço correto com headers:
          X-User-Id, X-User-Email, X-User-Roles, X-Correlation-Id
    ↓
6. LogFilter: registrar status da resposta + latência
```

---

## 5. Validação de JWT

### 5.1 Comportamento

- Requisições para rotas marcadas como 🔓 (públicas) passam sem validação
- Todas as outras rotas exigem `Authorization: Bearer {token}` válido
- Token expirado → HTTP 401, não passa para o serviço downstream
- Token válido → adicionar headers ao request antes de rotear:
  - `X-User-Id: {userId}`
  - `X-User-Email: {email}`
  - `X-User-Roles: {roles separados por vírgula}`
  - `X-Merchant-Id: {merchantId ou vazio}`

### 5.2 Cache do Resultado de Validação

- Key Redis: `token_validation:{hash do token}` com TTL de 30s
- Reduz chamadas ao user-service em até 90% para tokens recentes
- Ao receber 401 de qualquer serviço downstream, invalidar cache do token

### 5.3 Códigos de Resposta

| Situação | HTTP | Body |
|----------|------|------|
| JWT ausente | 401 | `{"errors": [{"code": "MISSING_TOKEN"}]}` |
| JWT inválido/expirado | 401 | `{"errors": [{"code": "INVALID_TOKEN"}]}` |
| JWT válido, serviço OK | Repassa resposta do downstream | — |

---

## 6. Rate Limiting

### 6.1 Estratégia

Token bucket por chave (IP ou userId):
- Rotas públicas: chave = IP
- Rotas autenticadas: chave = userId (extraído do JWT)

### 6.2 Limites por Rota

| Rota | Limite | Janela | Burst |
|------|--------|--------|-------|
| `/auth/**` (público) | 20 req | 1 min | 5 |
| `/transactions/**` | 100 req | 1 min | 20 |
| `/orders/**` | 60 req | 1 min | 10 |
| `/users/**` | 60 req | 1 min | 10 |

### 6.3 Resposta ao Exceder Limite

```
HTTP 429 Too Many Requests
Headers:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1748350860
  Retry-After: 42
Body: {"errors": [{"code": "RATE_LIMIT_EXCEEDED", "retryable": true}]}
```

---

## 7. Circuit Breaker

### 7.1 Configuração por Serviço

| Serviço | Threshold para abrir | Tempo em OPEN | Fallback |
|---------|---------------------|--------------|---------|
| user-service | 50% erro em 10 req | 30s | HTTP 503 |
| payment-service | 50% erro em 10 req | 30s | HTTP 503 |
| order-service | 50% erro em 10 req | 30s | HTTP 503 |

### 7.2 Resposta com Circuit Breaker OPEN

```json
HTTP 503 Service Unavailable
{
  "errors": [{
    "code": "SERVICE_UNAVAILABLE",
    "message": "Serviço temporariamente indisponível. Tente novamente em instantes.",
    "retryable": true
  }]
}
```

---

## 8. Correlation ID

- Todo request recebe um `X-Correlation-Id` único (UUID v4)
- Se o cliente enviar o header, ele é preservado (permite rastreamento end-to-end)
- O ID é propagado para todos os serviços downstream
- Incluído em todas as respostas como header
- Logado em todos os serviços para correlação no New Relic

---

## 9. CORS

```yaml
allow-origins: ["https://app.acaboumony.com"]
allow-methods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]
allow-headers: [Authorization, Content-Type, Idempotency-Key, X-Correlation-Id]
allow-credentials: true
max-age: 3600
```

Em desenvolvimento: `allow-origins: ["*"]` via `CORS_ALLOWED_ORIGINS` env var.

---

## 10. Rotas Bloqueadas

- Qualquer request para `/internal/**` retorna HTTP 404 imediatamente (não roteia)
- O path interno é visível apenas dentro da rede Docker (não exposto externamente)

---

## 11. Casos Extremos

### CE-001: Todos os pods de um serviço estão DOWN
- Circuit breaker abre após threshold
- Gateway retorna HTTP 503 com mensagem de retry
- New Relic alerta configurado para circuit breaker OPEN > 30s

### CE-002: Redis indisponível (cache de token + rate limit)
- Fallback: validar JWT localmente com chave pública (sem cache)
- Rate limit: fail-open (permite requisições) com log de alerta
- New Relic alerta imediato

### CE-003: user-service indisponível para validação de JWT
- Circuit breaker para user-service abre
- Todas as rotas autenticadas retornam HTTP 503
- Rotas públicas continuam funcionando

### CE-004: Token com roles insuficientes para o recurso
- Gateway passa o request (não faz autorização de roles — isso é responsabilidade do serviço downstream)
- Gateway apenas verifica se o token é válido

---

## 12. Logging

Cada request logado em JSON com:
- `correlationId`
- `method`
- `path`
- `statusCode`
- `durationMs`
- `userId` (se autenticado)
- `routedTo` (serviço destino)

**Nunca logar:** body do request/response, headers de autenticação completos, tokens.

---

## 13. Performance

| Operação | P50 | P99 |
|----------|-----|-----|
| Overhead do gateway (sem cache) | 10ms | 30ms |
| Overhead do gateway (com cache JWT) | 3ms | 10ms |
| Rate limit check (Redis) | 2ms | 8ms |

Meta: overhead total do gateway < 50ms P99.

---

## 14. Segurança

- TLS 1.3 terminado no gateway — tráfego interno em HTTP
- Headers de segurança adicionados em todas as respostas:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Rotas `/internal/**` nunca acessíveis externamente
- JWT validado antes de qualquer roteamento
- Rate limiting previne DoS básico
