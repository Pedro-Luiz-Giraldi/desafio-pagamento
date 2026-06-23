---
id: us-002
status: active
links:
  - spec/user-stories/index.md
  - spec/specs/spec-005-register-page.md
---
# Register Flow

## User Story
Como novo usuário, quero me cadastrar com nome, e-mail e senha para criar minha conta.

## Context
Após o cadastro, o backend envia e-mail de confirmação. O usuário não consegue logar enquanto o
e-mail não estiver confirmado. O role padrão de cadastro é CUSTOMER.

## Scope
- In scope: formulário de cadastro (nome, e-mail, senha, confirmação de senha), feedback de e-mail de confirmação, reenvio de confirmação
- Out of scope: cadastro de MERCHANT_OWNER pela UI (feito por outro fluxo), cadastro de STAFF

## Acceptance Criteria (BDD)
- Given formulário válido, when submete, then backend cria conta, frontend exibe mensagem "Verifique seu e-mail para confirmar o cadastro"
- Given e-mail já cadastrado, when submete, then exibe mensagem mapeada sem revelar que o e-mail existe (segurança)
- Given senha com menos de 8 caracteres, when sai do campo, then Zod exibe erro de validação antes de chamar a API
- Given senha e confirmação de senha diferentes, when sai do campo confirmação, then Zod exibe erro
- Given e-mail não confirmado tentando logar, when recebe UNCONFIRMED_EMAIL do backend, then exibe link "Reenviar e-mail de confirmação"
- Given link de confirmação clicado, when POST /auth/confirm-email retorna sucesso, then exibe "E-mail confirmado! Faça login."

## Definition of Done
- [ ] Spec spec-005-register-page.md escrita e aprovada
- [ ] Schema Zod alinhado com validações do backend (mín. 8 chars, e-mail válido, senhas iguais)
- [ ] Feedback visual em todos os estados (loading, erro, sucesso)
- [ ] Nenhuma informação de segurança exposta nas mensagens de erro
