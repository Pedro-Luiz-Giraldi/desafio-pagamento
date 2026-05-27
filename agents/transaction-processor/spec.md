# Agent: Transaction Processor Agent

**ID:** AGENT-004
**Tipo:** Event-Driven Background Agent (Kafka Consumer)
**Linguagem:** Java 21 + Spring Boot + Virtual Threads
**Status:** Draft

---

## Visão Geral

O Transaction Processor Agent é responsável pelos efeitos colaterais assíncronos pós-transação que não pertencem ao `notification-service` nem ao `order-service`. Foca em consolidação de métricas de GMV, reconciliação com o Mercado Pago e disparo de webhooks para os endpoints configurados pelos próprios merchants.

---

## Responsabilidades

1. Consolidar métricas de GMV em tempo real por merchant e período
2. Disparar webhooks para endpoints configurados pelo merchant (notificação de nova venda)
3. Reconciliar status de pagamentos com a API do Mercado Pago (para casos edge de inconsistência)
4. Processar eventos de falha e acionar fluxo de retry
5. Publicar eventos de DLQ para inspeção manual após esgotar retries

---

## Eventos Kafka Consumidos

| Tópico | Ação |
|--------|------|
| `transaction.completed` | Atualizar GMV + disparar webhook do merchant |
| `transaction.failed` | Logar para análise + incrementar contador de falhas por merchant |
| `transaction.refunded` | Decrementar GMV + disparar webhook de estorno do merchant |
| `fraud.detected` | Incrementar contador de fraude por merchant + alertas internos |

---

## Pipeline de Processamento

### Evento: transaction.completed

```
1. Atualizar métricas de GMV no Redis
   → Incrementar: gmv:{merchantId}:daily, gmv:{merchantId}:monthly
   → TTL: 1 dia para daily, 35 dias para monthly

2. Disparar webhook do merchant (se configurado)
   → POST para URL cadastrada pelo merchant
   → Payload: transactionId, orderId, amountInCents, status, timestamp
   → Autenticação: HMAC-SHA256 no header X-Acaboumony-Signature

3. Reconciliação com Mercado Pago (assíncrona, baixa prioridade)
   → Verificar se mpPaymentId está com status "approved" na API do MP
   → Se inconsistente: publicar evento de alerta interno
```

### Evento: transaction.refunded

```
1. Decrementar GMV no Redis
   → gmv:{merchantId}:daily e monthly decrementados pelo valor estornado

2. Disparar webhook de estorno do merchant (se configurado)
   → Mesmo endpoint configurado, payload com status "refunded"
```

---

## Webhook do Merchant

Os merchants podem configurar um endpoint próprio para receber notificações de pagamento. Isso é diferente de emails (responsabilidade do `notification-service`).

| Campo | Descrição |
|-------|-----------|
| URL | Endpoint HTTPS cadastrado pelo merchant no painel |
| Método | POST |
| Autenticação | Header `X-Acaboumony-Signature: HMAC-SHA256(payload, merchantSecret)` |
| Timeout | 10s por tentativa |
| Payload | `{ transactionId, orderId, amountInCents, status, currency, timestamp }` |

---

## Garantia de Entrega

| Mecanismo | Detalhe |
|-----------|---------|
| Retry automático | 3 tentativas com backoff exponencial (1s, 5s, 30s) |
| Dead Letter Queue | Após 3 falhas → tópico `transaction.events.dlq` |
| Idempotência | Cada evento processado uma única vez (offset tracking + deduplication key no Redis) |
| Timeout | 10s por operação externa (webhook) |

---

## Tratamento de Falhas

| Cenário | Comportamento |
|---------|--------------|
| Webhook do merchant offline | Retry 3x com backoff; após falha → DLQ; merchant notificado por email via notification-service |
| Mercado Pago API indisponível na reconciliação | Skipped com log; reprocessado no próximo ciclo |
| Redis indisponível (GMV) | Log de alerta; métrica não atualizada (não bloqueia o fluxo) |
| Todas as operações falham | Transação permanece aprovada; falhas são assíncronas e não afetam o pagamento |

---

## Eventos Kafka Publicados

| Tópico | Quando |
|--------|--------|
| `webhook.merchant.sent` | Webhook do merchant entregue com sucesso |
| `webhook.merchant.failed` | Após esgotar retries do webhook |
| `gmv.updated` | GMV atualizado no Redis |

---

## Métricas (New Relic)

- `agent_transactions_processed_total` — eventos processados
- `agent_webhook_sent_total{status}` — webhooks enviados (success/failed)
- `agent_webhook_latency_ms` — latência dos webhooks para merchants
- `agent_gmv_updated_total` — atualizações de GMV

---

## SLA

- Webhook para endpoint do merchant: entregue em < 15s após pagamento
- Atualização de GMV no Redis: < 5s após receber evento Kafka

---

## Dependências

- Kafka (eventos de entrada e saída)
- Redis (GMV counters + deduplication)
- Mercado Pago API (reconciliação de status)
- Endpoints HTTPS configurados pelos merchants (webhooks)
