# Tasks: Fix Merchant Registration Flow

**Feature:** `merchant-registration-fix`  
**Status:** Ready for execution  
**Created:** 2025-01-24

---

## Task Breakdown

### T-01: Add CNPJ Validation Utilities
**Status:** Pending  
**Priority:** P0  
**Estimated effort:** 30 min  
**Depends on:** —

**What:**
Create utility functions for CNPJ formatting, validation, and cleaning in `frontend/src/utils/validation.ts`.

**Where:**
- `frontend/src/utils/validation.ts` - Add CNPJ functions
- `frontend/src/utils/validation.test.ts` - Add comprehensive tests

**Implementation Details:**
```typescript
// Add to validation.ts:
export function formatCnpj(value: string): string
export function validateCnpjFormat(cnpj: string): boolean
export function validateCnpjChecksum(cnpj: string): boolean
export function cleanCnpj(cnpj: string): string
```

**CNPJ Checksum Algorithm:**
1. Extract 12 base digits from cleaned CNPJ
2. Calculate first check digit:
   - Multiply each digit by weights [5,4,3,2,9,8,7,6,5,4,3,2]
   - Sum all products
   - Remainder = sum % 11
   - Check digit = (remainder < 2) ? 0 : (11 - remainder)
3. Calculate second check digit:
   - Use 13 digits (base + first check digit)
   - Multiply by weights [6,5,4,3,2,9,8,7,6,5,4,3,2]
   - Apply same formula
4. Compare calculated digits with provided digits 13-14

**Test Cases:**
- Valid CNPJs: `11.222.333/0001-81`, `12.345.678/0001-95`
- Invalid format: `123`, `11.222.333/0001`, `abc`
- Invalid checksum: `11.222.333/0001-00`
- Edge cases: empty string, partial input, special chars

**Done when:**
- ✅ All 4 functions implemented
- ✅ `formatCnpj` applies mask `XX.XXX.XXX/XXXX-XX`
- ✅ `validateCnpjFormat` checks 14 digits
- ✅ `validateCnpjChecksum` validates using Brazilian algorithm
- ✅ `cleanCnpj` removes all non-digits
- ✅ Unit tests cover valid/invalid/edge cases
- ✅ Tests pass: `npm test -- validation.test.ts`

**Tests:** Unit (Vitest)  
**Gate:** `npm test -- validation.test.ts` passes

**Traceability:** [REQ-004]

---

### T-02: Update Auth Types
**Status:** Pending  
**Priority:** P0  
**Estimated effort:** 10 min  
**Depends on:** —

**What:**
Update `RegisterRequest` interface to include `companyName` and `cnpj`, and change role to `MERCHANT_OWNER`.

**Where:**
- `frontend/src/types/auth.ts`

**Implementation Details:**
```typescript
// Update RegisterRequest interface:
export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  role: 'MERCHANT_OWNER'  // Changed from 'MERCHANT'
  companyName: string     // Added
  cnpj: string            // Added
}

// Update RegisterResponse to include merchantId:
export interface RegisterResponse {
  userId: string
  email: string
  role: string
  merchantId?: string     // Added (optional, returned by backend)
  emailConfirmed: boolean
}
```

**Done when:**
- ✅ `RegisterRequest` includes `companyName: string`
- ✅ `RegisterRequest` includes `cnpj: string`
- ✅ `RegisterRequest.role` is `'MERCHANT_OWNER'`
- ✅ `RegisterResponse` includes optional `merchantId`
- ✅ TypeScript compiles: `npx tsc -b`

**Tests:** Type checking  
**Gate:** `npx tsc -b` passes

**Traceability:** [REQ-001]

---

### T-03: Update Auth API Client
**Status:** Pending  
**Priority:** P0  
**Estimated effort:** 15 min  
**Depends on:** T-02

**What:**
Update `authApi.register()` to accept and send `companyName` and `cnpj` with correct role.

