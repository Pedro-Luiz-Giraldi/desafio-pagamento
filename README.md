# Acabou o Mony

API de pagamentos digitais para merchants e consumidores brasileiros. Processa transações via Mercado Pago com autenticação robusta, detecção de fraude em tempo real e notificações automáticas.

---

## O Problema

Merchants precisam de uma API de pagamentos confiável, rápida e segura — com P99 < 1s, proteção antifraude integrada e rastreabilidade completa das transações.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Linguagem | Java 21 (Virtual Threads, Records, Sealed Classes) |
| Framework | Spring Boot 3.4 |
| API Gateway | Spring Cloud Gateway |
| Banco de dados | PostgreSQL 16 (um banco por serviço) |
| Cache | Redis 7 |
| Mensageria | Apache Kafka 3.7 |
| Infra | Docker Compose |
| Gateway de pagamento | Mercado Pago |
| AI Agents | Claude API (Anthropic) |
| Monitoramento | New Relic |

---

## Microserviços

| Serviço | Porta | Responsabilidade |
|---------|-------|-----------------|
| `api-gateway` | 8080 | Roteamento, JWT validation, rate limiting, circuit breaker |
| `user-service` | 8081 | Cadastro, autenticação, 2FA (TOTP) |
| `payment-service` | 8082 | Processamento de pagamentos via Mercado Pago |
| `order-service` | 8083 | Criação e gestão de pedidos |
| `notification-service` | 8084 | Emails transacionais assíncronos via Kafka |
| `fraud-service` | 8085 | Score de fraude em tempo real (interno) |

### Agentes AI (background)

| Agent | Trigger | Função |
|-------|---------|--------|
| Fraud Detection Agent | Chamada síncrona interna | Análise contextual Claude AI para scores borderline (70-89) |
| Transaction Processor Agent | Kafka consumer | Processamento pós-pagamento |

---

## Fluxo Principal

```
1. POST /api/v1/orders         → criar pedido (order-service)
2. POST /api/v1/transactions   → processar pagamento (payment-service)
   → fraud check < 200ms
   → Mercado Pago < 500ms
   → Kafka → order.status = PAID + email de confirmação
```

---

## Metodologia

**SDD (Spec-Driven Development) + TDD + Spec-Kit**

```
Spec → Plan → Tasks → Test (RED) → Code (GREEN) → Refactor → Validate
```

Nenhum código de produção sem spec aprovada em `specs/` e testes escritos antes.

---

## Estrutura do Projeto

```
acabou-o-mony/
│
├── .specify/                       # Spec-Kit: constitution + templates
│   ├── memory/constitution.md      # Princípios e stack imutáveis
│   └── templates/                  # Templates de spec, plan, tasks
│
├── specs/                          # SDD — especificações antes do código
│   ├── api-gateway/                # spec.md, plan.md, tasks.md
│   ├── user-service/
│   ├── payment-service/
│   ├── order-service/
│   ├── notification-service/
│   └── fraud-service/
│
├── agents/                         # Specs dos agentes AI
│   ├── fraud-detection/
│   └── transaction-processor/
│
├── docs/
│   ├── architecture/
│   │   ├── system-overview.md      # Arquitetura, diagramas, fluxos
│   │   └── api-contracts.md        # Contratos REST entre módulos
│   └── tech/
│       ├── stack.md                # Stack detalhado
│       └── database-schema.md      # Schema PostgreSQL por serviço
│
├── src/                            # Código Java (a ser criado — TDD)
│   └── main/java/com/acaboumony/
│       ├── gateway/
│       ├── user/
│       ├── payment/
│       ├── order/
│       ├── notification/
│       └── fraud/
│
├── docker-compose.yml              # A ser criado — Dev 2 lidera
├── CLAUDE.md                       # Contexto do projeto para Claude Code
├── TEAM.md                         # Divisão de responsabilidades do time
└── README.md
```

---

## Time

| Pessoa | Responsabilidade |
|--------|-----------------|
| Dev 1 | `payment-service` + `fraud-service` |
| Dev 2 | `user-service` + `api-gateway` + Infra + CI/CD |
| Dev 3 | `order-service` + `notification-service` |

Ver `TEAM.md` para divisão detalhada por sprint, interfaces e pontos de sincronização.

---

## Metas Técnicas

| Métrica | Target |
|---------|--------|
| Latência P99 (transações) | < 1 segundo |
| Throughput | 10.000+ TPS |
| Uptime | 99,99% |
| Fraud score P99 | < 200ms |
| Cobertura de testes | ≥ 90% por módulo |
| Compliance | PCI DSS Level 1 + LGPD |

---

## Roadmap

| Sprint | Entrega |
|--------|---------|
| 1 | JWT + api-gateway + payment-service (MVP) + fraud-service + order-service (base) |
| 2 | 2FA + estorno + notification-service + job de expiração de pedidos |
| 3 | New Relic + CI/CD + circuit breaker + Claude AI no fraud |
| 4 | Production ready: load testing k6 + security audit |

---

## Como contribuir

1. Leia `specs/[servico]/spec.md` antes de qualquer coisa
2. Leia `specs/[servico]/plan.md` para decisões técnicas
3. Consulte as tarefas em `specs/[servico]/tasks.md`
4. Siga SDD + TDD — **testes antes do código**
5. PR com referência à spec (ex: "Implements SPEC-PAY-001")
6. Code review de pelo menos 1 outro dev

Ver `CLAUDE.md` para contexto completo e convenções de código.
Ver `.specify/memory/constitution.md` para princípios absolutos do projeto.
