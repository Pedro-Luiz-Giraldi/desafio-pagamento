---
id: spec-006
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-003-2fa-setup.md
---
# 2FA Flow

## Context and Primary Objective
- Context: Setup, verificação e desativação de TOTP 2FA — rotas `/2fa/verify`, `/2fa/recovery`, `/profile/2fa`
- Objective: Permitir que usuários protejam a conta com TOTP e autentiquem via código ou recovery code

## Functional Requirements (Behavior)
- Business rules:
  - Setup: POST /auth/2fa/setup retorna `{ qrCodeUrl, secret }` — exibir QR code e campo de código
  - Confirmação: POST /auth/2fa/confirm com código TOTP válido ativa o 2FA e retorna 8 recovery codes
  - Recovery codes exibidos uma única vez — sem opção de "visualizar depois" no frontend
  - Verificação no login: POST /auth/2fa/verify com `{ code, twoFactorToken }` → retorna accessToken definitivo
  - Recovery: POST /auth/2fa/recovery com `{ recoveryCode, twoFactorToken }` → retorna accessToken e invalida o code
  - Desativação: POST /auth/2fa/disable (requer senha atual)

## Acceptance Criteria (BDD)
- Given /profile/2fa com 2FA inativo, when clica "Ativar 2FA", then POST /auth/2fa/setup é chamado e QR code é exibido em SVG/canvas sem carregar imagem de servidor externo
- Given QR code exibido, when digita código TOTP válido e confirma, then POST /auth/2fa/confirm ativa 2FA e exibe 8 recovery codes com instrução de copiar/guardar
- Given recovery codes exibidos, when clica "Confirmar que salvei", then tela retorna para /profile/2fa com status "2FA ativo"
- Given login com 2FA, when /2fa/verify recebe `twoFactorToken` via router state, then campo de código é exibido com timer de 5 minutos
- Given código TOTP expirado ou inválido, when submete em /2fa/verify, then exibe "Código inválido ou expirado. Tente novamente."
- Given `/2fa/recovery`, when submete recovery code válido, then autentica e exibe alerta "Recovery code utilizado. Restam X codes."
- Given /profile/2fa com 2FA ativo, when clica "Desativar" e confirma senha, then POST /auth/2fa/disable remove 2FA e atualiza perfil

## Interface and Data Contracts
```typescript
// POST /auth/2fa/setup → { qrCodeUrl: string, secret: string }
// POST /auth/2fa/confirm → { body: { code: string } } → { recoveryCodes: string[] }
// POST /auth/2fa/verify → { body: { code: string, twoFactorToken: string } } → { accessToken, user }
// POST /auth/2fa/recovery → { body: { recoveryCode: string, twoFactorToken: string } } → { accessToken, user, remainingCodes: number }
// POST /auth/2fa/disable → { body: { password: string } } → 200 OK
```

## Tech Stack and Constraints
- Technologies: React Hook Form, Zod, `qrcode` npm package (para gerar QR sem servidor externo)
- Constraints: QR code gerado client-side — não carregar imagem de URL externa (CSP)

## Examples
- Input verify: `{ code: '123456', twoFactorToken: 'eyJ...' }`
- Output: `{ ok: true, data: { accessToken: 'eyJ...', user: { ... } } }` → setTokens() chamado → redirect /dashboard
