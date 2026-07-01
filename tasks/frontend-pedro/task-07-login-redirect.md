# T7: Login Redirect Based on Role

**Phase:** 2 — Frontend Core
**Service:** frontend
**Dependencies:** None

## TDD Mode: REQUIRED

## Objective

After successful login, redirect user based on their role.

## Target Files

- `frontend/src/pages/auth/login-page.tsx`
- `frontend/src/stores/auth.store.ts`

## Details

1. After login success, check `user.role` from the auth store
2. MERCHANT_OWNER → redirect to `/dashboard`
3. CUSTOMER → redirect to `/client/dashboard`
4. Auth store already has `user` with `role` after login

## Acceptance Criteria

- MERCHANT_OWNER login redirects to `/dashboard` (unchanged)
- CUSTOMER login redirects to `/client/dashboard`

## Traceability

R5, R6
