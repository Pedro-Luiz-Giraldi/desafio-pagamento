# Frontend — Merchant Dashboard

**Versão:** 1.0
**Data:** 2026-06-22
**Status:** Draft

---

## 1. Visão Geral

Dashboard web para merchants processarem e gerenciarem pagamentos digitais. Interface administrativa que consome `api-gateway` (porta 8080) para acessar `user-service`, `order-service` e `payment-service`.

---

## 2. Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 + Vite |
| Linguagem | TypeScript 5.x |
| UI | Tailwind CSS 4 |
| State | TanStack Query 5 + Zustand |
| Routing | React Router v7 |
| HTTP | Axios |
| Testes unitários | Vitest + Testing Library |
| Testes E2E | Playwright |
| Docker | Multi-stage (node → nginx) |

---

## 3. Requisitos

### 3.1 Autenticação

| ID | Descrição | Prioridade | API |
|----|-----------|-----------|-----|
| FR-AUTH-001 | Registrar merchant (nome, email, senha, role=MERCHANT) | Alta | `POST /api/v1/auth/register` |
| FR-AUTH-002 | Confirmar email via token | Alta | `POST /api/v1/auth/confirm-email` |
| FR-AUTH-003 | Login com email + senha | Alta | `POST /api/v1/auth/login` |
| FR-AUTH-004 | Exibir tela de 2FA quando `requiresTwoFactor=true` | Alta | - |
| FR-AUTH-005 | Verificar código TOTP na segunda etapa do login | Alta | `POST /api/v1/auth/2fa/verify` |
| FR-AUTH-006 | Renovar access token automaticamente via refresh token (cookie) | Alta | `POST /api/v1/auth/refresh` |
| FR-AUTH-007 | Logout (limpar sessão local + cookie) | Alta | `POST /api/v1/auth/logout` |
| FR-AUTH-008 | Redirecionar para login quando token expirar | Alta | - |
| FR-AUTH-009 | Exibir feedback claro de erros de autenticação (credenciais inválidas, conta bloqueada, email não confirmado) | Média | - |

### 3.2 Dashboard

| ID | Descrição | Prioridade | API |
|----|-----------|-----------|-----|
| FR-DSH-001 | Card com resumo: total de transações (hoje, este mês) | Alta | `GET /api/v1/transactions` |
| FR-DSH-002 | Card com resumo: total de pedidos pendentes | Alta | `GET /api/v1/orders?status=PENDING` |
| FR-DSH-003 | Card com resumo: últimas 5 transações | Alta | `GET /api/v1/transactions?page=0&size=5` |
| FR-DSH-004 | Card com resumo: últimos 5 pedidos | Média | `GET /api/v1/orders?page=0&size=5` |
| FR-DSH-005 | Links rápidos para criar pedido e ver transações | Média | - |

### 3.3 Pedidos (Orders)

| ID | Descrição | Prioridade | API |
|----|-----------|-----------|-----|
| FR-ORD-001 | Listar pedidos com paginação | Alta | `GET /api/v1/orders` |
| FR-ORD-002 | Filtrar pedidos por status (PENDING, PAID, CANCELLED, REFUNDED) | Alta | `GET /api/v1/orders?status=X` |
| FR-ORD-003 | Exibir detalhes do pedido (itens, valor total, status, data) | Alta | `GET /api/v1/orders/{id}` |
| FR-ORD-004 | Cancelar pedido (se PENDING) | Alta | `DELETE /api/v1/orders/{id}` |
| FR-ORD-005 | Confirmar cancelamento com modal de confirmação | Média | - |
| FR-ORD-006 | Criar novo pedido com itens (merchant-initiated) | Alta | `POST /api/v1/orders` |
| FR-ORD-007 | Badge de status com cor (PENDING=amarelo, PAID=verde, CANCELLED=vermelho, REFUNDED=azul) | Média | - |

### 3.4 Transações

