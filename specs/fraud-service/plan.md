# Plano Técnico: Fraud Service

**Spec:** [spec.md](spec.md)
**Status:** Draft
**Responsável:** Dev 1
**Sprint:** 1

---

## Decisões Técnicas

| Decisão | Escolha | Alternativa | Motivo |
|---------|---------|-------------|--------|
| Modo de chamada | REST síncrono (chamado por payment-service) | Kafka assíncrono | Fraude tem que ser verificada ANTES do gateway — bloqueio obrigatório |
| Velocity checks | Redis sorted sets (sliding window) | DB query | Sub-10ms; DB seria gargalo para P99 < 200ms |
| IP blacklist | Redis Set permanente | PostgreSQL | Lookup O(1) no Redis; DB seria mais lento |
| Ajuste contextual Claude | Timeout 250ms → fallback | Sem timeout | SLA de 200ms do serviço não pode ser violado por Claude lento |
| Score storage | Redis temporário + DB para BLOCK/REVIEW | Apenas Redis | BLOCK precisa de auditoria persistente (PCI DSS) |

---

## Dependências

### Serviços consumidos
- Claude API (Anthropic) — apenas para scores entre 70–89 (REVIEW)

### Tópicos Kafka produzidos
- `fraud.detected` — quando score ≥ 90 (BLOCK)
- `fraud.review` — quando 70 ≤ score ≤ 89 (para futura fila de revisão manual)

### Tabelas do banco (schema: fraud_service)

| Tabela | Propósito |
|--------|-----------|
| `fraud_alerts` | Transações bloqueadas e em review — auditoria PCI DSS |
| `ip_blacklist` | IPs com histórico confirmado de fraude |

### Chaves Redis

| Key | TTL | Propósito |
|-----|-----|-----------|
| `fraud:velocity:{customerId}` | 5min | Sorted set com timestamps das últimas transações |
| `fraud:ip_blacklist:{ip}` | 24h (configurável) | Flag de IP em blacklist |
| `fraud:card:{tokenHash}:{accountCount}` | 24h | Número de contas usando o mesmo cartão |
| `fraud:avg:{customerId}` | 1h | Média histórica de gastos do cliente |

---

## Estrutura de Pacotes

```
src/main/java/com/acaboumony/fraud/
├── controller/
│   └── FraudController.java            (endpoint interno /internal/fraud/score)
├── service/
│   ├── FraudDetectionService.java      (orquestra regras + Claude)
│   ├── RuleEngineService.java          (regras determinísticas)
│   └── ClaudeContextAnalyzer.java      (ajuste contextual via Claude API)
├── repository/
│   ├── FraudAlertRepository.java
│   └── IpBlacklistRepository.java
├── domain/
│   ├── entity/
│   │   ├── FraudAlert.java
│   │   └── IpBlacklist.java
│   └── enums/
│       └── FraudDecision.java          (APPROVE, REVIEW, BLOCK)
├── dto/
│   ├── request/
│   │   └── FraudAnalysisRequest.java   (Record)
│   └── response/
│       └── FraudScore.java             (Record)
├── result/
│   └── FraudResult.java                (sealed interface)
├── config/
│   ├── RedisConfig.java
│   └── AnthropicConfig.java
├── event/
│   └── FraudEventProducer.java         (Kafka producer)
└── rules/
    ├── VelocityRule.java
    ├── AmountAnomalyRule.java
    ├── IpBlacklistRule.java
    └── DeviceFingerprintRule.java
```

---

## Implementação das Regras (Strategy Pattern)

```java
public interface FraudRule {
    int evaluate(FraudAnalysisRequest request, RedisTemplate<String, String> redis);
    String getReason();
}

// RuleEngineService aplica todas as regras e soma os pontos
public int calculateBaseScore(FraudAnalysisRequest request) {
    return rules.stream()
        .mapToInt(rule -> rule.evaluate(request, redis))
        .sum();
}
```

---

## Integração Claude API

```java
// Apenas chamado quando score está entre 70-89
public int getContextualAdjustment(FraudAnalysisRequest request, int baseScore) {
    // Timeout de 250ms — se ultrapassar, retorna 0 (sem ajuste)
    // Envia histórico do cliente + contexto da transação
    // Recebe ajuste -10 a +10
}
```

---

## Flyway Migrations

| Versão | Arquivo | Conteúdo |
|--------|---------|---------|
| V1 | `V1__create_fraud_alerts.sql` | Tabela fraud_alerts |
| V2 | `V2__create_ip_blacklist.sql` | Tabela ip_blacklist |

---

## Estratégia de Testes

| Tipo | Framework | Cenários |
|------|-----------|----------|
| Unitário | JUnit 5 + Mockito | Cada regra individualmente, acumulação de score |
| Integração | Testcontainers (PostgreSQL + Redis + Kafka) | Fluxo completo APPROVE/REVIEW/BLOCK |
| Claude mock | Mockito | Simular resposta, timeout, indisponibilidade |

---

## Configuração Docker Compose

```yaml
fraud-service:
  image: acaboumony/fraud-service:latest
  ports:
    - "8085:8085"
  environment:
    - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/fraud_db
    - SPRING_REDIS_HOST=redis
    - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    - FRAUD_BLOCK_THRESHOLD=90
    - FRAUD_REVIEW_THRESHOLD=70
    - FRAUD_ANALYSIS_TIMEOUT_MS=250
    - NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
    - NEW_RELIC_APP_NAME=acaboumony-fraud-service
  depends_on:
    - postgres
    - redis
    - kafka
```

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Claude API lento/indisponível | Média | Médio | Timeout 250ms → fallback sem ajuste |
| False positives (clientes legítimos bloqueados) | Média | Alto | Revisão manual via `fraud.review` + threshold configurável |
| Redis indisponível | Baixa | Alto | Fallback para score conservador = 50 + log crítico |