**Where:**
- `frontend/src/api/auth.api.ts`
- `frontend/src/api/auth.api.test.ts`

**Implementation Details:**
```typescript
// Update RegisterMerchantInput interface:
interface RegisterMerchantInput {
  fullName: string
  email: string
  password: string
  companyName: string  // Added
  cnpj: string         // Added
}

// Update register function:
async register(input: RegisterMerchantInput): Promise<RegisterResponse> {
  const response = await client.post<RegisterResponse>('/api/v1/auth/register', {
    ...input,
    role: 'MERCHANT_OWNER',  // Changed from 'MERCHANT'
  })
  return response.data
}
```

**Done when:**
- ✅ `RegisterMerchantInput` includes `companyName` and `cnpj`
- ✅ API call sends `role: 'MERCHANT_OWNER'`
- ✅ API call includes all fields from input
- ✅ Tests updated to verify new fields are sent
- ✅ Tests pass: `npm test -- auth.api.test.ts`
- ✅ TypeScript compiles: `npx tsc -b`

**Tests:** Unit (Vitest)  
**Gate:** `npm test -- auth.api.test.ts` passes

**Traceability:** [REQ-001]

---

### T-04: Add Company Name Field to Registration Form
**Status:** Pending  
**Priority:** P0  
**Estimated effort:** 20 min  
**Depends on:** T-02, T-03

**What:**
Add "Nome da Empresa" input field to the registration form with validation.

**Where:**
- `frontend/src/pages/auth/register-page.tsx`
- `frontend/src/pages/auth/register-page.test.tsx`

**Implementation Details:**
```typescript
// Add state:
const [companyName, setCompanyName] = useState('')

// Add to errors type:
const [errors, setErrors] = useState<{
  fullName?: string
  email?: string
  password?: string
  companyName?: string  // Added
  cnpj?: string         // Added
}>({})

// Add validation in handleSubmit:
const nextErrors = {
  fullName: fullName.trim() ? undefined : 'Nome obrigatorio',
  email: email.trim() ? undefined : 'Email obrigatorio',
  password: password ? undefined : 'Senha obrigatoria',
  companyName: companyName.trim() ? undefined : 'Nome da empresa obrigatorio',
  cnpj: /* validation logic */ undefined : 'CNPJ obrigatorio',
}

// Add Input field (after fullName, before email):
<Input
  label="Nome da Empresa"
  value={companyName}
  error={errors.companyName}
  onChange={(event) => setCompanyName(event.target.value)}
  placeholder="Ex: Loja da Ana"
/>

// Update API call:
await authApi.register({
  fullName,
  email,
  password,
  companyName,
  cnpj,
})
```

**Done when:**
- ✅ Form displays "Nome da Empresa" field
- ✅ Field is positioned after "Nome" field
- ✅ Field is required (shows error if empty)
- ✅ Error message: "Nome da empresa obrigatorio"
- ✅ Field value is sent to API
- ✅ Tests verify field is required
- ✅ Tests verify field value is included in API call
- ✅ Tests pass: `npm test -- register-page.test.tsx`

**Tests:** Unit (Vitest + Testing Library)  
**Gate:** `npm test -- register-page.test.tsx` passes

**Traceability:** [REQ-002]

---

### T-05: Add CNPJ Field to Registration Form
**Status:** Pending  
**Priority:** P0  
**Estimated effort:** 30 min  
**Depends on:** T-01, T-02, T-03, T-04

**What:**
Add "CNPJ" input field with formatting, masking, and validation to the registration form.

**Where:**
- `frontend/src/pages/auth/register-page.tsx`
- `frontend/src/pages/auth/register-page.test.tsx`

