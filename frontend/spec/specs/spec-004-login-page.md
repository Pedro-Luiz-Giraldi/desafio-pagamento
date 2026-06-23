---
id: spec-004
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-001-login-flow.md
---
# Login Page

## Context and Primary Objective
- Context: Primeira tela do fluxo de autenticação — `/login`
- Objective: Permitir que o usuário informe e-mail e senha, receba feedback imediato e seja redirecionado corretamente após autenticação

## Functional Requirements (Behavior)
- User story: Como usuário, quero fazer login com e-mail e senha.
- Business rules:
  - Validação Zod local antes de chamar a API (e-mail válido, senha não vazia)
  - Botão "Entrar" desabilitado durante loading
  - Mensagem de erro mapeada por `errorCode` — nunca expõe detalhes técnicos
  - Se 2FA ativo → armazena `twoFactorToken` em estado local e redireciona para `/2fa/verify`
  - Após login bem-sucedido → redireciona para `location.state.from` ou `/dashboard`

## Acceptance Criteria (BDD)
- Given e-mail inválido, when sai do campo, then Zod exibe "E-mail inválido" abaixo do campo
- Given formulário válido, when clica "Entrar", then botão mostra spinner e fica desabilitado
- Given `INVALID_CREDENTIALS`, when backend retorna, then exibe "E-mail ou senha incorretos" (não especifica qual)
- Given `EMAIL_NOT_CONFIRMED`, when backend retorna, then exibe "Confirme seu e-mail. [Reenviar confirmação]" com link para /resend-confirmation
- Given `ACCOUNT_LOCKED`, when backend retorna, then exibe "Conta bloqueada. Entre em contato com o suporte."
- Given `RATE_LIMIT` (429), when interceptado pelo api.ts, then exibe "Muitas tentativas. Aguarde antes de tentar novamente."
- Given login com 2FA, when backend retorna `twoFactorRequired: true`, then redireciona para /2fa/verify com twoFactorToken em state do router
- Given login bem-sucedido sem 2FA, when backend retorna 200, then redireciona para a rota salva ou /dashboard

## Interface and Data Contracts
```typescript
// Schema Zod
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

// Mapa de errorCode → mensagem
const errorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  EMAIL_NOT_CONFIRMED: 'Confirme seu e-mail antes de acessar.',
  ACCOUNT_LOCKED: 'Conta bloqueada. Entre em contato com o suporte.',
  RATE_LIMIT: 'Muitas tentativas. Aguarde antes de tentar novamente.',
}
```

## Tech Stack and Constraints
- Technologies: React Hook Form, Zod, AuthContext, React Router v6
- Design: AuthLayout (sem sidebar), referência visual Kiwify

## Examples
- Input: `{ email: 'ana@mony.com', password: 'Senha@123' }` → sem 2FA
- Output: redirect para `/dashboard`
- Input: `{ email: 'ana@mony.com', password: 'errada' }`
- Output: mensagem "E-mail ou senha incorretos." abaixo do formulário
