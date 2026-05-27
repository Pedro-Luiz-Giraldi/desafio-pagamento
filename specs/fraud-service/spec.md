# Spec: Fraud Service

**ID:** SPEC-FRD-001
**Serviço:** fraud-service
**Status:** Draft
**Revisores:** [ ] PM [ ] Arquiteto [ ] QA [ ] Security

---

## 1. Visão Geral

O fraud-service calcula em tempo real um score de risco para cada transação antes de ela atingir o gateway Mercado Pago. É chamado de forma síncrona pelo payment-service. Combina regras determinísticas com análise contextual via Claude AI para casos borderline.

---

## 2. Interface

```
Chamada interna — não exposta via REST público
POST /internal/fraud/score
```

**Service:** `FraudDetectionService.score(FraudAnalysisRequest request): FraudScore`

Chamado exclusivamente pelo `payment-service` antes de atingir o gateway.

---

## 3. Tipos de Dados

### Input — FraudAnalysisRequest

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| transactionId | String | Sim | ID temporário da transação em análise |
| customerId | UUID | Sim | ID do cliente |
| amountInCents | Long | Sim | Valor em centavos |
| paymentMethodId | String | Sim | Método de pagamento ("visa", "master", etc.) |
| ipAddress | String | Sim | IP da requisição (anonimizado nos logs) |
| deviceFingerprint | String | Não | Hash do dispositivo |
| latitude | Double | Não | Geolocalização (se disponível) |
| longitude | Double | Não | Geolocalização (se disponível) |

### Output — FraudScore

| Campo | Tipo | Descrição |
|-------|------|-----------|
| score | Integer | 0 a 100 (0 = sem risco, 100 = fraude certa) |
| decision | String | "APPROVE", "REVIEW", "BLOCK" |
| reasons | List\<String\> | Fatores que contribuíram para o score (nunca enviados ao cliente) |
| analysisTimeMs | Long | Tempo de análise |

### Thresholds de Decisão

| Score | Decisão | Ação |
|-------|---------|------|
| 0 – 69 | APPROVE | Transação segue para o gateway |
| 70 – 89 | REVIEW | Segue para o gateway + alerta para revisão manual |
| 90 – 100 | BLOCK | Transação bloqueada, evento de fraude publicado |

---

## 4. Regras de Pontuação Determinísticas

Cada regra adiciona pontos ao score:

| Regra | Pontos | Descrição |
|-------|--------|-----------|
| Velocity: 3+ transações em 5 min | +30 | Mesmo customerId |
| Valor 5x acima da média histórica do cliente | +25 | Comparado à média dos últimos 30 dias |
| IP em blacklist | +40 | IP com histórico de fraude confirmado |
| País do IP diferente do país do cadastro | +20 | Geolocation anomaly |
| Novo dispositivo + valor acima de R$500 | +15 | Combinação de risco |
| Mesmo cartão (paymentMethodId hash) em 3+ contas | +35 | Card sharing suspeito |
| Horário incomum (02h–05h) + valor acima de R$300 | +10 | Padrão noturno suspeito |
| Primeira compra do cliente + valor máximo (R$999,99) | +20 | Comportamento atípico |
| IP mudou em menos de 1 min para o mesmo cliente | +25 | VPN/proxy suspeito |

---

## 5. Análise Contextual via Claude AI (casos borderline)

Quando score está entre **70–89 (REVIEW)**, o Fraud Detection Agent (Claude API) é acionado:

- Analisa histórico completo do cliente (padrão de gastos, frequência)
- Considera contexto temporal (horário comercial vs. madrugada)
- Retorna `contextualRiskAdjustment` no intervalo [-10, +10]
- Score final = score base + ajuste contextual (capped em [0, 100])

Se Claude API estiver indisponível: manter score base sem ajuste (fallback seguro).

---

## 6. Pré-condições

- `customerId` existe no sistema
- `amountInCents` é positivo
- `ipAddress` é um IP válido

---

## 7. Pós-condições — BLOCK

- Evento `fraud.detected` publicado no Kafka
- `FraudAlert` gravado no banco para revisão da equipe de segurança
- Cliente NÃO é notificado do motivo real (anti-gaming)
- payment-service retorna `SUSPECTED_FRAUD` sem detalhes do score

