---
id: vision-000
status: active
links:
  - spec/user-stories/index.md
  - spec/specs/index.md
---
# Vision — Frontend Acabou o Mony

O frontend do Acabou o Mony existe para dar ao empreendedor — representado pela Ana — visibilidade
e controle sobre seus pagamentos, pedidos e transações, de forma rápida, segura e sem fricção.

## Usuários e contexto

- **CUSTOMER:** comprador que cria pedidos e paga com cartão via MercadoPago
- **MERCHANT_OWNER:** Ana e comerciantes que gerenciam pedidos, visualizam transações e emitem reembolsos
- **STAFF:** equipe interna com acesso somente-leitura

## Resultados que otimizamos

- Fluxo de pagamento concluído em menos de 5 passos, com confirmação imediata
- Merchant enxerga status atualizado de pedidos e transações sem recarregar a página
- Erros retornados pelo backend traduzidos para mensagens que orientam a próxima ação do usuário
- Nenhum dado sensível exposto no frontend (token, cartão, CPF)

## O que não fazemos

- Não armazenamos número de cartão — tokenizamos via MercadoPago SDK client-side
- Não exibimos score de fraude para o usuário
- Não acessamos rotas `/internal/**`
- Não implementamos funcionalidades sem endpoint correspondente no backend
- Não adicionamos integração com plataformas externas (TikTok, Instagram, WhatsApp)

## Princípios

- Spec antes do código: nenhuma tela é construída sem spec aprovada
- Zero funcionalidades fantasma: cada elemento de UI tem endpoint real correspondente
- Segurança não é opcional: token em memória, guards duplos, CSP
- Estado de erro é cidadão de primeira classe: loading, erro, vazio e sucesso sempre tratados
