# Agent: Fraud Detection Agent

**ID:** AGENT-001
**Tipo:** Background Service Agent (Java Spring)
**Linguagem:** Java 21 + Spring Boot
**Status:** Draft

---

## Visão Geral

O Fraud Detection Agent é um serviço interno que analisa transações em tempo real para detectar padrões fraudulentos. Combina regras determinísticas com análise contextual via Claude AI para casos borderline.

---

## Responsabilidades

1. Calcular fraud score (0–100) para cada transação em < 200ms
2. Aplicar regras determinísticas de detecção
3. Consultar Claude AI para análise contextual em casos borderline (score 70–89)
4. Publicar alertas de fraude no Kafka
5. Manter blacklist de IPs e dispositivos no Redis
6. Alimentar modelo de ML com dados rotulados

---

## Inputs

```
FraudAnalysisRequest:
  - transactionId
  - customerId
  - amountInCents
  - cardToken (últimos 6 chars)
  - ipAddress
  - deviceFingerprint
  - platform
  - liveSessionId (opcional)
  - geolocation (opcional)
```

---

## Outputs

```
FraudScore:
  - score: Integer [0-100]
  - decision: APPROVE | REVIEW | BLOCK
  - reasons: List<String>
  - analysisTimeMs: Long
```

---

## Pipeline de Análise

```
1. Regras Determinísticas (sempre)
   → Verificar IP blacklist (Redis)
   → Calcular velocity check (Redis counters)
   → Comparar com histórico do cliente (PostgreSQL)
   → Score base calculado
   
2. Análise Contextual Claude AI (apenas se score 70-89)
   → Enviar contexto completo para Claude
   → Claude analisa padrão histórico + contexto live
   → Retornar ajuste de score (-10 a +10)
   
3. Decisão final
   → APPROVE (0-69) | REVIEW (70-89) | BLOCK (90-100)
```

---

## Integração com Claude API

**Quando acionar:** Score entre 70 e 89 (zona cinzenta)

**Prompt base:**
```
Analise o risco desta transação:
- Score base de regras: {score}
- Fatores de risco identificados: {reasons}
- Histórico do cliente: {últimas 10 transações}
- Contexto: {live ou não, plataforma, horário}
- Média de gasto do cliente: {média}

Esta transação parece legítima ou suspeita? Ajuste o score em -10 a +10.
Responda apenas com JSON: {"adjustment": N, "reasoning": "..."}
```

**Timeout:** 150ms (se Claude não responder, usar score base)

---

## Eventos Kafka Publicados

| Tópico | Quando |
|--------|--------|
| `fraud.score.calculated` | Toda análise |
| `fraud.alert.high` | Score ≥ 90 |
| `fraud.alert.review` | Score 70–89 |
| `fraud.ip.blacklisted` | Novo IP adicionado à blacklist |

---

## Dados Persistidos

| Dado | Onde | TTL |
|------|------|-----|
| Velocity counters por customerId | Redis | 5 min |
| IP blacklist | Redis | Permanente (TTL via admin) |
| Histórico de análises | PostgreSQL | 2 anos (PCI DSS) |
| Modelo ML features | PostgreSQL | Permanente |

---

## Métricas Prometheus

- `fraud_score_histogram` — distribuição de scores
- `fraud_decisions_total{decision}` — contador por decisão
- `fraud_analysis_duration_ms` — latência de análise
- `fraud_claude_calls_total` — chamadas ao Claude AI
- `fraud_false_positives_total` — falsos positivos reportados

---

## SLA

- P99 de análise: < 200ms
- Timeout Claude: 150ms (fallback para score base)
- Disponibilidade: 99,99% (fraude não pode ficar offline)

---

## Dependências

- Redis (velocity checks + blacklist)
- PostgreSQL (histórico + modelo)
- Kafka (publicação de eventos)
- Claude API / Anthropic SDK Java (análise contextual)
- `TransactionService` (chamador)
