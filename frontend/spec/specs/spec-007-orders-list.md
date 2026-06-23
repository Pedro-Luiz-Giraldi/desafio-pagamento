---
id: spec-007
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-004-order-creation.md
---
# Orders List

## Context and Primary Objective
- Context: Listagem paginada de pedidos — `/orders`
- Objective: Permitir que CUSTOMER veja seus pedidos filtrados por status; MERCHANT_OWNER veja todos os pedidos da loja

## Functional Requirements (Behavior)
- Business rules:
  - GET /api/v1/orders com query params: `page`, `size` (padrão 10), `status` (opcional), `sort` (padrão: createdAt,desc)
  - CUSTOMER vê apenas seus pedidos (backend filtra por userId automaticamente via JWT)
  - MERCHANT_OWNER vê todos os pedidos da loja (backend filtra por merchantId)
  - Paginação controlada pelo frontend (page começa em 0)
  - Filtro por status via select — todos os valores de OrderStatus disponíveis + "Todos"
  - Estado vazio: quando não há pedidos no filtro ativo
  - Botão "Novo pedido" visível apenas para CUSTOMER

## Acceptance Criteria (BDD)
- Given GET /orders retorna lista, when renderizado, then cada linha mostra: ID (primeiros 8 chars), data de criação formatada (DD/MM/YYYY HH:mm), valor total (R$ X,XX), badge de status colorido
- Given filtro "PENDING" selecionado, when select muda, then GET /orders?status=PENDING&page=0 é chamado e lista atualiza
- Given última página, when renderizada, then botão "Próxima" está desabilitado
- Given lista vazia com filtro ativo, when renderizada, then exibe "Nenhum pedido com status [FILTRO]"
- Given lista vazia sem filtro, when CUSTOMER acessa /orders, then exibe "Você ainda não tem pedidos. [Criar primeiro pedido]"
- Given loading, when GET /orders está em andamento, then skeleton de 5 linhas é exibido
- Given erro de rede, when GET /orders falha, then exibe mensagem de erro com botão "Tentar novamente"

## Interface and Data Contracts
```typescript
interface OrderSummary {
  orderId: string
  status: OrderStatus
  totalAmountInCents: number
  createdAt: string  // ISO-8601
  customerId: string
}

interface OrdersPage {
  content: OrderSummary[]
  totalElements: number
  totalPages: number
  number: number       // página atual (0-indexed)
  size: number
}
```

- API: `GET /api/v1/orders?page=0&size=10&status=PENDING&sort=createdAt,desc`

## Tech Stack and Constraints
- Technologies: React, shadcn/ui Table, Badge, Pagination components
- Design: AppLayout com sidebar

## Examples
- Input: `GET /orders?page=0&size=10`
- Output: tabela com 10 linhas, paginação mostrando "1 de 3 páginas"
