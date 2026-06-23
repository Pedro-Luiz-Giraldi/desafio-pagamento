---
id: adr-002
status: accepted
links:
  - spec/adrs/index.md
  - spec/specs/spec-001-auth-context.md
  - spec/tech-plans/plan-002-auth-system.md
---
# ADR-002: Context API como estado global

## Contexto
O app precisa de estado global para: usuário autenticado, role, accessToken e perfil. Existem bibliotecas mais robustas (Zustand, Redux, TanStack Query), mas o estado global do app é pequeno e bem definido.

## Decisão
Usar **Context API nativa do React** para estado global de autenticação. Sem bibliotecas de estado externas.

## Consequências

### Positivas
- Zero dependências externas para gerenciamento de estado
- Simples de entender e manter (2 contextos: AuthContext e UserContext)
- Re-renders controlados (AuthContext muda raramente — apenas login/logout)
- Sem curva de aprendizado para novos devs familiarizados com React

### Negativas
- Sem features avançadas de cache/invalidation (TanStack Query faria melhor)
- Re-renders excessivos se o contexto crescer (mitigado mantendo o contexto mínimo)
- Sem DevTools dedicado para inspecionar estado (usar React DevTools padrão)

## Alternativas Consideradas
- **TanStack Query:** excelente para cache de server state, mas overkill para o AuthContext que muda raramente
- **Zustand:** mais performático, mas adiciona dependência sem benefício claro no escopo atual
- **Redux Toolkit:** pesado demais para 2 contextos pequenos

## Nota
Se o app crescer e precisar de cache de server state (ex: lista de transações com stale-while-revalidate), TanStack Query pode ser adicionado sem conflitar com o Context API de auth.
