---
id: adr-005
status: accepted
links:
  - spec/adrs/index.md
  - spec/specs/spec-004-login-page.md
  - spec/specs/spec-005-register-page.md
---
# ADR-005: Zod + React Hook Form

## Contexto
O app tem vários formulários: login, register, 2FA, criação de pedido, pagamento, reembolso. Cada formulário precisa de validação antes de consumir rate limit do backend. A validação deve ser fortemente tipada.

## Decisão
Usar **React Hook Form** para gerenciamento de estado de formulário e **Zod** para schemas de validação, integrados via `@hookform/resolvers/zod`.

## Consequências

### Positivas
- React Hook Form evita re-renders desnecessários (uncontrolled inputs por padrão)
- Zod provê tipagem TypeScript automática a partir do schema (`z.infer<typeof schema>`)
- Validação client-side com as mesmas regras do backend — evita chamadas de API com dados inválidos
- `@hookform/resolvers` integra Zod ao RHF em 1 linha: `resolver: zodResolver(schema)`
- Mensagens de erro em português diretamente no schema

### Negativas
- Curva de aprendizado do Zod para devs não familiarizados
- Bundle ligeiramente maior (Zod ~14kb gzip; RHF ~8kb gzip) — aceitável dado o benefício

## Alternativas Consideradas
- **Yup:** descartado — Zod tem melhor integração com TypeScript (inferência de tipos automática)
- **Validação manual:** descartado — verboso, não tipado, difícil de manter com muitos formulários
- **Formik:** descartado — React Hook Form tem performance superior (sem re-renders por field)
