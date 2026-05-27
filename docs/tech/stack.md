# Stack Tecnológico — Acabou o Mony

**Versão:** 2.0
**Data:** 2026-05-27

---

## Linguagem e Framework

| Componente | Tecnologia | Versão | Justificativa |
|------------|------------|--------|---------------|
| Linguagem | Java | 21 (LTS) | Virtual Threads (Loom), Records, Sealed Classes, Pattern Matching |
| Framework | Spring Boot | 3.4.x | Ecossistema maduro, integração nativa com todas as dependências |
| API Gateway | Spring Cloud Gateway | 4.x | Roteamento, circuit breaker, rate limiting nativos |
| Build | Maven | 3.9.x | Gestão de dependências e ciclo de build |
| IDE recomendada | IntelliJ IDEA | 2024.x+ | Suporte completo ao Java 21 e Spring Boot |

### Funcionalidades Java 21 obrigatórias

| Feature | Uso |
|---------|-----|
| Virtual Threads | Todas as operações de I/O: banco, Mercado Pago, Kafka, chamadas internas |
| Records | Todos os DTOs (request/response) |
| Sealed Classes | Resultados de operações (Success/Failure), estados de domínio |
| Pattern Matching | Switch expressions, instanceof checks |
| Text Blocks | SQL queries longas, templates de mensagens |

---

## Banco de Dados

| Componente | Tecnologia | Versão | Uso |
|------------|------------|--------|-----|
| Banco Principal | PostgreSQL | 16.x | Um schema por microserviço (isolamento de dados) |
| ORM | Spring Data JPA + Hibernate | 6.x | Mapeamento objeto-relacional |
| Migration | Flyway | 10.x | Versionamento do schema por serviço |
| Connection Pool | HikariCP | (built-in) | Pool de conexões (max 20 por serviço) |

### Configuração

- Pool máximo: 20 conexões por serviço
- Cada microserviço tem seu próprio banco: `payment_db`, `user_db`, `order_db`, `notification_db`, `fraud_db`
- Proibido: um serviço acessar banco de outro diretamente

---

## Cache

| Componente | Tecnologia | Versão | Uso |
|------------|------------|--------|-----|
| Cache | Redis | 7.x | Idempotência, rate limiting, velocity checks, cache JWT |
| Cliente Java | Spring Data Redis + Lettuce | 3.x | Integração Spring |

---

## Mensageria

| Componente | Tecnologia | Versão | Uso |
|------------|------------|--------|-----|
| Message Broker | Apache Kafka | 3.7.x | Eventos assíncronos entre microserviços |
| Cliente Java | Spring Kafka | 3.x | Integração Spring |
| Serialização | Jackson JSON | — | Serialização de eventos |

---

## Segurança

| Componente | Tecnologia | Versão | Uso |
|------------|------------|--------|-----|
| Framework de Segurança | Spring Security | 6.x | Autenticação, autorização |
| JWT | JJWT | 0.12.x | Tokens de acesso e refresh |
| JWT Algoritmo | RS256 | — | Chave assimétrica (pública compartilhável) |
| 2FA | TOTP (RFC 6238) | — | Google Authenticator compatível |
| Biblioteca 2FA | dev.samstevens.totp | 1.7.x | Geração e validação de TOTP |
| Criptografia TOTP | AES-256-GCM | — | Secret TOTP em repouso |
| TLS | TLS 1.3 | — | Comunicação externa |

---

## Integração de Pagamento

| Componente | Tecnologia | Versão | Uso |
|------------|------------|--------|-----|
| Gateway | Mercado Pago | — | Processamento de cartões, PIX, boleto |
| SDK Java | com.mercadopago:sdk-java | 2.1.x | Integração oficial Mercado Pago |

### Capabilities do Mercado Pago usadas no MVP

- `POST /v1/payments` — criar pagamento
- `POST /v1/payments/{id}/refunds` — estornar
- `GET /v1/payments/{id}` — consultar status
- Webhooks para notificações de atualização de status

