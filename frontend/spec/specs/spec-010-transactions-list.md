---
id: spec-010
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-006-merchant-dashboard.md
---
# Transactions List

## Context and Primary Objective
- Context: Listagem paginada de transações — `/transactions` (MERCHANT_OWNER only)
- Objective: Permitir que o MERCHANT_OWNER visualize, filtre e navegue pelas transações da loja

## Functional Requirements (Behavior)
- Business rules:
  - GET /api/v1/transactions com query params: `page`, `size` (10), `status` (opcional), `customerId` (opcional), `sort` (padrão: createdAt,desc)
  - Apenas MERCHANT_OWNER acessa esta rota — RoleRoute bloqueia outros roles
  - Filtros: por status (todos os TransactionStatus + "Todos") e por customerId (campo de texto livre)
  - Ao clicar em uma linha → navega para /transactions/:id
  - Coluna de valor exibe o valor original, não o valor após reembolso parcial

## Acceptance Criteria (BDD)
- Given MERCHANT_OWNER em /transactions, when lista carrega, then cada linha mostra: data (DD/MM/YYYY HH:mm), ID da transação (8 chars), valor (R$ X,XX), status com badge colorido, customerId (8 chars)
- Given filtro de status "APPROVED" selecionado, when select muda, then GET /transactions?status=APPROVED&page=0 é chamado
- Given campo customerId preenchido com debounce de 500ms, when usuário para de digitar, then GET /transactions?customerId=xxx é chamado
- Given zero transações no filtro ativo, when renderizado, then exibe "Nenhuma transação encontrada para os filtros aplicados"
- Given zero transações sem filtro, when MERCHANT_OWNER acessa, then exibe "Nenhuma transação ainda"
- Given CUSTOMER tenta acessar /transactions, when RoleRoute processa, then redireciona para /dashboard
- Given linha da tabela clicada, when evento de clique, then navega para /transactions/:id

## Interface and Data Contracts
```typescript
interface TransactionSummary {
  transactionId: string
  status: TransactionStatus
  amountInCents: number
  createdAt: string      // ISO-8601
  customerId: string
  orderId: string
}

interface TransactionsPage {
  content: TransactionSummary[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
```

- API: `GET /api/v1/transactions?page=0&size=10&status=APPROVED&sort=createdAt,desc`

## Tech Stack and Constraints
- Technologies: shadcn/ui Table, Badge, Pagination, Select; `useDebounce` hook para o campo customerId

## Examples
- Input: `GET /transactions?page=0&size=10`
- Output: tabela clicável com 10 linhas, badges coloridos por status, paginação no rodapé