**Implementation Details:**
```typescript
// Import CNPJ utilities:
import { formatCnpj, validateCnpjFormat, validateCnpjChecksum, cleanCnpj } from '@/utils/validation'

// Add state:
const [cnpj, setCnpj] = useState('')

// Add CNPJ change handler with auto-formatting:
function handleCnpjChange(event: React.ChangeEvent<HTMLInputElement>) {
  const formatted = formatCnpj(event.target.value)
  setCnpj(formatted)
}

// Add CNPJ validation in handleSubmit:
let cnpjError: string | undefined
if (!cnpj.trim()) {
  cnpjError = 'CNPJ obrigatorio'
} else if (!validateCnpjFormat(cnpj)) {
  cnpjError = 'CNPJ invalido (use XX.XXX.XXX/XXXX-XX)'
} else if (!validateCnpjChecksum(cnpj)) {
  cnpjError = 'CNPJ invalido'
}

const nextErrors = {
  // ... other fields
  cnpj: cnpjError,
}

// Add Input field (after companyName, before email):
<Input
  label="CNPJ"
  value={cnpj}
  error={errors.cnpj}
  onChange={handleCnpjChange}
  placeholder="XX.XXX.XXX/XXXX-XX"
  maxLength={18}  // Formatted length
/>

// Update API call to send cleaned CNPJ:
await authApi.register({
  fullName,
  email,
  password,
  companyName,
  cnpj: cleanCnpj(cnpj),  // Send only digits
})
```

**Done when:**
- ✅ Form displays "CNPJ" field
- ✅ Field is positioned after "Nome da Empresa"
- ✅ Field applies mask `XX.XXX.XXX/XXXX-XX` as user types
- ✅ Field validates format (14 digits)
- ✅ Field validates checksum (Brazilian algorithm)
- ✅ Error messages:
  - Empty: "CNPJ obrigatorio"
  - Invalid format: "CNPJ invalido (use XX.XXX.XXX/XXXX-XX)"
  - Invalid checksum: "CNPJ invalido"
- ✅ API receives cleaned CNPJ (digits only)
- ✅ Tests verify field is required
- ✅ Tests verify format validation
- ✅ Tests verify checksum validation
- ✅ Tests verify masked input formatting
- ✅ Tests pass: `npm test -- register-page.test.tsx`

**Tests:** Unit (Vitest + Testing Library)  
**Gate:** `npm test -- register-page.test.tsx` passes

**Traceability:** [REQ-003], [REQ-004]

---

### T-06: Improve Error Handling
**Status:** Pending  
**Priority:** P1  
**Estimated effort:** 15 min  
**Depends on:** T-04, T-05

**What:**
Enhance error handling to properly catch and display backend validation errors.

**Where:**
- `frontend/src/pages/auth/register-page.tsx`

**Implementation Details:**
```typescript
// Update error handling in handleSubmit:
try {
  await authApi.register({ fullName, email, password, companyName, cnpj: cleanCnpj(cnpj) })
  setSuccess(true)
} catch (error) {
  // Handle Axios error with response data
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data
    
    // Check for field-specific errors from backend
    if (data.errors) {
      setErrors({
        companyName: data.errors.companyName ? 'Nome da empresa invalido' : undefined,
        cnpj: data.errors.cnpj ? 'CNPJ invalido ou ja cadastrado' : undefined,
        email: data.errors.email ? 'Email invalido ou ja cadastrado' : undefined,
      })
      setFormError('Corrija os erros abaixo')
    } else {
      setFormError(data.detail || data.message || 'Nao foi possivel criar a conta')
    }
  } else {
    setFormError(error instanceof Error ? error.message : 'Nao foi possivel criar a conta')
  }
} finally {
  setSubmitting(false)
}
```

**Done when:**
- ✅ Backend validation errors map to field-specific errors
- ✅ Generic errors display in `formError`
- ✅ Success state only shows on 201 Created response
- ✅ Loading state prevents double-submission
- ✅ Error messages are user-friendly (Portuguese)
- ✅ Tests verify error handling scenarios
- ✅ Tests pass: `npm test -- register-page.test.tsx`

