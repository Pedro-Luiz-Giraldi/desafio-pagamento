---
id: spec-014
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-006-merchant-dashboard.md
---
# Merchant Dashboard

## Context and Primary Objective
- Context: Dashboard do MERCHANT_OWNER — `/dashboard` quando role = MERCHANT_OWNER
- Objective: Dar ao merchant (Ana) visibilidade imediata sobre vendas, receita e taxa de aprovação sem navegar para outras telas

## Functional Requirements (Behavior)
- Business rules:
  - Dados carregados de GET /api/v1/transactions (sem filtro de status = todos, tamanho 50 para cálculo)
  - Métricas calculadas no frontend: total de vendas (count de APPROVED + PARTIALLY_REFUNDED + FULLY_REFUNDED), receita total (soma dos `amountInCents` de APPROVED), taxa de aprovação (APPROVED / total de transações)
  - Últimas 5 transações = primeiros 5 resultados do GET /transactions
  - Pedidos recentes = GET /orders (primeiros 5)

## Acceptance Criteria (BDD)
- Given MERCHANT_OWNER autenticado, when acessa /dashboard, then vê 3 metric cards: "Total de vendas" (número inteiro), "Receita total" (R$ X.XXX,XX), "Taxa de aprovação" (XX%)
- Given GET /transactions carregando, when renderizado, then metric cards exibem skeleton
- Given 0 transações, when renderizado, then "Total de vendas: 0", "Receita: R$ 0,00", "Taxa de aprovação: --"
- Given transações carregadas, when renderizadas, then 5 linhas com: data (DD/MM HH:mm), ID resumido, valor (R$ X,XX), badge de status
- Given pedidos recentes carregados, when renderizados, then 5 linhas com: data, ID resumido, valor, badge de status, link para /orders/:id
- Given CUSTOMER tenta acessar /dashboard de merchant, when RoleRoute processa, then redireciona para dashboard de customer

## Interface and Data Contracts
```typescript
// Métricas calculadas no frontend a partir de GET /transactions
function calculateMetrics(transactions: TransactionSummary[]) {
  const total = transactions.length
  const approved = transactions.filter(t =>
    ['APPROVED', 'PARTIALLY_REFUNDED', 'FULLY_REFUNDED'].includes(t.status)
  ).length
  const revenueInCents = transactions
    .filter(t => t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amountInCents, 0)
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : null

  return { total: approved, revenueInCents, approvalRate }
}
```

## Tech Stack and Constraints
- Technologies: shadcn/ui Card, Skeleton, Badge; `formatCurrency` e `formatDate` de `shared/utils`

## Examples
- Input: GET /transactions retorna 20 transações (15 APPROVED, 3 DECLINED, 2 SUSPECTED_FRAUD)
- Output: "15 vendas | R$ X.XXX,XX | 75% aprovação"
