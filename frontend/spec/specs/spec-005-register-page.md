---
id: spec-005
status: active
links:
  - spec/specs/index.md
  - spec/user-stories/us-002-register-flow.md
---
# Register Page

## Context and Primary Objective
- Context: Tela de cadastro de novos usuários — `/register`
- Objective: Coletar nome, e-mail e senha; submeter POST /auth/register; exibir instrução de confirmação de e-mail

## Functional Requirements (Behavior)
- User story: Como novo usuário, quero me cadastrar para criar minha conta.
- Business rules:
  - Validação Zod local: nome (mín. 2 chars), e-mail válido, senha (mín. 8 chars, pelo menos 1 maiúscula, 1 número), confirmação de senha igual
  - Após sucesso → NÃO autentica automaticamente; exibe tela de "Verifique seu e-mail"
  - Erros do backend não devem revelar se o e-mail já existe (segurança — resposta genérica)
  - Link "Já tenho conta" → /login

## Acceptance Criteria (BDD)
- Given nome com 1 caractere, when sai do campo, then Zod exibe "Nome deve ter pelo menos 2 caracteres"
- Given senha com menos de 8 caracteres, when sai do campo, then Zod exibe "Senha deve ter pelo menos 8 caracteres"
- Given senha sem maiúscula ou número, when sai do campo, then Zod exibe "Senha deve conter letra maiúscula e número"
- Given confirmação diferente da senha, when sai do campo confirmação, then Zod exibe "As senhas não coincidem"
- Given formulário válido, when submete, then POST /api/v1/auth/register é chamado e tela muda para "Verifique seu e-mail para confirmar o cadastro"
- Given e-mail já existente, when backend retorna qualquer erro 409, then exibe mensagem genérica "Não foi possível criar a conta. Verifique os dados e tente novamente." — sem mencionar que o e-mail existe
- Given tela de "verifique seu e-mail", when clica "Reenviar e-mail", then POST /auth/resend-confirmation e exibe feedback de reenvio

## Interface and Data Contracts
```typescript
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter número'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})
```

- API: `POST /api/v1/auth/register` → body: `{ name, email, password }`
- Success response: `{ data: { message: 'Confirmation email sent' } }`

## Tech Stack and Constraints
- Technologies: React Hook Form, Zod, React Router v6
- Design: AuthLayout

## Examples
- Input: `{ name: 'Ana', email: 'ana@mony.com', password: 'Senha@123', confirmPassword: 'Senha@123' }`
- Output: tela de "Verifique seu e-mail"
