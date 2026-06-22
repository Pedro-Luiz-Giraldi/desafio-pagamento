# Frontend — Gray Area Decisions

**Data:** 2026-06-22

## Tech Stack

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React 19 + Vite | SPA, ecossistema maduro, TypeScript first |
| Language | TypeScript | Type safety, alinhado com backend Java |
| UI Library | Tailwind CSS 4 | Utility-first, flexível, baixo overhead |
| State Management | TanStack Query + Zustand | TanStack Query para server state, Zustand para client state |
| Routing | React Router v7 | Padrão SPA, layout routes, typesafe |
| HTTP Client | Axios | Interceptors, configuração global de auth |
| Unit Tests | Vitest + Testing Library | Nativo Vite, rápido |
| E2E Tests | Playwright | Moderno, confiável |
| Docker | Multi-stage (node → nginx) | Mesmo padrão dos serviços Java |

## Audience

- **Merchants apenas** (dashboard administrativo B2B)
- Sem portal do consumidor no MVP

## Auth Model

- JWT Bearer via `Authorization` header
- Refresh token via `Set-Cookie` httpOnly (nunca no body)
- 2FA TOTP como segunda etapa do login
- Axios interceptor para refresh automático

## Layout

- Sidebar navigation + topbar (layout authenticated)
- Landing page para login/register (layout público)
- Responsivo (mobile-first)
