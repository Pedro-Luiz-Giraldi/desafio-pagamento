---
id: us-003
status: active
links:
  - spec/user-stories/index.md
  - spec/specs/spec-006-2fa-flow.md
---
# 2FA Setup

## User Story
Como usuário autenticado, quero ativar o segundo fator de autenticação (TOTP) para proteger minha conta.

## Context
2FA usa TOTP (Google Authenticator, Authy). O backend retorna QR code e recovery codes.
O frontend exibe o QR code, pede o código do app para confirmar a ativação e salva os recovery codes.

## Scope
- In scope: setup de TOTP (QR code + confirmação), desativação de 2FA, verificação 2FA no login, uso de recovery code
- Out of scope: SMS como segundo fator, e-mail como segundo fator

## Acceptance Criteria (BDD)
- Given usuário sem 2FA, when acessa /profile/2fa e clica "Ativar", then POST /auth/2fa/setup retorna QR code e secret, tela exibe QR scanável
- Given QR code exibido, when usuário escaneia e digita código TOTP válido, then POST /auth/2fa/confirm ativa o 2FA e exibe 8 recovery codes para salvar
- Given 2FA ativo, when faz logout e login novamente, then é redirecionado para /2fa/verify com campo para código TOTP
- Given código TOTP inválido em /2fa/verify, when submete, then exibe "Código inválido ou expirado"
- Given recovery code válido em /2fa/recovery, when submete, then autentica e revoga o recovery code usado
- Given usuário com 2FA ativo em /profile/2fa, when clica "Desativar" e confirma, then POST /auth/2fa/disable remove 2FA da conta

## Definition of Done
- [ ] Spec spec-006-2fa-flow.md escrita e aprovada
- [ ] QR code renderizado sem dependência de servidor externo de imagem
- [ ] Recovery codes exibidos em tela com instrução de salvar (não enviados por e-mail no frontend)
- [ ] Fluxo de recovery code funcionando independente do TOTP