| ID | Descrição | Prioridade | API |
|----|-----------|-----------|-----|
| FR-TXN-001 | Listar transações com paginação | Alta | `GET /api/v1/transactions` |
| FR-TXN-002 | Filtrar transações por status (APPROVED, DECLINED, REFUNDED) | Alta | `GET /api/v1/transactions?status=X` |
| FR-TXN-003 | Exibir detalhes da transação (cartão, parcelas, status, tempo) | Alta | `GET /api/v1/transactions/{id}` |
| FR-TXN-004 | Processar estorno parcial ou total | Alta | `POST /api/v1/transactions/{id}/refund` |
| FR-TXN-005 | Formulário de estorno com seleção de motivo e valor | Alta | - |
| FR-TXN-006 | Feedback visual do resultado do estorno (sucesso/erro) | Alta | - |
| FR-TXN-007 | Badge de status com cor (APPROVED=verde, DECLINED=vermelho, SUSPECTED_FRAUD=laranja, REFUNDED=azul) | Média | - |

### 3.5 Perfil / Configurações

| ID | Descrição | Prioridade | API |
|----|-----------|-----------|-----|
| FR-PRO-001 | Exibir dados do perfil (nome, email, role) | Média | `GET /api/v1/users/me` |
| FR-PRO-002 | Alterar nome | Média | `PUT /api/v1/users/me` (assumido) |
| FR-PRO-003 | Configurar 2FA (gerar QR Code + recovery codes) | Alta | `POST /api/v1/auth/2fa/setup` |
| FR-PRO-004 | Confirmar ativação do 2FA com TOTP | Alta | `POST /api/v1/auth/2fa/confirm` |
| FR-PRO-005 | Desativar 2FA | Média | `POST /api/v1/auth/2fa/disable` |
| FR-PRO-006 | Exibir recovery codes após setup com aviso para guardar | Alta | - |

### 3.6 UX Geral

| ID | Descrição | Prioridade |
|----|-----------|-----------|
| FR-UX-001 | Layout responsivo (mobile 360px+ até desktop) | Alta |
| FR-UX-002 | Sidebar de navegação com ícones (colapsável em mobile) | Alta |
| FR-UX-003 | Topbar com nome do merchant e logout | Alta |
| FR-UX-004 | Loading states (skeleton/spinner) em todas as páginas | Alta |
| FR-UX-005 | Tratamento de erros com toast notifications | Alta |
| FR-UX-006 | Idempotency-Key gerada automaticamente para POST requests | Alta |
| FR-UX-007 | Confirmação em ações destrutivas (cancelar pedido, estornar) | Média |
| FR-UX-008 | Página 404 personalizada | Baixa |
| FR-UX-009 | Favicon e title da aplicação | Baixa |

---

## 4. Rotas

| Path | Página | Layout | Requer Auth |
|------|--------|--------|-------------|
| `/login` | Login | Public | Não |
| `/register` | Cadastro | Public | Não |
| `/confirm-email?token=:token` | Confirmação de email | Public | Não |
| `/2fa-verify` | Verificação 2FA | Public (pós-login) | Não (token temporário) |
| `/` | Dashboard | App (sidebar) | Sim |
| `/orders` | Lista de pedidos | App (sidebar) | Sim |
| `/orders/new` | Criar pedido | App (sidebar) | Sim |
| `/orders/:id` | Detalhe do pedido | App (sidebar) | Sim |
| `/transactions` | Lista de transações | App (sidebar) | Sim |
| `/transactions/:id` | Detalhe da transação | App (sidebar) | Sim |
| `/settings` | Perfil / Configurações | App (sidebar) | Sim |
| `/settings/2fa` | Configuração 2FA | App (sidebar) | Sim |
| `*` | 404 | App (sidebar) | - |

---

## 5. Critérios de Aceite

1. **CA-001:** Merchant consegue se cadastrar, confirmar email e fazer login
2. **CA-002:** Merchant com 2FA ativo consegue completar login com código TOTP
3. **CA-003:** Token expirado redireciona para login sem perder dados da página atual
4. **CA-004:** Merchant consegue criar pedido, ver na lista, ver detalhes e cancelar
5. **CA-005:** Merchant consegue ver transações, filtrar por status e processar estorno
6. **CA-006:** Dashboard mostra resumo correto dos dados do merchant
7. **CA-007:** Navegação por sidebar funciona em desktop e mobile
8. **CA-008:** Erros de API são exibidos como toast notifications
9. **CA-009:** Actions destrutivas (cancelar, estornar) têm confirmação
10. **CA-010:** Testes unitários passam com cobertura ≥ 80%
11. **CA-011:** Testes E2E cobrem fluxo completo: login → criar pedido → ver transações
