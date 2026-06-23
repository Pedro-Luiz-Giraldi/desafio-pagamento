---
id: us-006
status: active
links:
  - spec/user-stories/index.md
  - spec/specs/spec-014-merchant-dashboard.md
  - spec/specs/spec-010-transactions-list.md
---
# Merchant Dashboard

## User Story
Como MERCHANT_OWNER, quero ver métricas e um resumo das transações e pedidos recentes para entender a saúde do meu negócio.

## Context
Ana precisa de visibilidade imediata ao abrir o sistema. O dashboard deve mostrar números relevantes
sem precisar navegar para outras telas. Dados são carregados dos endpoints existentes do backend
(não há endpoint de "dashboard" dedicado — o frontend agrega).

## Scope
- In scope: métricas calculadas no frontend (total de vendas, receita total, taxa de aprovação), últimas transações, pedidos recentes
- Out of scope: gráficos históricos com D3/Recharts (MVP), exportação de relatórios, dados em tempo real via WebSocket

## Acceptance Criteria (BDD)
- Given MERCHANT_OWNER autenticado, when acessa /dashboard, then vê 3 métricas: total de vendas do período, receita total (R$) e taxa de aprovação (%)
- Given métricas carregando, when GET /transactions está em andamento, then cards exibem skeleton de loading
- Given erro no carregamento, when fetch falha, then cards exibem mensagem de erro com botão "Tentar novamente"
- Given últimas 5 transações, when renderizadas, then cada linha mostra: data, valor, status com badge colorido, ID resumido
- Given CUSTOMER autenticado, when tenta acessar /dashboard de merchant, then RoleRoute redireciona para o dashboard de customer
- Given dashboard de CUSTOMER, when renderizado, then exibe contadores de pedidos por status (pendentes, pagos, cancelados) e lista de últimos pedidos

## Definition of Done
- [ ] Spec spec-014-merchant-dashboard.md e spec-013-customer-dashboard.md escritas e aprovadas
- [ ] Métricas calculadas a partir dos dados retornados pelo backend (sem endpoint dedicado)
- [ ] Skeleton loading em todos os cards
- [ ] RoleRoute aplicado corretamente (MERCHANT_OWNER vs CUSTOMER)
