# AGENTS — Acabou o Mony Frontend

## Propósito
Prover um índice mínimo e guardrails para agentes de IA atuando neste projeto SDD frontend.
As specs são a fonte da verdade. Atualizar specs antes de qualquer mudança de comportamento.

---

## Fluxo SDD Obrigatório

```
Vision → User Stories → Specs → Tech Plans → ADRs → Tasks → Implement → Validate
```

- **Direto (mínimo):** Vision → Specs → Tasks → Implement → Validate
- **Planejamento completo:** fluxo acima completo

**Regra absoluta:** Nenhum código de produção sem spec aprovada.

---

## Papéis dos Agentes

O prompt deve declarar o papel antes de agir.

| Papel | Responsabilidade |
|---|---|
| **Spec Architect** | Escreve/atualiza specs e acceptance criteria. Sem código, sem testes. |
| **Frontend Engineer** | Implementa a partir de specs, cria tasks se necessário, escreve testes. |
| **Review Agent** | Verifica código vs. specs, sinaliza desvios, reporta gaps. |

---

## Índice de Documentos (começar aqui)

- `spec/index.md`
- `spec/vision.md`
- `spec/user-stories/index.md`
- `spec/specs/index.md`
- `spec/tech-plans/index.md`
- `spec/adrs/index.md`
- `spec/tasks/index.md`
- `CONTEXT.md`
- `ARCHITECTURE.md`

---

## Guardrails

- Não inventar requisitos: seguir apenas specs e acceptance criteria.
- Não mudar comportamento sem atualizar specs primeiro.
- Preferir código simples e explícito; evitar over-engineering.
- Token de acesso **nunca** em localStorage — apenas em memória (AuthContext).
- `dangerouslySetInnerHTML` proibido em qualquer lugar.
- Dados sensíveis **nunca** em URL, console.log ou localStorage.
- Criar testes mapeados aos acceptance criteria das specs.
- Validar builds e lint antes de declarar tarefa concluída.

---

## Quando Parar e Pedir Revisão Humana

- Specs ausentes, contraditórias ou não-testáveis.
- Mudança afeta escopo, arquitetura, ADRs ou dependências externas.
- Acceptance criteria ausentes ou ambíguos.
- Validação falha sem fix óbvio.
- Qualquer dúvida sobre requisitos ou gates de aprovação.
- Integração com API do backend sem endpoint documentado no mapa.

---

## 10 Crucial Questions (fazer antes de agir)

1. Existe spec aprovada em `spec/specs/` para isso?
2. O endpoint do backend que esta tela usa existe e está no `CONTEXT.md`?
3. Todos os estados de UI (loading, erro, vazio, sucesso) estão na spec?
4. Os tipos TypeScript espelham os DTOs do backend?
5. A rota é pública ou protegida? Qual role tem acesso?
6. O formulário tem schema Zod alinhado com as validações do backend?
7. Dados sensíveis estão sendo tratados corretamente (sem localStorage, sem URL)?
8. Existe idempotency key onde o backend exige (POST orders e transactions)?
9. Todos os `errorCode` do backend têm mensagem mapeada para o usuário?
10. O componente foi validado contra a spec antes de considerar pronto?
