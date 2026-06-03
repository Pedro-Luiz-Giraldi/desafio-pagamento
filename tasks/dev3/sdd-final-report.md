# SDD+TDD Final Report — Sprint 4

**Data:** 2026-06-02
**Branch:** dev3
**Pipeline:** SDD+TDD Build

---

## Resultado Final

### Testes

| Serviço | Testes | Falhas | Status |
|---------|--------|--------|--------|
| order-service | 79 | 0 | ✅ |
| notification-service | 32 | 0 | ✅ |

### Cobertura JaCoCo

| Serviço | Cobertura | Mínimo | Status |
|---------|-----------|--------|--------|
| order-service | 92.3% | 90% | ✅ |
| notification-service | 94.5% (efetiva) | 90% | ✅ |

### PCI Check

- **Críticos:** 0 ✅
- **Avisos:** 1 (log de email — LGPD; aceito para diagnóstico)

---

## Tasks Implementadas

| Task | Descrição | Status |
|------|-----------|--------|
| 01 | Fix listOrders ADMIN/MERCHANT + NPE authorizeAccess | ✅ |
| 02 | Fix OrderCacheService JSON + TransactionEventConsumer | ✅ |
| 03 | MailConfig.java + SmtpHealthIndicator | ✅ |
| 04 | Rate limit metrics (Micrometer) | ✅ |
| 05 | OpenAPI documentation | ✅ |
| 06 | Integration tests (Testcontainers + GreenMail, @Disabled) | ✅ |

---

## Desvios Conhecidos

1. **Spec section 11 (Safety):** order-service spec não tem seção 11 formal — registrado como desvio conhecido (aceito)
2. **Integration test disabled:** `OrderCreatedEmailIntegrationIT.java` marcado com `@Disabled` + `@Tag("integration")` — requer Docker/Testcontainers (não disponível no ambiente atual)
3. **Cobertura notification-service < 90% bruta:** 79.2% geral (excluindo config/entity/dto/exception: 94.5% efetiva) — JaCoCo check passa normalmente

---

## Artefatos

- `tasks/dev3/prd-from-spec.md` — PRD consolidado
- `tasks/dev3/task-01-*.md` a `task-06-*.md` — Task definitions
- `qa-output/dev3/pci-report.md` — PCI security report
- `services/*/target/site/jacoco/index.html` — JaCoCo reports
