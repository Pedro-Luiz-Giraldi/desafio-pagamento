# Plano Técnico: [Nome do Serviço / Feature]

**Spec:** [link para spec.md]
**Status:** Draft | Review | Approved
**Responsável:** Dev [N]
**Sprint:** [N]

---

## Decisões Técnicas

| Decisão | Escolha | Alternativa Considerada | Motivo |
|---------|---------|------------------------|--------|
| | | | |

---

## Dependências

### Serviços externos consumidos
- ...

### Tópicos Kafka produzidos
- `topico.nome` — quando / por quê

### Tópicos Kafka consumidos
- `topico.nome` — ação tomada ao consumir

### Tabelas do banco (schema isolado por serviço)
- `nome_tabela` — propósito

### Chaves Redis utilizadas
- `prefixo:{id}` — TTL — propósito

---

## Estrutura de Pacotes

```
src/main/java/com/acaboumony/[service]/
├── controller/       → orquestração, sem lógica de negócio
├── service/          → lógica de negócio, sem estado
├── repository/       → Spring Data JPA
├── domain/
│   ├── entity/       → entidades JPA
│   └── enums/        → enums do domínio
├── dto/
│   ├── request/      → Records de input
│   └── response/     → Records de output
├── exception/        → exceções tipadas do domínio
├── config/           → beans de configuração
└── mapper/           → conversão domain ↔ dto
```

---

## Flyway Migrations

| Versão | Arquivo | Conteúdo |
|--------|---------|---------|
| V1 | `V1__create_[tabela].sql` | Schema inicial |

---

## Estratégia de Testes

| Tipo | Framework | O que testar |
|------|-----------|-------------|
| Unitário | JUnit 5 + Mockito | Lógica de negócio isolada |
| Integração | Testcontainers | PostgreSQL, Redis, Kafka reais |
| API | MockMvc / RestAssured | Controllers, validação de input |

---

## Configuração Docker Compose

```yaml
service-name:
  image: acaboumony/service-name:latest
  ports:
    - "808X:808X"
  environment:
    - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/service_db
    - SPRING_REDIS_HOST=redis
    - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
    - NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
  depends_on:
    - postgres
    - redis
    - kafka
```

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| | | | |
