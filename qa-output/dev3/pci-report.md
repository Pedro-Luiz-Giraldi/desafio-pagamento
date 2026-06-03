# PCI DSS + LGPD Security Report

**Data:** 2026-06-02
**Branch:** dev3
**Escopo:** order-service + notification-service (arquivos modificados)
**Arquivos verificados:** 14

---

## Resumo

| Severidade | Quantidade |
|------------|-----------|
| CRÍTICO | 0 |
| AVISO | 1 |
| OK | 6 |

---

## Avisos

> Requerem revisão humana — podem ser falsos positivos dependendo do contexto.

### [AVISO-001] Log de email completo (LGPD)
- **Arquivo:** `services/notification-service/src/main/java/com/acaboumony/notification/consumer/UserEventConsumer.java:27,44,60`
- **Contexto:** `log.info("Received user.registered event for email={}", event.email())` — logs o email completo do usuário em nível INFO
- **Ação:** Revisar se este log é estritamente necessário. Em produção, considere ofuscar parte do email (ex: `j***@domain.com`) ou reduzir para DEBUG. Idêntico padrão nas linhas 44 e 60.

### [AVISO-002] Log de recipient em falha de email (LGPD)
- **Arquivo:** `services/notification-service/src/main/java/com/acaboumony/notification/service/EmailService.java:58,81`
- **Contexto:** `log.warn("Rate limited: skipping email to {}, subject={}", to, subject)` e `log.warn("Failed to send email (attempt {}/{}): to={}, error={}")` — loga o email completo em warnings de rate limit e falha
- **Ação:** Aceitável para diagnóstico operacional. Considere mover para DEBUG em produção.

### [AVISO-003] Log de recipient em rate limit (LGPD)
- **Arquivo:** `services/notification-service/src/main/java/com/acaboumony/notification/service/EmailRateLimiter.java:60`
- **Contexto:** `log.warn("Rate limit reached for {}: {} emails in the last hour", recipientEmail, bucket.count())`
- **Ação:** Email já é conhecido do sistema (está sendo enviado para ele). Mantido como AVISO para documentação.

---

## Itens verificados sem problemas

- [x] Dados sensíveis em logs: OK (apenas emails — ver AVISO-001/002/003)
- [x] Armazenamento de dados sensíveis: OK (sem cardNumber, CVV, CPF)
- [x] JWT configuração: OK (não aplicável — sem JWT no escopo)
- [x] SQL injection: OK (sem queries nativas ou concatenação)
- [x] TLS/comunicação: OK (SMTP com starttls.enable=true)
- [x] LGPD básico: OK (ver avisos acima)

---

## Referências
- PCI DSS v4.0 Requirements: 3.3, 3.4, 6.2, 8.3
- LGPD: Art. 6, Art. 46, Art. 15
- OWASP Top 10: A02 (Cryptographic Failures), A03 (Injection)