---

## Infraestrutura

| Componente | Tecnologia | Uso |
|------------|------------|-----|
| Containerização | Docker | Empacotamento de cada microserviço |
| Orquestração | Docker Compose | Gerenciamento local e de desenvolvimento |
| Load Balancing | Spring Cloud Gateway | Roteamento entre serviços |
| CI/CD | GitHub Actions | Pipeline de entrega |

### Portas dos serviços

| Serviço | Porta |
|---------|-------|
| api-gateway | 8080 |
| user-service | 8081 |
| payment-service | 8082 |
| order-service | 8083 |
| notification-service | 8084 |
| fraud-service | 8085 (interno) |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Kafka | 9092 |

---

## Observabilidade

| Componente | Tecnologia | Uso |
|------------|------------|-----|
| Monitoramento | New Relic Java Agent | APM, métricas, traces distribuídos, logs |
| Logs | SLF4J + Logback (JSON) | Logs estruturados enviados ao New Relic |
| Tracing | OpenTelemetry + New Relic | Rastreamento distribuído entre serviços |
| Métricas | Micrometer → New Relic | Latência, throughput, taxa de erro por serviço |

### New Relic — alertas críticos configurados

| Alert | Threshold | Ação |
|-------|-----------|------|
| P99 latência > 900ms | 2 min | PagerDuty / Slack |
| Taxa de erro > 1% | 1 min | PagerDuty |
| Fraud rate > 5% | 5 min | Security Slack |
| Circuit breaker aberto | Imediato | DevOps Slack |
| DB conexões > 90% | 2 min | DevOps Slack |

---

## AI Agents

| Componente | Tecnologia | Versão | Uso |
|------------|------------|--------|-----|
| Claude AI | Anthropic Java SDK | 0.8.x | Análise contextual de fraude (borderline scores 70-89) |

---

## Testes

| Tipo | Framework | Uso |
|------|-----------|-----|
| Unitários | JUnit 5 + Mockito | Testes de unidade isolados |
| Integração | Testcontainers + Spring Boot Test | PostgreSQL, Redis, Kafka reais |
| SMTP fake | GreenMail | Testes do notification-service |
| Gateway mock | WireMock | Simular Mercado Pago e serviços externos |
| Segurança | Spring Security Test | Testes de autenticação/autorização |
| Carga | k6 | Load testing nos endpoints críticos |
| API | MockMvc / RestAssured | Testes de controllers |

---

## Documentação de API

| Componente | Tecnologia | Uso |
|------------|------------|-----|
| OpenAPI 3.0 | SpringDoc OpenAPI 2.7.x | Geração automática |
| UI | Swagger UI | Interface interativa |
| URL | `http://localhost:8080/swagger-ui.html` | Acesso via api-gateway |

---

## Utilitários

| Biblioteca | Versão | Uso |
|-----------|--------|-----|
| Lombok | 1.18.x | Redução de boilerplate (@Builder, @Slf4j) |
| MapStruct | 1.6.x | Mapeamento entre entidades e DTOs |
| Jackson | 2.17.x | Serialização JSON |
| Resilience4j | 2.x | Circuit breaker no api-gateway |

---

## IntelliJ IDEA — Configurações Recomendadas

### Plugins necessários

- **Lombok Plugin** — suporte a anotações Lombok
- **Spring Boot** — suporte ao framework
- **Docker** — gerenciamento de containers
- **SonarLint** — análise estática de código

### Configurações de compilação

```
File → Project Structure → Project
  SDK: Java 21
  Language Level: 21

File → Settings → Build → Compiler → Java Compiler
  Additional command line parameters: --enable-preview
```

### Code Style

```
File → Settings → Editor → Code Style → Java
  Tab size: 4
  Indent: 4
  Continuation indent: 8

Checkstyle: Google Java Style Guide
```
