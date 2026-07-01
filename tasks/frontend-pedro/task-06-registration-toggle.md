# T6: Registration Page with Role Toggle

**Phase:** 2 — Frontend Core
**Service:** frontend
**Dependencies:** T1

## TDD Mode: REQUIRED

## Objective

Add role toggle (Cliente/Merchant) to the registration page. Show/hide fields based on role.

## Target Files

- `frontend/src/pages/auth/register-page.tsx`
- `frontend/src/types/auth.ts`
- `frontend/src/api/auth.api.ts`

## Details

1. Add role toggle (two buttons or radio): "Sou Cliente" | "Sou Merchant"
2. When "Cliente" selected: show fullName, email, password fields only
3. When "Merchant" selected: show fullName, email, password, companyName, CNPJ (existing)
4. `RegisterRequest` type: add optional `role: 'CUSTOMER' | 'MERCHANT_OWNER'`
5. `authApi.register()`: send `role` field based on toggle selection
6. Client registration sends: `{ fullName, email, password, role: 'CUSTOMER' }`
7. Merchant registration sends: `{ fullName, email, password, role: 'MERCHANT_OWNER', companyName, cnpj }`

## Acceptance Criteria

- Toggle switches between Cliente and Merchant forms
- Cliente form has only name, email, password fields
- Merchant form has name, email, password, companyName, CNPJ (unchanged)
- API call sends correct role and fields
- Existing merchant registration still works
- Tests pass

## Traceability

R1, R2, R3, R4
