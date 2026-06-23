---
id: us-001
status: active
links:
  - spec/user-stories/index.md
  - spec/specs/spec-004-login-page.md
---
# Login Flow

## User Story
Como usuário cadastrado, quero fazer login com e-mail e senha para acessar minha conta.

## Context
Ponto de entrada principal do sistema. Se 2FA estiver ativo, o login vira um fluxo em 2 etapas.
O token de acesso deve viver apenas em memória — nunca em localStorage.

## Scope
- In scope: login com e-mail/senha, tratamento de 2FA, refresh silencioso na inicialização, feedback de erro por código
- Out of scope: login social (Google, Apple), magic link, recuperação de senha

## Acceptance Criteria (BDD)
- Given credenciais válidas sem 2FA, when submete formulário, then recebe accessToken em memória e é redirecionado para /dashboard
- Given credenciais válidas com 2FA ativo, when submete formulário, then recebe twoFactorToken e é redirecionado para /2fa/verify
- Given credenciais inválidas, when submete formulário, then exibe mensagem mapeada do errorCode (ex: "E-mail ou senha incorretos") sem revelar qual campo está errado
- Given rate limit atingido (429), when submete formulário, then exibe "Muitas tentativas. Aguarde antes de tentar novamente."
- Given usuário com e-mail não confirmado, when submete formulário, then exibe mensagem com link para reenviar confirmação
- Given token de refresh válido no cookie, when abre o app, then refresh silencioso acontece e usuário permanece logado sem "piscar" a tela

## Definition of Done
- [ ] Spec spec-004-login-page.md escrita e aprovada
- [ ] Todos os estados de UI implementados (loading, erro por errorCode, sucesso)
- [ ] Token nunca persiste em localStorage
- [ ] Redirect correto após login (considera role)
- [ ] Testes unitários para os acceptance criteria
