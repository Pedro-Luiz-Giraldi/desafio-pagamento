# Feature: Finalização — 404, Responsivo, E2E

**ID:** finalization
**Status:** ✅ Completo
**Marco:** M8 — Finalização
**Prioridade:** Alta

---

## Requisitos

### REQ-FIN-001: Página 404
**Prioridade:** Alta
**Descrição:** Criar página de erro 404 para rotas não encontradas

**Critérios de Aceitação:**
- [x] Página 404 exibe mensagem amigável
- [x] Botão para voltar à home
- [x] Design consistente com o resto da aplicação
- [x] Rota catch-all (`*`) configurada no React Router

### REQ-FIN-002: Responsividade Mobile
**Prioridade:** Alta
**Descrição:** Garantir que todas as páginas funcionem bem em dispositivos móveis (360px+)

**Critérios de Aceitação:**
- [x] Sidebar colapsável em mobile (hamburguer menu)
- [x] Tabelas responsivas (scroll horizontal ou cards em mobile)
- [x] Formulários adaptados para telas pequenas
- [x] Botões e inputs com tamanho adequado para touch
- [x] Testado em 360px, 768px, 1024px, 1920px

### REQ-FIN-003: Testes E2E com Playwright
**Prioridade:** Média
**Descrição:** Criar suite de testes end-to-end cobrindo fluxos principais

**Critérios de Aceitação:**
- [x] Playwright instalado e configurado
- [x] Teste: Fluxo de login completo (smoke test - validação)
- [x] Teste: Navegação em rotas públicas (smoke test)
- [x] Teste: Página 404 (smoke test)
- [ ] Teste: Criar pedido e visualizar detalhes (opcional - requer backend mock)
- [ ] Teste: Visualizar transação e processar estorno (opcional - requer backend mock)
- [ ] Teste: Configurar 2FA (opcional - requer backend mock)
- [ ] Testes executam em CI/CD (opcional para MVP)

### REQ-FIN-004: Polish & UX
**Prioridade:** Baixa
**Descrição:** Ajustes finais de UX e edge cases

**Critérios de Aceitação:**
- [x] Loading states em todas as ações assíncronas
- [x] Mensagens de erro amigáveis
- [x] Validação de formulários consistente
- [x] Feedback visual em ações (toasts)
- [x] Navegação por teclado funcional

---

## Escopo Técnico

### Componentes Novos
- `NotFoundPage` — Página 404
- `MobileNav` — Navegação mobile (hamburguer)

### Modificações
- `AuthenticatedLayout` — Adicionar suporte mobile
- Tabelas em `OrdersListPage`, `TransactionsListPage` — Responsividade
- `App.tsx` — Adicionar rota catch-all

### Testes E2E
- `tests/e2e/auth.spec.ts` — Login, 2FA
- `tests/e2e/orders.spec.ts` — CRUD de pedidos
- `tests/e2e/transactions.spec.ts` — Visualização e estorno
- `tests/e2e/settings.spec.ts` — Configuração 2FA

### Configuração
- `playwright.config.ts` — Configuração do Playwright
- `package.json` — Scripts para E2E

---

## Dependências

- Onda 4 completa ✅
- Playwright (dev dependency)

---

## Estimativa

- **404 Page:** 30min
- **Responsividade:** 2-3h
- **Playwright Setup + Testes:** 3-4h
- **Polish:** 1-2h

**Total:** ~7-10h

---

## Notas

- Responsividade é crítica para MVP
- E2E pode ser simplificado (smoke tests apenas)
- Polish é contínuo, não bloqueante
