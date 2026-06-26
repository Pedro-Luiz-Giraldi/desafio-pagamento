# Feature Spec: Fix Merchant Registration Flow

**Feature ID:** `merchant-registration-fix`  
**Status:** Planning  
**Priority:** Critical (P0)  
**Created:** 2025-01-24  
**Complexity:** Medium

---

## Problem Statement

Merchant account creation is currently broken. When users fill out the registration form and submit:

1. ❌ Frontend sends `role: "MERCHANT"` (invalid enum value)
2. ❌ Frontend doesn't collect required fields: `companyName` and `cnpj`
3. ❌ Backend validation rejects the request silently
4. ❌ Frontend shows success message despite API failure
5. ❌ User is redirected to login but credentials don't exist
6. ❌ User cannot log in with the "created" account

**Root Cause:**
- Frontend/backend contract mismatch on `RegisterRequest` schema
- Missing form fields for merchant-specific data
- Incorrect role value (`"MERCHANT"` vs `"MERCHANT_OWNER"`)

---

## Requirements

### [REQ-001] Update Registration Request Schema
**Priority:** P0  
**Description:** Frontend must send all required fields for `MERCHANT_OWNER` registration.

**Acceptance Criteria:**
- `RegisterRequest` type includes `companyName: string`
- `RegisterRequest` type includes `cnpj: string`
- `role` field uses `"MERCHANT_OWNER"` instead of `"MERCHANT"`
- API call sends all required fields to backend

---

### [REQ-002] Add Company Name Field
**Priority:** P0  
**Description:** Registration form must collect the merchant's company name.

**Acceptance Criteria:**
- Form displays "Nome da Empresa" input field
- Field is required (validation error if empty)
- Field accepts 2-100 characters (matches backend validation)
- Field is positioned after "Nome" field
- Error message: "Nome da empresa obrigatório"

---

### [REQ-003] Add CNPJ Field with Validation
**Priority:** P0  
**Description:** Registration form must collect and validate Brazilian CNPJ (tax ID).

**Acceptance Criteria:**
- Form displays "CNPJ" input field
- Field is required (validation error if empty)
- Field applies CNPJ mask: `XX.XXX.XXX/XXXX-XX`
- Field validates CNPJ format (14 digits)
- Field validates CNPJ checksum (Brazilian algorithm)
- Error messages:
  - Empty: "CNPJ obrigatório"
  - Invalid format: "CNPJ inválido (use XX.XXX.XXX/XXXX-XX)"
  - Invalid checksum: "CNPJ inválido"

---

### [REQ-004] CNPJ Utility Functions
**Priority:** P0  
**Description:** Create reusable utilities for CNPJ formatting and validation.

**Acceptance Criteria:**
- `formatCnpj(value: string): string` - Applies mask to raw digits
- `validateCnpjFormat(cnpj: string): boolean` - Checks format (14 digits)
- `validateCnpjChecksum(cnpj: string): boolean` - Validates checksum
- `cleanCnpj(cnpj: string): string` - Removes mask, returns only digits
- Functions handle edge cases: empty strings, partial input, invalid characters
- Unit tests cover all functions with valid/invalid cases

---

### [REQ-005] Error Handling Improvements
**Priority:** P1  
**Description:** Registration form must properly handle and display backend validation errors.

**Acceptance Criteria:**
- API errors are caught and displayed in `formError` state
- Field-specific errors (from backend) map to individual field errors
- Success state only shows when API returns 201 Created
- Loading state prevents double-submission
- Error messages are user-friendly (Portuguese)

---

### [REQ-006] Update Tests
**Priority:** P1  
**Description:** All existing and new functionality must have test coverage.

**Acceptance Criteria:**
- `register-page.test.tsx` updated with new fields
- Tests verify `companyName` and `cnpj` are required
- Tests verify CNPJ validation (format + checksum)
- Tests verify API call includes all fields with correct role
- `validation.test.ts` covers all CNPJ utility functions
- `auth.api.test.ts` updated to match new schema
- All tests pass: `npm test`

---