---

## 8. Invariantes

1. Score nunca é compartilhado com o cliente na resposta (apenas `decision`)
2. Análise deve completar em P99 < 200ms
3. Em caso de timeout da análise (> 250ms), usar score conservador de 50 (APPROVE com log de alerta)
4. Regras determinísticas são aplicadas sempre, mesmo sem Claude disponível
5. Mesmo input sempre produz mesmo output determinístico (sem randomness nas regras)

---

## 9. Casos Extremos

### CE-001: Primeiro cliente (sem histórico)
- Score base de 20 (risco médio-baixo por falta de histórico)
- Regra "primeira compra + valor máximo" se aplicável

### CE-002: Claude API indisponível
- Usar apenas regras determinísticas, sem ajuste contextual
- Log de alerta registrado para monitoramento
- Score base mantido sem modificação

### CE-003: Velocity muito alta (ataque em massa)
- Score pode acumular múltiplas regras e chegar a 100
- BLOCK imediato, evento `fraud.detected` publicado
- IP adicionado automaticamente à blacklist por 24h

### CE-004: Merchant com padrão suspeito
- Análise inclui padrão do merchant, não só do cliente
- Score elevado notificado ao time de segurança via `fraud.review` event

### CE-005: IP em blacklist, mas cliente com histórico longo e limpo
- Regras determinísticas têm precedência
- Score ainda inclui +40 para IP blacklistado
- Ajuste contextual do Claude pode reduzir em até -10
- Mínimo de 30 pontos por IP blacklistado mesmo com ajuste

---

## 10. Exemplos Concretos

### Exemplo 1 — Transação aprovada (baixo risco)

**Input:** Cliente regular, R$89,90, mesmo dispositivo, mesmo IP habitual, segunda compra do dia

**Output:**
```json
{
  "score": 5,
  "decision": "APPROVE",
  "reasons": [],
  "analysisTimeMs": 45
}
```

### Exemplo 2 — Bloqueado (fraude clara)

**Input:** IP blacklistado + 5 transações em 2 min + novo dispositivo + R$999,99

**Output:**
```json
{
  "score": 95,
  "decision": "BLOCK",
  "reasons": ["IP_BLACKLISTED", "VELOCITY_EXCEEDED", "NEW_DEVICE_HIGH_VALUE"],
  "analysisTimeMs": 62
}
```

### Exemplo 3 — Review (borderline, Claude acionado)

**Input:** Novo dispositivo + horário incomum (03h) + R$450,00. Score base: 25. Claude analisa histórico do cliente (comprador frequente, histórico limpo) → ajuste -10.

**Output:**
```json
{
  "score": 15,
  "decision": "APPROVE",
  "reasons": ["NEW_DEVICE", "UNUSUAL_HOUR"],
  "analysisTimeMs": 180
}
```

---

## 11. Efeitos Colaterais

| Efeito | Síncrono/Assíncrono | Obrigatório |
|--------|---------------------|-------------|
| Atualizar velocity counters no Redis | Síncrono | Sim |
| Publicar `fraud.detected` no Kafka (se BLOCK) | Assíncrono | Sim |
| Gravar FraudAlert no banco (se BLOCK ou REVIEW) | Síncrono | Sim |
| Chamar Claude AI (se REVIEW) | Síncrono (com timeout) | Não (fallback disponível) |

---

## 12. Performance

| Etapa | P50 | P99 |
|-------|-----|-----|
| Regras determinísticas | 10ms | 30ms |
| Redis velocity checks | 5ms | 20ms |
| Claude AI (quando acionado) | 100ms | 180ms |
| **Total (APPROVE/BLOCK)** | **20ms** | **60ms** |
| **Total (REVIEW com Claude)** | **120ms** | **200ms** |

Timeout: 250ms. Se exceder → fallback para score = 50, APPROVE, log de alerta.

---

## 13. Segurança

- Regras de scoring nunca expostas via API (anti-gaming)
- Score não enviado ao cliente — apenas decisão final
- Dados de análise retidos por 2 anos para auditoria PCI DSS
- IP armazenado anonimizado nos logs (últimos 8 bits zerados)
- Modelos e regras revisados mensalmente com dados rotulados
- Blacklist de IPs gerenciada com TTL configurable (default 24h)
