# Merchant Registration Fix — Implementation Plan

**Created:** 2025-01-24  
**Status:** Ready for Implementation  
**Priority:** Critical (P0)  
**Estimated Time:** ~2.5 hours

---

## 🐛 Problem Summary

Merchant registration is currently **broken**. When users try to create an account:

1. ❌ Form submits successfully (no errors shown)
2. ❌ Success message appears
3. ❌ User is redirected to login
4. ❌ Login fails — account doesn't exist
5. ❌ User is confused and frustrated

### Root Cause

**Frontend/Backend Contract Mismatch:**

| What Backend Expects | Whsult |
|---------------------|---------------------|---------|
| `role: "MERCHANT_OWNER"` | `role: "MERCHANT"` | ❌ Invalid enum |
at Frontend Sends | Re| `companyNaroperly hanme: "..."` | *(missing)* | ❌ Validation fails dle the error and shows a success message anyway.

---

## ✅ Solution Overview

**Implement proper merchant registration with all required fields:**

### Changes Required

1. **Add CNPJ Utilities** (`validation.ts`)
   - Format: Apply mask `XX.XXX.XXX/XXXt the fronte|
| `cnpj: "..."` | *(missing)* | ❌ Validation fails |

The backend's `RegisterRequestValidator` rejects the request, bund doesn't pX-XX`
   - Validate: Check format (14 digits) + checksum (Brazilian algorithm)
   - Clean: Remove mask for API submission

2. **Update Types** (`auth.ts`)
   - Add `companyName: string` to `RegisterRequest`
   - Add `cnpj: string` to `RegisterRequest`
   - Change `role` from `"MERCHANT"` to `"MERCHANT_OWNER"`

3. **Update API Client** (`auth.api.ts`)
   - Accept `companyName` and `cnpj` parameters
   - Send correct role: `"MERCHANT_OWNER"`

4. **Update Registration Form** (`register-page.tsx`)
   - Add "Nome da Empresa" input field
   - Add "CNPJ" input field with auto-formatting
   - Add validation for both fields
   - Improve error handling

5. **Add Tests**
   - CNPJ utilities: format, validate, clean
   - Registration form: new fields, validation
   - API client: correct payload

---

## 📋 Task Breakdown

| Task | Description | Time | Dependencies |
|------|-------------|------|--------------|
| **T-01** | Add CNPJ validation utilities | 30 min | — |
| **T-02** | Update auth types | 10 min | — |
| **T-03** | Update auth API client | 15 min | T-02 |
| **T-04** | Add company name field | 20 min | T-02, T-03 |
| **T-05** | Add CNPJ field with validation | 30 min | T-01, T-02, T-03, T-04 |
| **T-06** | Improve error handling | 15 min | T-04, T-05 |
| **T-07** | Integration testing | 20 min | All above |

**Total:** ~2.5 hours

---

## 🎯 Success Criteria

After implementation, the following must work:

### Happy Path
1. ✅ User fills out registration form with all fields
2. ✅ CNPJ mask applies automatically as user types
3. ✅ Form validates all fields (including CNPJ checksum)
4. ✅ API call succeeds (201 Created)
5. ✅ Success message appears
6. ✅ Backend creates User + Merchant entities
7. ✅ Email confirmation token stored in Redis
8. ✅ User confirms email via link
9. ✅ User logs in successfully
10. ✅ User is redirected to dashboard

### Error Handling
1. ✅ Empty fields show validation errors
2. ✅ Invalid CNPJ format shows error
3. ✅ Invalid CNPJ checksum shows error
4. ✅ Backend errors map to field-specific errors
5. ✅ Duplicate email shows appropriate error

### Technical
1. ✅ All unit tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc -b`
3. ✅ Build succeeds: `npm run build`
4. ✅ No console errors during flow
5. ✅ No regressions in existing auth flows

---

## 🧪 Test Data

Use these valid CNPJs for testing:

```
11.222.333/0001-81
12.345.678/0001-95
```

Generate more at: https://www.4devs.com.br/gerador_de_cnpj

---

## 📚 Documentation

### Specification
- **Full Spec:** `.specs/features/merchant-registration-fix/spec.md`
  - Requirements with IDs ([REQ-001] through [REQ-006])
  - Technical design notes
  - CNPJ validation algorithm
  - API contract
  - Risks and mitigations

### Tasks
- **Task Breakdown:** `.specs/features/merchant-registration-fix/tasks.md`
  - 7 atomic tasks with clear acceptance criteria
  - Dependencies and execution order
  - Test requirements and gate checks
  - Traceability to requirements

### State
- **Project State:** `.specs/project/STATE.md`
  - Bug discovery recorded
  - Root cause analysis
  - Solution plan
  - Decisions made

---

## 🚀 Next Steps

### To Start Implementation:

1. **Review the plan:**
   ```bash
   cat .specs/features/merchant-registration-fix/spec.md
   cat .specs/features/merchant-registration-fix/tasks.md
   ```

2. **Start backend:**
   ```bash
   # Make sure user-service is running on port 8080
   # Make sure Redis is available
   ```

3. **Execute tasks:**
   - Start with T-01 and T-02 (can run in parallel)
   - Then T-03 (depends on T-02)
   - Then T-04, T-05, T-06 (sequential)
   - Finally T-07 (integration testing)

4. **Verify:**
   - Run tests: `npm test`
   - Build: `npm run build`
   - Manual testing with backend

---

## 💡 Key Implementation Notes

### CNPJ Validation Algorithm

Brazilian CNPJ uses a two-digit checksum:

```
Format: XX.XXX.XXX/XXXX-XX
        12 345 678 9012 34
        └─────┬─────┘ └┬┘
          base digits  check digits
```

**Algorithm:**
1. Extract 12 base digits
2. Calculate first check digit using weights `[5,4,3,2,9,8,7,6,5,4,3,2]`
3. Calculate second check digit using weights `[6,5,4,3,2,9,8,7,6,5,4,3,2]` + first check digit
4. Compare with provided digits 13-14

### API Contract

**Request:**
```json
POST /api/v1/auth/register
{
  "email": "merchant@example.com",
  "password": "SecurePass123",
  "fullName": "Ana Silva",
  "role": "MERCHANT_OWNER",
  "companyName": "Ana's Store",
  "cnpj": "12.345.678/0001-90"
}
```

**Success (201):**
```json
{
  "userId": "uuid",
  "email": "merchant@example.com",
  "role": "MERCHANT_OWNER",
  "merchantId": "uuid",
  "emailConfirmed": false
}
```

---

## 🔄 Rollback Plan

If issues arise:

1. **Atomic commits:** Each task gets its own commit for easy rollback
2. **Feature flag:** Can disable registration link if needed
3. **Revert:** Use git to revert to previous working state
4. **Hotfix:** Create minimal fix if issue is isolated

---

## 📞 Questions?

- **Spec unclear?** Check `.specs/features/merchant-registration-fix/spec.md`
- **Task details?** Check `.specs/features/merchant-registration-fix/tasks.md`
- **Backend contract?** Check `services/user-service/.../RegisterRequest.java`
- **Need help?** Ask for clarification before starting

---

**Ready to implement? Let's fix this bug! 🚀**
