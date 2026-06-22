# Project: Acabou o Mony — Frontend

**Versão:** 1.0
**Data:** 2026-06-22

---

## Visão

Dashboard web para merchants processarem e gerenciarem pagamentos digitais. Interface administrativa que consome `api-gateway` (porta 8080) para acessar `user-service`, `order-service` e `payment-service`.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 + Vite |
| Linguagem | TypeScript |
| UI | Tailwind CSS 4 |
| State | TanStack Query + Zustand |
| Routing | React Router v7 |
| HTTP | Axios |
| Testes unitários | Vitest + Testing Library |
| Testes E2E | Playwright |
| Docker | Multi-stage (node → nginx) |

## Público-alvo

Merchants B2B — dashboard administrativo. Sem portal do consumidor no MVP.

## Metas Técnicas

| Métrica | Target |
|---------|--------|
| Cobertura de testes | ≥ 80% |
| Performance build | < 10s |
| Docker image size | < 50MB |
| Responsivo | 360px+ a desktop |
| Acessibilidade | Navegação por teclado, contraste WCAG AA |
