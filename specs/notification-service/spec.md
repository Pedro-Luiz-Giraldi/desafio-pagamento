# Spec: Notification Service

**ID:** SPEC-NTF-001
**Serviço:** notification-service
**Status:** Draft
**Revisores:** [ ] PM [ ] Arquiteto [ ] QA [ ] Security

---

## 1. Visão Geral

O notification-service é exclusivamente orientado a eventos. Ele consome eventos do Kafka publicados por outros serviços e envia emails transacionais. Não tem endpoints REST públicos para disparo de emails — toda comunicação é assíncrona via Kafka. Falhas no envio são silenciosas para o serviço produtor (não afetam o fluxo de pagamento).

---

## 2. Interface

```
Nenhum endpoint REST público.
Consome eventos do Kafka.
Envia emails via SMTP (Spring Mail / JavaMailSender).
```

---

## 3. Eventos Consumidos e Emails Disparados

| Tópico Kafka | Email Disparado | Destinatário |
|-------------|-----------------|-------------|
| `user.registered` | Boas-vindas + link de confirmação de email | Novo usuário |
| `user.login.blocked` | Alerta: conta bloqueada por tentativas excessivas | Usuário |
| `user.2fa.enabled` | Confirmação: autenticação de dois fatores ativada | Usuário |
| `order.created` | Confirmação do pedido com itens e total | Cliente |
| `transaction.completed` | Confirmação de pagamento com detalhes da transação | Cliente + Merchant |
| `transaction.failed` | Notificação de falha no pagamento | Cliente |
| `transaction.refunded` | Confirmação de estorno processado | Cliente |
| `fraud.detected` | Alerta de segurança para a equipe interna | Security team (email fixo configurado) |

---

## 4. EVENTO: user.registered

### 4.1 Payload consumido

```json
{
  "userId": "uuid",
  "email": "ana@loja.com.br",
  "fullName": "Ana Silva",
  "role": "MERCHANT",
  "confirmationToken": "uuid-token",
  "registeredAt": "2026-05-27T14:00:00Z"
}
```

### 4.2 Email disparado

- **Assunto:** "Bem-vindo(a) à Acabou o Mony! Confirme seu email"
- **Conteúdo:**
  - Saudação pelo nome
  - Link de confirmação: `https://app.acaboumony.com/confirm-email?token={confirmationToken}`
  - Link expira em 24h
- **From:** noreply@acaboumony.com

### 4.3 Casos Extremos

- Se email inválido (retorno SMTP) → gravar falha no banco para retry manual; não reprocessar automaticamente
- Se token expirado ao clicar → usuário solicita reenvio via user-service; novo evento gerado

---

## 5. EVENTO: transaction.completed

### 5.1 Payload consumido

```json
{
  "transactionId": "txn_xyz789",
  "mpPaymentId": 1234567890,
  "orderId": "uuid",
  "customerId": "uuid",
  "merchantId": "uuid",
  "customerEmail": "ana@email.com",
  "merchantEmail": "merchant@loja.com",
  "amountInCents": 8990,
  "currency": "BRL",
  "cardBrand": "visa",
  "cardLastFour": "4242",
  "installments": 1,
  "items": [{"description": "Vestido Azul Tam M", "quantity": 1, "unitPriceInCents": 8990}],
  "processedAt": "2026-05-27T14:00:00Z"
}
```

### 5.2 Emails disparados (2 emails)

**Para o cliente:**
- **Assunto:** "Pagamento confirmado — Pedido #{orderId}"
- **Conteúdo:** Valor, método de pagamento (visa **** 4242), parcelas, data, itens do pedido

**Para o merchant:**
- **Assunto:** "Nova venda confirmada — R$ {valor}"
- **Conteúdo:** Resumo da venda, items, valor líquido estimado

### 5.3 Invariantes

- `cardToken` e número completo do cartão NUNCA incluídos no email
- Apenas `cardBrand` + `cardLastFour` são exibidos
- CPF nunca incluído no email

---

## 6. EVENTO: transaction.refunded

### 6.1 Payload consumido

```json
{
  "refundId": "ref_abc123",
  "transactionId": "txn_xyz789",
  "orderId": "uuid",
  "customerEmail": "ana@email.com",
  "amountRefundedInCents": 8990,
  "isFullRefund": true,
  "reason": "CUSTOMER_REQUEST",
  "estimatedArrivalDays": 5,
  "refundedAt": "2026-05-27T15:00:00Z"
}
```

