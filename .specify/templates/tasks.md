# Tarefas: [Nome do Serviço / Feature]

**Spec:** [link para spec.md]
**Plano:** [link para plan.md]
**Responsável:** Dev [N]
**Sprint:** [N]

---

## Tarefas Ordenadas

> Seguir TDD: escrever teste → ver falhar → implementar → ver passar → refatorar.
> Status: ⬜ TODO | 🔄 IN PROGRESS | ✅ DONE | 🚫 BLOCKED

| # | Tarefa | Tipo | Status | Notas |
|---|--------|------|--------|-------|
| 1 | Setup do módulo — estrutura de pacotes, dependências no pom.xml | Infra | ⬜ | |
| 2 | Flyway V1 migration — schema do banco | Infra | ⬜ | Coordenar com Dev 2 |
| 3 | Entidades JPA + enums do domínio | Code | ⬜ | |
| 4 | **[TEST]** Testes unitários do service (casos normais) | Test | ⬜ | RED first |
| 5 | Implementar service — lógica de negócio | Code | ⬜ | GREEN |
| 6 | **[TEST]** Testes unitários do service (casos extremos da spec) | Test | ⬜ | |
| 7 | Implementar casos extremos no service | Code | ⬜ | |
| 8 | **[TEST]** Testes de integração com Testcontainers | Test | ⬜ | |
| 9 | Implementar repository + queries | Code | ⬜ | |
| 10 | Implementar controller + Bean Validation | Code | ⬜ | |
| 11 | **[TEST]** Testes de API com MockMvc | Test | ⬜ | |
| 12 | Implementar producers/consumers Kafka | Code | ⬜ | |
| 13 | **[TEST]** Testes de integração Kafka | Test | ⬜ | |
| 14 | Configurar Dockerfile + entrada no docker-compose.yml | Infra | ⬜ | |
| 15 | Validar cobertura ≥ 90% | Validate | ⬜ | |
| 16 | PR + code review comparando contra spec | Review | ⬜ | |

---

## Checklist de Conclusão (Definition of Done)

- [ ] Spec aprovada antes de qualquer código
- [ ] Todos os casos extremos da spec têm pelo menos 1 teste
- [ ] Cobertura ≥ 90%
- [ ] Zero dados sensíveis em logs (verificado manualmente)
- [ ] Revisado por pelo menos 1 outro dev
- [ ] docker-compose.yml atualizado
- [ ] Spec e plano atualizados com qualquer desvio descoberto durante implementação
