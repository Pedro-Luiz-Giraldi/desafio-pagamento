# Constituição do Projeto — Acabou o Mony

**Versão:** 2.0
**Data:** 2026-05-27

---

## Missão

Processar pagamentos digitais com segurança, velocidade e confiabilidade para merchants e consumidores brasileiros. API de pagamentos via Mercado Pago com autenticação robusta, detecção de fraude em tempo real e notificações automáticas.

---

## Princípios Absolutos

1. **Spec antes de código** — nenhum código de produção sem spec aprovada em `specs/`
2. **TDD obrigatório** — testes escritos antes da implementação (RED → GREEN → REFACTOR)
3. **Segurança não negociável** — PCI DSS Level 1, LGPD, zero dados sensíveis em logs
4. **Performance primeiro** — P99 < 1s para transações; toda decisão de design considera latência
5. **Falha com dignidade** — erros tipados, retryable flag, mensagens amigáveis ao usuário
6. **Microserviços independentes** — cada serviço tem seu próprio banco, comunica via Kafka, nunca acessa banco de outro serviço diretamente

---

## Stack Imutável

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | Java 21 (nunca sugerir outra sem solicitação explícita) |
| Framework | Spring Boot 3.4 |
| API Gateway | Spring Cloud Gateway |
| Banco | PostgreSQL 16 (um schema por serviço) |
| Cache | Redis 7 |
| Mensageria | Apache Kafka 3.7 |
| Gateway de Pagamento | Mercado Pago (SDK Java 2.1.x) |
| Monitoramento | New Relic (Java Agent) |
| Infra | Docker Compose |
| AI Agents | Claude API (Anthropic) |
| Testes | JUnit 5 + Mockito + Testcontainers |

---

## Microserviços

| Serviço | Porta | Responsabilidade Principal |
|---------|-------|---------------------------|
| api-gateway | 8080 | Roteamento, JWT validation, rate limiting |
| user-service | 8081 | Cadastro, autenticação, 2FA |
| payment-service | 8082 | Transações, estornos via Mercado Pago |
| order-service | 8083 | Criação e gestão de pedidos |
| notification-service | 8084 | Emails assíncronos via Kafka |
| fraud-service | 8085 | Score de fraude (chamada interna do payment-service) |

---

## Convenções de Código Obrigatórias

- DTOs como Java Records imutáveis
- Resultados como sealed interfaces (Success/Failure) — nunca null em APIs públicas
- Logs estruturados JSON via SLF4J — nunca logar: número de cartão, CVV, CPF, senha, token completo
- Exceções tipadas por domínio — nunca `RuntimeException` genérica
- Virtual Threads para todas as operações de I/O
- Pattern matching em switch/instanceof
- Respostas REST: envelope `{ data, meta, errors }` + RFC 7807 para erros

---

## Comunicação Entre Serviços

- **Síncrona (REST):** api-gateway → serviços; payment-service → fraud-service
- **Assíncrona (Kafka):** eventos de domínio entre serviços
- **Proibido:** serviço acessar banco de outro serviço diretamente

## Tópicos Kafka (por domínio)

| Tópico | Produtor | Consumidores |
|--------|---------|--------------|
| `user.registered` | user-service | notification-service |
| `user.login.blocked` | user-service | notification-service |
| `user.2fa.enabled` | user-service | notification-service |
| `order.created` | order-service | notification-service |
| `transaction.completed` | payment-service | order-service, notification-service |
| `transaction.failed` | payment-service | notification-service |
| `transaction.refunded` | payment-service | order-service, notification-service |
| `fraud.detected` | fraud-service | payment-service, notification-service |
| `fraud.review` | fraud-service | (futuro: review queue) |

---

## Metas de Performance

| Métrica | Target |
|---------|--------|
| Transação P99 | < 1.000ms |
| Auth P99 | < 300ms |
| Fraud score P99 | < 200ms |
| Uptime | 99,99% |
| Throughput | 10.000+ TPS |

---

## Cobertura Mínima de Testes

- **90%** por módulo (contexto financeiro — obrigatório)
- **100%** dos casos extremos da spec cobertos por testes

---

## Definition of Done

Nenhuma história concluída sem:
- [ ] Spec escrita, revisada e aprovada em `specs/`
- [ ] Testes escritos **antes** da implementação (TDD)
- [ ] Cobertura ≥ 90%
- [ ] Todos os casos extremos da spec cobertos
- [ ] Code review por pelo menos 1 outro dev comparando contra a spec
- [ ] Zero dados sensíveis em logs
- [ ] Documentação de API atualizada
