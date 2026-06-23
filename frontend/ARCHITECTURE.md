# Architecture — Acabou o Mony Frontend

## 1. Stack

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | React 18 + Vite | SPA simples, sem necessidade de SSR |
| Linguagem | TypeScript | Segurança de tipos alinhada aos DTOs do backend |
| Estilo | Tailwind CSS + shadcn/ui | Componentes acessíveis, customizáveis, sem CSS global |
| Estado global | Context API | Complexidade baixa, sem necessidade de store externa |
| HTTP | fetch nativo (wrapper próprio) | Sem overhead de biblioteca; controle total de headers e erros |
| Formulários | React Hook Form + Zod | Validação síncrona antes de consumir rate limit do backend |
| Roteamento | React Router v6 | Padrão do ecossistema, suporte a guards declarativos |
| Referência visual | Kiwify | Clean, minimal, profissional |

---

## 2. Estrutura de Pastas

```
frontend/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/        ← Zod schemas
│   │   │   ├── services/       ← authService.ts
│   │   │   └── pages/
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── pages/
│   │   ├── orders/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── pages/
│   │   └── transactions/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── schemas/
│   │       ├── services/
│   │       └── pages/
│   ├── shared/
│   │   ├── components/         ← Button, Card, Badge, Modal, DataTable
│   │   ├── hooks/              ← useIdempotencyKey, useDebounce
│   │   └── utils/              ← formatCurrency, formatDate, cn()
│   ├── contexts/
│   │   ├── AuthContext.tsx      ← token, user, role, login(), logout()
│   │   └── UserContext.tsx      ← perfil completo
│   ├── lib/
│   │   ├── api.ts              ← fetch wrapper central
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── orders.types.ts
│   │   │   ├── transactions.types.ts
│   │   │   └── user.types.ts
│   │   └── constants.ts        ← API_BASE_URL, rotas
│   ├── router/
│   │   ├── index.tsx           ← todas as rotas
│   │   ├── PrivateRoute.tsx    ← guard: autenticado?
│   │   └── RoleRoute.tsx       ← guard: role correta?
│   └── layouts/
│       ├── AuthLayout.tsx      ← login/register (sem sidebar)
│       └── AppLayout.tsx       ← pós-login (com sidebar + header)
├── spec/                       ← SDD docs
├── AGENTS.md
├── ARCHITECTURE.md
├── CONTEXT.md
└── package.json
```

---

## 3. Segurança

### Responsabilidades do frontend
- Token em memória (nunca localStorage)
- Route guards duplos: PrivateRoute + RoleRoute
- `dangerouslySetInnerHTML` proibido
- Dados sensíveis nunca em URL
- CSP no `index.html`
- Zod valida antes de chamar API
- Erros mapeados para mensagens amigáveis (nunca expõe detalhes internos)
- Logout: limpa AuthContext + cookie expirado pelo backend + redirect + histórico limpo

### Responsabilidades do backend (não duplicar no frontend)
- JWT, rate limiting, autorização final, TLS, PCI DSS, fraude, SQL injection

---

## 4. AuthContext

```typescript
interface AuthContextValue {
  user: UserProfile | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<LoginResult>
  logout(): Promise<void>
  refreshToken(): Promise<boolean>
}
```

- Na inicialização: tenta `/auth/refresh` silencioso via cookie HttpOnly
- Se cookie válido → usuário continua logado sem piscar tela
- Se inválido → exibe tela de login

---

## 5. api.ts — responsabilidades

- Injeta `Authorization: Bearer <token>` automaticamente
- Gera e injeta `Idempotency-Key` em POST de orders e transactions
- Intercepta 401 → tenta refresh → reexecuta request original
- Se refresh falhar → `logout()` + redirect `/login`
- Formata erros no padrão `{ errorCode, message, retryable }`
- Lida com 429 (rate limit) → feedback visual ao usuário

---

## 6. Idempotência

- Hook `useIdempotencyKey()` gera UUID v4 por operação
- Descarta após sucesso ou erro não-retryável
- Se `retryable: true` → reutiliza mesma key para retry seguro

---

## 7. Rotas e Navegação

### Públicas (AuthLayout)
```
/login
/register
/confirm-email
/resend-confirmation
/2fa/verify
/2fa/recovery
```

### Protegidas — ambos os roles (AppLayout)
```
/dashboard
/profile
/profile/2fa
```

### CUSTOMER only
```
/orders               ← lista com filtro e paginação
/orders/new           ← criar pedido
/orders/:id           ← detalhe + timer 15min + cancelar se PENDING
/orders/:id/pay       ← tokenizar cartão + POST /transactions
```

### MERCHANT_OWNER only
```
/transactions                    ← lista com filtro por status e customerId
/transactions/:id                ← detalhe + histórico refunds
/transactions/:id/refund         ← modal: valor, RefundReason, idempotency key
/orders                          ← mesma página filtrada por merchantId
```

---

## 8. Badges de Status

| Status | Cor |
|---|---|
| PENDING | Amarelo |
| PROCESSING | Azul |
| PAID / APPROVED | Verde |
| CANCELLED | Cinza |
| REFUNDED / FULLY_REFUNDED | Vermelho |
| PARTIALLY_REFUNDED | Laranja |
| DECLINED / SUSPECTED_FRAUD | Vermelho |

---

## 9. Decisões Registradas (ADRs)

- `spec/adrs/adr-001-react-vite.md`
- `spec/adrs/adr-002-context-api.md`
- `spec/adrs/adr-003-token-em-memoria.md`
- `spec/adrs/adr-004-shadcn-tailwind.md`
- `spec/adrs/adr-005-zod-rhf.md`
