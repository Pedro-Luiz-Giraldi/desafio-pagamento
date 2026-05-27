# Arquitetura do Sistema — Acabou o Mony

**Versão:** 2.0
**Data:** 2026-05-27
**Status:** Draft

---

## Visão Geral

A Acabou o Mony é uma API de pagamentos digitais baseada em microserviços. Cada serviço tem responsabilidade única, banco de dados isolado e se comunica via REST (síncrono) ou Kafka (assíncrono). Nenhum serviço acessa o banco de outro diretamente.

---

## Diagrama de Alto Nível

```
┌─────────────────────────────────────────┐
│           CLIENTES EXTERNOS             │
│   (Mobile App, Web App, API Consumers)  │
└──────────────────┬──────────────────────┘
                   │ HTTPS / TLS 1.3
          ┌────────▼────────┐
          │   api-gateway   │  :8080
          │  Spring Cloud   │  JWT ✓  Rate Limit ✓
          │   Gateway       │  Circuit Breaker ✓
          └────────┬────────┘
                   │ HTTP (rede interna Docker)
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼────┐  ┌─────▼─────┐  ┌───▼──────┐
│  user-  │  │  payment- │  │  order-  │
│ service │  │  service  │  │ service  │
│  :8081  │  │   :8082   │  │  :8083   │
└────┬────┘  └─────┬─────┘  └───┬──────┘
     │             │             │
     │      ┌──────▼──────┐      │
     │      │fraud-service│      │
     │      │   :8085     │      │
     │      │(interno MP) │      │
     │      └─────────────┘      │
     │                           │
     └───────────┬───────────────┘
                 │ Kafka Events
          ┌──────▼───────┐
          │notification- │
          │   service    │
          │    :8084     │
          └──────┬───────┘
                 │ SMTP
          [Emails para usuários]

┌─────────────────────────────────────────┐
│              INFRAESTRUTURA             │
│  PostgreSQL :5432  │  Redis :6379       │
│  Kafka :9092       │  New Relic (agent) │
└─────────────────────────────────────────┘

              [Mercado Pago API]
              payment-service → MP
```

---

## Microserviços

### api-gateway (:8080)
- **Função:** Único ponto de entrada externo
- **Responsabilidades:** Roteamento, validação JWT, rate limiting, circuit breaker, Correlation ID
- **Banco:** Nenhum (stateless; Redis para rate limit e cache JWT)
- **Rotas:** `/api/v1/auth/**` → user-service, `/api/v1/transactions/**` → payment-service, `/api/v1/orders/**` → order-service

### user-service (:8081)
- **Função:** Cadastro, autenticação, 2FA
- **Banco:** `user_db` (PostgreSQL)
- **SLA:** P99 < 300ms

### payment-service (:8082)
- **Função:** Processamento de transações via Mercado Pago, estornos
- **Banco:** `payment_db` (PostgreSQL)
- **Redis:** Idempotência, rate limiting, cache de transações
- **Integração:** Mercado Pago API, fraud-service (síncrono interno)
- **SLA:** P99 < 1.000ms

### order-service (:8083)
- **Função:** Criação e gestão de pedidos
- **Banco:** `order_db` (PostgreSQL)
- **SLA:** P99 < 100ms

### notification-service (:8084)
- **Função:** Envio de emails transacionais via Kafka
- **Banco:** `notification_db` (PostgreSQL — apenas notification_log)
- **Integração:** SMTP externo
- **Princípio:** Falha silenciosa — nunca bloqueia fluxo de pagamento

### fraud-service (:8085)
- **Função:** Score de fraude em tempo real
- **Banco:** `fraud_db` (PostgreSQL)
- **Redis:** Velocity checks, IP blacklist
- **Integração:** Claude API (análise contextual para scores 70-89)
- **SLA:** P99 < 200ms
- **Acesso:** Apenas pelo payment-service (não exposto via api-gateway)

---

## Fluxo Principal: Processar Pagamento

```
1. Cliente cria pedido
   → POST /api/v1/orders
   → order-service: cria pedido com status PENDING
   → Kafka: order.created → notification-service envia email de confirmação de pedido

2. Cliente processa pagamento
   → POST /api/v1/transactions
   → api-gateway: valida JWT, aplica rate limit
   → payment-service:
       a. Valida input + idempotência (Redis)
       b. Chama fraud-service.score() [< 200ms]
       c. [score < 90] Chama Mercado Pago API [< 500ms]
       d. Grava transação no PostgreSQL
       e. Publica transaction.completed no Kafka
   → Response HTTP 201 [P99 < 1.000ms]

3. Pós-pagamento (assíncrono)
   → order-service consome transaction.completed → pedido → PAID
   → notification-service consome transaction.completed → emails para cliente e merchant
```

