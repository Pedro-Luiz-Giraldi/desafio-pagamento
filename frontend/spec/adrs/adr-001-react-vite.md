---
id: adr-001
status: accepted
links:
  - spec/adrs/index.md
  - spec/tech-plans/plan-001-project-setup.md
---
# ADR-001: React + Vite como framework

## Contexto
O frontend do Acabou o Mony é uma SPA 100% autenticada. Não há necessidade de SEO, indexação ou renderização server-side. O usuário sempre chega pelo login antes de ver qualquer dado.

## Decisão
Usar **React 18 + Vite** como stack base.

## Consequências

### Positivas
- Build extremamente rápido com HMR instantâneo (Vite)
- Ecossistema React maduro com shadcn/ui, React Hook Form, React Router
- TypeScript com configuração zero-setup no template oficial do Vite
- Sem overhead de Next.js (SSR, RSC, file-based routing) para uma SPA simples

### Negativas
- Sem SSR: SEO inexistente (aceitável para app 100% autenticado)
- Sem file-based routing: roteamento manual com React Router (controlado, explícito)
- Deploy requer CDN ou server que sirva `index.html` para todas as rotas (configuração de SPA)

## Alternativas Consideradas
- **Next.js:** descartado — overhead de SSR/RSC desnecessário para SPA autenticada; complexidade adicional sem benefício
- **Remix:** descartado — server-side por padrão, aumenta complexidade de deploy
