# Roadmap: Frontend — Merchant Dashboard

**Versão:** 1.0
**Data:** 2026-06-22

---

## Marcos

| Marco | Previsão | Depende de | Entregas |
|-------|----------|-----------|----------|
| **M1 — Fundação** | Semana 1 | — | Projeto Vite scaffoldado, Tailwind, Docker, tipos TypeScript, API client |
| **M2 — Auth** | Semana 1 | M1 | Login, registro, 2FA, refresh automático, rotas públicas |
| **M3 — App Shell** | Semana 2 | M2 | Sidebar, topbar, route guard, UI primitives, toasts |
| **M4 — Dashboard** | Semana 2 | M3 | Página inicial com cards de métricas e listas recentes |
| **M5 — Pedidos** | Semana 2 | M3 | CRUD de pedidos, lista com filtros, criar, detalhe, cancelar |
| **M6 — Transações** | Semana 3 | M3 | Lista com filtros, detalhe, formulário de estorno |
| **M7 — Configurações** | Semana 3 | M3 | Perfil, setup 2FA com QR code + recovery codes |
| **M8 — Finalização** | Semana 3 | M4-M7 | 404, responsivo, E2E Playwright, ajustes finais |

## Fases

```
M1 ──► M2 ──► M3 ──┬──► M4 (Dashboard)
                     ├──► M5 (Orders)
                     ├──► M6 (Transactions)
                     └──► M7 (Settings)
                           │
                           └──► M8 (Polish + E2E)
```

## Pós-MVP (não planejado)

- Portal do consumidor (acompanhamento de pedidos)
- Modo escuro
- Internacionalização (en)
- WebSocket para atualizações em tempo real
- Relatórios e gráficos avançados