## Non-Requirements

- ❌ Support for CUSTOMER role registration (out of scope - merchants only)
- ❌ CNPJ lookup/autocomplete from government API (future enhancement)
- ❌ Company address fields (not required by backend in MVP)
- ❌ Multi-step registration wizard (single form is sufficient)
- ❌ CNPJ uniqueness validation in frontend (backend handles this)

---

## Technical Design Notes

### CNPJ Validation Algorithm

Brazilian CNPJ uses a checksum algorithm with two verification digits:

```
CNPJ format: XX.XXX.XXX/XXXX-XX
             12 345 678 9012 34
             └─────┬─────┘ └┬┘
               base digits  check digits
```

**Algorithm:**
1. Extract 12 base digits
2. Calculate first check digit using weights [5,4,3,2,9,8,7,6,5,4,3,2]
3. Calculate second check digit using weights [6,5,4,3,2,9,8,7,6,5,4,3,2] + first check digit
4. Compare calculated digits with provided digits 13-14

**Reference:** [Receita Federal - CNPJ Validation](https://www.gov.br/receitafederal/pt-br)

### API Contract

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "merchant@example.com",
  "password": "SecurePass123",
  "fullName": "Ana Silva",
  "role": "MERCHANT_OWNER",
  "companyName": "Ana's Store",
  "cnpj": "12.345.678/0001-90"
}
```

**Success Response (201 Created):**
```json
{
  "userId": "uuid",
  "email": "merchant@example.com",
  "role": "MERCHANT_OWNER",
  "merchantId": "uuid",
  "emailConfirmed": false
}
```

**Error Response (400 Bad Request):**
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "errors": {
    "companyName": "MISSING_MERCHANT_DATA",
    "cnpj": "MISSING_MERCHANT_DATA"
  }
}
```

---

## Dependencies

### External
- Backend `user-service` must be running on port 8080
- Redis must be available (for email confirmation tokens)

### Internal
- `frontend/src/types/auth.ts` - Type definitions
- `frontend/src/api/auth.api.ts` - API client
- `frontend/src/utils/validation.ts` - Validation utilities
- `frontend/src/pages/auth/register-page.tsx` - Registration form
- `frontend/src/components/ui/Input.tsx` - Form input component

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| CNPJ validation algorithm incorrect | High | Low | Use official Receita Federal algorithm, add comprehensive test cases |
| Backend rejects valid CNPJ format | High | Low | Test with real CNPJ examples, verify backend accepts masked format |
| Users don't know their CNPJ | Medium | Medium | Add help text with format example, allow paste from clipboard |
| Form becomes too long/intimidating | Low | Medium | Keep fields grouped logically, use clear labels, maintain single-page form |

---

## Success Metrics

- ✅ Merchant can successfully register with all required fields
- ✅ Backend creates User + Merchant entities atomically
- ✅ Email confirmation token is generated and stored in Redis
- ✅ User receives confirmation email (check backend logs)
- ✅ After email confirmation, user can log in successfully
- ✅ All unit tests pass (≥80% coverage maintained)
- ✅ TypeScript compiles without errors
- ✅ No console errors during registration flow

---

## Out of Scope (Future Enhancements)

- **CNPJ Lookup API Integration:** Auto-fill company name from government database
- **Real-time CNPJ Validation:** Check if CNPJ is already registered (backend does this on submit)
- **Company Logo Upload:** Add during registration or in settings later
- **Multi-step Wizard:** Break registration into steps (personal → company → confirmation)
- **Social Login:** Register via Google/Facebook for merchants
- **Invite Codes:** Require invitation to register as merchant (waitlist feature)

---

## Related Documents

- Backend: `services/user-service/src/main/java/com/acaboumony/user/dto/request/RegisterRequest.java`
- Backend: `services/user-service/src/main/java/com/acaboumony/user/validation/RegisterRequestValidator.java`
- Backend: `services/user-service/src/main/java/com/acaboumony/user/service/AuthService.java`
- Frontend: `.specs/features/app-shell/spec.md` (Auth flow context)
