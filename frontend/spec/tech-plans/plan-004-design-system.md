---
id: plan-004
status: active
links:
  - spec/tech-plans/index.md
  - spec/adrs/adr-004-shadcn-tailwind.md
---
# Tech Plan: Design System

## Objective
Configurar os componentes compartilhados, layouts e utilitários de UI antes de implementar as telas de feature.

## Scope
- In scope: AppLayout, AuthLayout, componentes shared (StatusBadge, DataTable, EmptyState, ErrorState, LoadingState), utilitários (formatCurrency, formatDate, cn)
- Out of scope: componentes específicos de feature (formulários de login, modais de reembolso)

## Component Inventory

### Layouts
```
AuthLayout.tsx   ← container centralizado, sem sidebar; para login/register/2fa
AppLayout.tsx    ← sidebar + header + main; para telas pós-login
```

### Shared Components
```
StatusBadge.tsx          ← Badge por OrderStatus ou TransactionStatus; cor automática por valor
DataTable.tsx            ← tabela paginada genérica; props: columns, data, loading, empty
EmptyState.tsx           ← tela/seção vazia; props: message, action?
ErrorState.tsx           ← erro com retry; props: message, onRetry
LoadingState.tsx         ← skeleton ou spinner; props: variant ('skeleton' | 'spinner'), rows?
ConfirmDialog.tsx        ← Dialog genérico de confirmação; props: title, description, onConfirm
```

### Sidebar (dentro de AppLayout)
- CUSTOMER: Dashboard, Meus Pedidos, Perfil
- MERCHANT_OWNER: Dashboard, Pedidos, Transações, Perfil
- Itens condicionais por role lidos do AuthContext

### Utilitários (src/shared/utils/)
```typescript
formatCurrency(amountInCents: number, locale = 'pt-BR'): string
// 9900 → "R$ 99,00"

formatDate(isoString: string, format: 'short' | 'long' = 'short'): string
// short: "23/06/2026 14:30"
// long: "23 de junho de 2026 às 14:30"

cn(...classes: ClassValue[]): string   // tailwind-merge + clsx
```

## Acceptance Criteria
- AppLayout renderiza sidebar correta por role (verificar com CUSTOMER e MERCHANT_OWNER)
- StatusBadge exibe cor correta para cada valor de OrderStatus e TransactionStatus
- DataTable exibe skeleton com `loading: true`, EmptyState com array vazio, rows com dados
- `formatCurrency(9900)` retorna `"R$ 99,00"`
- `formatDate('2026-06-23T14:30:00Z')` retorna string no formato brasileiro