### 6.2 Email disparado

- **Assunto:** "Estorno processado — R$ {valor}"
- **Conteúdo:** Valor estornado, prazo de crédito (3–5 dias úteis), ID de referência do estorno

---

## 7. EVENTO: user.login.blocked

### 7.1 Payload consumido

```json
{
  "userId": "uuid",
  "email": "ana@loja.com.br",
  "blockedAt": "2026-05-27T14:00:00Z",
  "unlockAt": "2026-05-27T14:30:00Z",
  "ipAddress": "anonimizado",
  "attemptCount": 5
}
```

### 7.2 Email disparado

- **Assunto:** "⚠️ Acesso à sua conta bloqueado temporariamente"
- **Conteúdo:**
  - Conta bloqueada por 30 min
  - Hora de desbloqueio
  - Link "Não fui eu" para contato com suporte
  - Dica de segurança

---

## 8. EVENTO: fraud.detected

### 8.1 Destinatário

Email fixo configurado em variável de ambiente: `SECURITY_ALERT_EMAIL`

### 8.2 Email disparado

- **Assunto:** `[FRAUD ALERT] Score {score} — Transaction blocked`
- **Conteúdo:** transactionId, customerId (UUID — sem PII completo), score, reasons, timestamp
- **NUNCA incluir:** número de cartão, token, dados bancários completos

---

## 9. Template Engine

- **Tecnologia:** Thymeleaf (Spring Boot built-in)
- **Templates HTML** em `src/main/resources/templates/email/`
- Um template por tipo de email
- Suporte a internacionalização (pt-BR como padrão)

---

## 10. Estratégia de Retry e Resiliência

### 10.1 Falha no envio de email

| Situação | Comportamento |
|----------|--------------|
| SMTP indisponível | Retry automático: 3 tentativas com backoff exponencial (1s, 5s, 30s) |
| Email inválido (bounce) | Gravar como falha permanente, não retentar |
| Conteúdo inválido | Gravar como falha, alertar via log de erro |
| Kafka consumer lag | New Relic alerta se lag > 1000 mensagens por 5 min |

### 10.2 Princípio de falha silenciosa

O notification-service falhar **não deve afetar** o fluxo de pagamento. O payment-service publica o evento no Kafka e segue em frente — não espera confirmação do email.

### 10.3 Rastreabilidade

- Cada email enviado grava um registro no banco: `notification_log (id, event_type, recipient, status, error_message, created_at)`
- Logs estruturados com `transactionId` ou `userId` para correlação

---

## 11. Casos Extremos

### CE-001: Evento duplicado no Kafka (redelivery)
- Verificar `notificationId` no banco antes de enviar
- Se já enviado: ignorar silenciosamente (idempotência)
- Log de deduplicação para auditoria

### CE-002: Campos ausentes no evento
- Logar erro detalhado (sem PII)
- Dead Letter Queue (DLQ) para inspeção manual
- Nunca lancar exceção que quebre o consumer loop

### CE-003: Volume alto (ex: 1000+ transações em poucos segundos)
- Kafka consumer group com múltiplas instâncias do notification-service
- SMTP rate limiting: respeitar limites do provedor (ex: 50 emails/seg)
- Queue interna se necessário

### CE-004: Template corrompido
- Fallback para email texto puro com campos essenciais
- Alerta no New Relic para correção do template

---

## 12. Performance

| Operação | P50 | P99 |
|----------|-----|-----|
| Consumir evento Kafka | 5ms | 20ms |
| Renderizar template | 10ms | 50ms |
| Enviar via SMTP | 100ms | 500ms |
| **Total por email** | **115ms** | **570ms** |

Throughput esperado: até 500 emails/min em picos.

---

## 13. Segurança

- SMTP com TLS/STARTTLS obrigatório
- Credenciais SMTP em variáveis de ambiente — nunca hardcoded
- `SECURITY_ALERT_EMAIL` em variável de ambiente
- Dados sensíveis (número de cartão, CPF, senhas) nunca incluídos em nenhum email
- Rate limiting por destinatário: max 10 emails/hora para o mesmo endereço
- Headers anti-spam: SPF, DKIM, DMARC configurados no domínio