---

## Fluxo: Fraude Detectada

```
payment-service → fraud-service.score()
                → score ≥ 90 → BLOCK
                → fraud-service publica fraud.detected
                → payment-service retorna SUSPECTED_FRAUD (sem detalhes)
                → notification-service envia email de alerta para security team
```

---

## Comunicação Entre Serviços

### Síncrona (REST — rede interna Docker)

| Chamada | De | Para | Quando |
|---------|----|----|--------|
| `/internal/fraud/score` | payment-service | fraud-service | Antes de cada pagamento |
| `/internal/auth/validate-token` | api-gateway | user-service | A cada requisição autenticada |

### Assíncrona (Kafka)

| Tópico | Produzido por | Consumido por |
|--------|--------------|---------------|
| `user.registered` | user-service | notification-service |
| `user.login.blocked` | user-service | notification-service |
| `user.2fa.enabled` | user-service | notification-service |
| `order.created` | order-service | notification-service |
| `transaction.completed` | payment-service | order-service, notification-service |
| `transaction.failed` | payment-service | notification-service |
| `transaction.refunded` | payment-service | order-service, notification-service |
| `fraud.detected` | fraud-service | payment-service, notification-service |
| `fraud.review` | fraud-service | (fila de revisão manual — futuro) |

---

## Banco de Dados — PostgreSQL

### Schemas por Serviço

```
payment_db:
  - transactions
  - refunds
  - audit_logs

user_db:
  - users
  - merchants
  - recovery_codes
  - user_audit_logs

order_db:
  - orders
  - order_items

notification_db:
  - notification_log

fraud_db:
  - fraud_alerts
  - ip_blacklist
```

---

## Cache — Redis

| Key Pattern | TTL | Serviço | Uso |
|-------------|-----|---------|-----|
| `idempotency:payment:{key}` | 24h | payment-service | Deduplicação de transações |
| `idempotency:order:{key}` | 24h | order-service | Deduplicação de pedidos |
| `rate_limit:payment:{userId}` | 1min | payment-service | Rate limiting |
| `rate_limit:auth:{ip}` | 1min | api-gateway | Rate limiting public routes |
| `fraud:velocity:{customerId}` | 5min | fraud-service | Velocity checks |
| `fraud:ip_blacklist:{ip}` | 24h | fraud-service | Blacklist de IPs |
| `transaction:{id}` | 60s | payment-service | Cache de leitura |
| `login_attempts:{email}` | 30min | user-service | Contador de tentativas |
| `refresh_token:{userId}:{id}` | 7d | user-service | Refresh tokens |
| `email_confirm:{token}` | 24h | user-service | Confirmação de email |
| `token_validation:{hash}` | 30s | api-gateway | Cache de validação JWT |

---

## Monitoramento — New Relic

- **APM por serviço:** latência, throughput, taxa de erro
- **Distributed Tracing:** rastrear requisição fim-a-fim via X-Correlation-Id
- **Log aggregation:** todos os logs JSON enviados ao New Relic
- **Infrastructure:** métricas de CPU/memória dos containers
- **Alertas:** P99 > 900ms, erro > 1%, circuit breaker aberto

---

## Infraestrutura — Docker Compose

```
docker-compose.yml (raiz do projeto)
├── api-gateway
├── user-service
├── payment-service
├── order-service
├── notification-service
├── fraud-service
├── postgres (único container, databases separados por serviço)
├── redis
├── kafka
└── zookeeper
```

Cada serviço tem seu `Dockerfile` no diretório do módulo. Variáveis sensíveis via `.env` (nunca no repositório).

---

## Segurança de Rede

```
Internet → api-gateway (TLS 1.3 terminado) → Serviços (HTTP interno Docker network)
```

- TLS 1.3 somente para tráfego externo (terminado no api-gateway)
- Rede Docker interna — serviços não acessíveis diretamente da internet
- `/internal/**` nunca roteado pelo api-gateway para o exterior
- fraud-service na porta 8085 — não exposto na configuração de ports do Compose para host externo
