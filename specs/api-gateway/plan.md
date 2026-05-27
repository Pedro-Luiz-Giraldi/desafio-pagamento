# Plano Técnico: API Gateway

**Spec:** [spec.md](spec.md)
**Status:** Draft
**Responsável:** Dev 2
**Sprint:** 1

---

## Decisões Técnicas

| Decisão | Escolha | Alternativa | Motivo |
|---------|---------|-------------|--------|
| Tecnologia | Spring Cloud Gateway | Nginx, Kong | Mesmo ecossistema Spring, configuração em Java/YAML, fácil integração com Resilience4j |
| JWT validation | Delegado ao user-service (com cache Redis) | Validação local com chave pública | Centraliza lógica de auth; cache de 30s reduz overhead |
| Rate limiting | Redis Token Bucket (Spring Cloud Gateway built-in) | Nginx rate limit | Distribuído entre instâncias do gateway |
| Circuit breaker | Resilience4j | Hystrix (deprecated) | Suportado oficialmente pelo Spring, moderno |
| Service discovery | Hostnames Docker Compose | Kubernetes Service | Compatível com Docker Compose; migrar para K8s depois |

---

## Dependências

### Serviços consumidos
- `user-service` → `/internal/auth/validate-token` (validação JWT)

### Tabelas do banco
- Nenhuma — gateway é stateless (estado somente no Redis)

### Chaves Redis

| Key | TTL | Propósito |
|-----|-----|-----------|
| `token_validation:{sha256(token)}` | 30s | Cache de validação JWT |
| `rate_limit:{tipo}:{chave}` | Per-window | Contadores de rate limit por rota |

---

## Estrutura de Pacotes

```
src/main/java/com/acaboumony/gateway/
├── filter/
│   ├── AuthenticationFilter.java       (valida JWT, injeta headers X-User-*)
│   ├── CorrelationIdFilter.java         (injeta X-Correlation-Id)
│   └── LoggingFilter.java              (loga request/response)
├── config/
│   ├── RouteConfig.java                (RouteLocator com todas as rotas)
│   ├── RateLimiterConfig.java          (configuração por rota)
│   ├── CircuitBreakerConfig.java       (Resilience4j por serviço)
│   └── CorsConfig.java
├── client/
│   └── UserServiceClient.java          (WebClient para validação JWT)
└── exception/
    └── GatewayExceptionHandler.java    (GlobalExceptionHandler)
```

---

## Configuração de Rotas (RouteLocator)

```java
@Bean
public RouteLocator routes(RouteLocatorBuilder builder) {
    return builder.routes()
        .route("user-service-public", r -> r
            .path("/api/v1/auth/**")
            .filters(f -> f
                .circuitBreaker(c -> c.setName("user-service").setFallbackUri("forward:/fallback"))
                .requestRateLimiter(c -> c.setRateLimiter(ipRateLimiter())))
            .uri("http://user-service:8081"))
        .route("payment-service", r -> r
            .path("/api/v1/transactions/**")
            .filters(f -> f
                .filter(authFilter)
                .circuitBreaker(c -> c.setName("payment-service")))
            .uri("http://payment-service:8082"))
        // ... outras rotas
        .build();
}
```

---

## Flyway Migrations
Nenhuma — gateway não tem banco de dados.

---

## Estratégia de Testes

| Tipo | Framework | Cenários |
|------|-----------|----------|
| Unitário | JUnit 5 + Mockito | Filters individualmente |
| Integração | Spring Boot Test (MockServer) | Rotas, JWT, rate limit, circuit breaker |
| Security | Spring Security Test | Rotas públicas vs. autenticadas |

---

## Configuração Docker Compose

```yaml
api-gateway:
  image: acaboumony/api-gateway:latest
  ports:
    - "8080:8080"
  environment:
    - SPRING_REDIS_HOST=redis
    - USER_SERVICE_URL=http://user-service:8081
    - PAYMENT_SERVICE_URL=http://payment-service:8082
    - ORDER_SERVICE_URL=http://order-service:8083
    - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-*}
    - NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
    - NEW_RELIC_APP_NAME=acaboumony-api-gateway
  depends_on:
    - user-service
    - payment-service
    - order-service
    - redis
```

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| user-service indisponível (validação JWT) | Baixa | Alto | Cache Redis 30s + circuit breaker |
| Redis indisponível (rate limit) | Baixa | Médio | Fail-open com log de alerta |
| Latência alta do gateway | Baixa | Alto | Cache de validação + monitoramento New Relic |