**Tests:** Unit (Vitest + Testing Library)  
**Gate:** `npm test -- register-page.test.tsx` passes

**Traceability:** [REQ-005]

---

### T-07: Integration Testing
**Status:** Pending  
**Priority:** P1  
**Estimated effort:** 20 min  
**Depends on:** T-01, T-02, T-03, T-04, T-05, T-06

**What:**
Verify the complete registration flow works end-to-end with the backend.

**Where:**
- Manual testing with running backend
- Optionally add E2E test to `tests/e2e/auth.spec.ts`

**Test Scenarios:**

1. **Happy Path:**
   - Fill all fields with valid data
   - Submit form
   - Verify success message appears
   - Check backend logs for user creation
   - Check Redis for confirmation token
   - Verify email confirmation flow works
   - Log in with created credentials
   - Verify redirect to dashboard

2. **Validation Errors:**
   - Submit with empty fields → verify error messages
   - Submit with invalid CNPJ format → verify error
   - Submit with invalid CNPJ checksum → verify error
   - Submit with existing email → verify backend error displayed

3. **Edge Cases:**
   - Paste CNPJ with mask → verify it works
   - Paste CNPJ without mask → verify formatting applies
   - Type slowly → verify mask applies character by character
   - Submit while loading → verify button is disabled

**Done when:**
- ✅ All test scenarios pass manually
- ✅ User can successfully register as merchant
- ✅ Backend creates User + Merchant entities
- ✅ Email confirmation token is stored in Redis
- ✅ User can confirm email and log in
- ✅ No console errors during flow
- ✅ TypeScript compiles: `npx tsc -b`
- ✅ All tests pass: `npm test`
- ✅ Build succeeds: `npm run build`

**Tests:** Manual + E2E (optional)  
**Gate:** Manual verification checklist complete

**Traceability:** All requirements

---

## Execution Plan

### Phase 1: Foundation (T-01, T-02)
Build the utilities and update types. No UI changes yet.

**Parallel execution:** ✅ T-01 and T-02 can run in parallel

**Estimated time:** 30 min

---

### Phase 2: API Integration (T-03)
Update the API client to use new types and send correct data.

**Depends on:** T-02 (types must exist)

**Estimated time:** 15 min

---

### Phase 3: UI Implementation (T-04, T-05, T-06)
Add form fields and validation to the registration page.

**Sequential execution:** T-04 → T-05 → T-06 (build incrementally)

**Estimated time:** 65 min

---

### Phase 4: Verification (T-07)
Test the complete flow end-to-end.

**Depends on:** All previous tasks

**Estimated time:** 20 min

---

## Total Estimated Time

**Development:** ~2 hours  
**Testing:** ~20 min  
**Total:** ~2.5 hours

---

## Success Criteria

- ✅ All 7 tasks completed
- ✅ All unit tests pass: `npm test`
- ✅ TypeScript compiles: `npx tsc -b`
- ✅ Build succeeds: `npm run build`
- ✅ Manual testing checklist complete
- ✅ User can register, confirm email, and log in successfully
- ✅ No regressions in existing auth flows (login, 2FA, etc.)

---

## Rollback Plan

If issues are discovered after implementation:

1. **Revert commits:** Use atomic commits per task for easy rollback
2. **Disable registration:** Add feature flag to hide registration link
3. **Fallback:** Revert to previous working state
4. **Hotfix:** Create minimal fix if issue is isolated

---

## Notes

- **CNPJ Test Data:** Use valid test CNPJs for development:
  - `11.222.333/0001-81`
  - `12.345.678/0001-95`
  - Generate more at: https://www.4devs.com.br/gerador_de_cnpj

- **Backend Compatibility:** Verify backend accepts CNPJ with or without mask (should accept both)

- **Future Enhancement:** Consider adding CNPJ lookup API to auto-fill company name from government database
