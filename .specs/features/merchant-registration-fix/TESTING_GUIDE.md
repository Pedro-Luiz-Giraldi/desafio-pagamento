# Merchant Registration - Testing Guide

**Feature:** `merchant-registration-fix`  
**Date:** 2025-01-24

---

## 🚀 Quick Start

### Prerequisites
1. Backend `user-service` running on port 8080
2. Redis available
3. Frontend dev server: `npm run dev`

---

## 🧪 Manual Testing Scenarios

### Scenario 1: Happy Path ✅

**Goal:** Verify complete registration flow works end-to-end

**Steps:**
1. Navigate to `/register`
2. Fill in all fields:
   - Nome: `Ana Silva`
   - Nome da Empresa: `Loja da Ana`
   - CNPJ: `11.222.333/0001-81` (or `12.345.678/0001-95`)
   - Email: `ana@example.com`
   - Senha: `SecurePass123`
3. Click "Criar conta"

**Expected Results:**
- ✅ Success message appears: "O link de confirmacao foi enviado para seu email"
- ✅ Backend logs show user creation
- ✅ Backend logs show merchant creation
- ✅ Redis contains confirmation token
- ✅ Email sent (check backend logs)

**Next Steps:**
4. Check backend logs for confirmation token
5. Navigate to `/confirm-email?token=<token>`
6. Verify email confirmed
7. Navigate to `/login`
8. Log in with `ana@example.com` / `SecurePass123`
9. Verify redirect to dashboard

---

### Scenario 2: CNPJ Auto-Formatting 🎨

**Goal:** Verify CNPJ mask applies as user types

**Steps:**
1. Navigate to `/register`
2. Click on CNPJ field
3. Type slowly: `11222333000181`

**Expected Results:**
- After `11`: Shows `11`
- After `112`: Shows `11.2`
- After `11222`: Shows `11.222`
- After `112223`: Shows `11.222.3`
- After `11222333`: Shows `11.222.333`
- After `112223330`: Shows `11.222.333/0`
- After `1122233300`: Shows `11.222.333/00`
- After `112223330001`: Shows `11.222.333/0001`
- After `1122233300018`: Shows `11.222.333/0001-8`
- After `11222333000181`: Shows `11.222.333/0001-81`

---

### Scenario 3: Empty Fields Validation ❌

**Goal:** Verify all fields are required

**Steps:**
1. Navigate to `/register`
2. Click "Criar conta" without filling anything

**Expected Results:**
- ✅ Error: "Nome obrigatorio"
- ✅ Error: "Nome da empresa obrigatorio"
- ✅ Error: "CNPJ obrigatorio"
- ✅ Error: "Email obrigatorio"
- ✅ Error: "Senha obrigatoria"
- ✅ No API call made
- ✅ Form not submitted

---

### Scenario 4: Invalid CNPJ Format ❌

**Goal:** Verify CNPJ format validation

**Steps:**
1. Navigate to `/register`
2. Fill all fields except CNPJ with valid data
3. Enter CNPJ: `123` (too short)
4. Click "Criar conta"

**Expected Results:**
- ✅ Error: "CNPJ invalido (use XX.XXX.XXX/XXXX-XX)"
- ✅ No API call made

**Repeat with:**
- `11.222.333/0001` (incomplete)
- `abc` (non-numeric)

---

### Scenario 5: Invalid CNPJ Checksum ❌

**Goal:** Verify CNPJ checksum validation

**Steps:**
1. Navigate to `/register`
2. Fill all fields with valid data
3. Enter CNPJ: `11.222.333/0001-00` (wrong checksum)
4. Click "Criar conta"

**Expected Results:**
- ✅ Error: "CNPJ invalido"
- ✅ No API call made

**Repeat with:**
- `11.222.333/0001-99`
- `00000000000000` (all zeros)
- `11111111111111` (all same digit)

---

### Scenario 6: Duplicate Email ❌

**Goal:** Verify backend error handling for duplicate email

**Steps:**
1. Register a user with email `test@example.com`
2. Try to register again with same email

**Expected Results:**
- ✅ Error message appears
- ✅ Field-specific error on email field (if backend provides it)
- ✅ User-friendly error message in Portuguese

---

### Scenario 7: Duplicate CNPJ ❌

**Goal:** Verify backend error handling for duplicate CNPJ

**Steps:**
1. Register a merchant with CNPJ `11.222.333/0001-81`
2. Try to register again with same CNPJ

**Expected Results:**
- ✅ Error message appears
- ✅ Field-specific error on CNPJ field (if backend provides it)
- ✅ User-friendly error message: "CNPJ invalido ou ja cadastrado"

---

### Scenario 8: Paste CNPJ 📋

**Goal:** Verify pasting CNPJ works correctly

**Steps:**
1. Navigate to `/register`
2. Copy `11222333000181` (without mask)
3. Paste into CNPJ field

**Expected Results:**
- ✅ Mask applies automatically: `11.222.333/0001-81`
- ✅ Field accepts pasted value
- ✅ Validation passes

**Repeat with:**
- Paste `11.222.333/0001-81` (with mask)
- Should work the same

---

### Scenario 9: Loading State 🔄

**Goal:** Verify loading state prevents double-submission

**Steps:**
1. Navigate to `/register`
2. Fill all fields with valid data
3. Click "Criar conta"
4. Immediately try to click again

**Expected Results:**
- ✅ Button shows spinner: "Criando conta"
- ✅ Button is disabled
- ✅ Cannot submit twice
- ✅ Only one API call made

---

### Scenario 10: Backend Unavailable ⚠️

**Goal:** Verify error handling when backend is down

**Steps:**
1. Stop backend service
2. Navigate to `/register`
3. Fill all fields with valid data
4. Click "Criar conta"

**Expected Results:**
- ✅ Error message appears
- ✅ User-friendly error: "Nao foi possivel criar a conta"
- ✅ No success message shown
- ✅ Form remains filled (user doesn't lose data)

---

## 🧪 Automated Tests

### Run All Tests
```bash
wsl bash -c "cd frontend && npm test"
```

### Run Specific Test Files
```bash
# CNPJ utilities
wsl bash -c "cd frontend && npm test validation.test.ts"

# API client
wsl bash -c "cd frontend && npm test auth.api.test.ts"

# Registration page
wsl bash -c "cd frontend && npm test register-page.test.tsx"
```

### TypeScript Compilation
```bash
wsl bash -c "cd frontend && npx tsc -b"
```

### Build
```bash
wsl bash -c "cd frontend && npm run build"
```

---

## 📊 Test Coverage

### CNPJ Utilities (`validation.test.ts`)
- ✅ `cleanCnpj()` - 5 test cases
- ✅ `formatCnpj()` - 6 test cases
- ✅ `validateCnpjFormat()` - 4 test cases
- ✅ `validateCnpjChecksum()` - 5 test cases

**Total:** 20 test cases

### API Client (`auth.api.test.ts`)
- ✅ Register with all required fields
- ✅ Correct role sent (`MERCHANT_OWNER`)
- ✅ All other auth endpoints

**Total:** 6 test cases

### Registration Page (`register-page.test.tsx`)
- ✅ Validates all required fields
- ✅ Registers merchant successfully
- ✅ Shows registration errors
- ✅ Validates CNPJ format
- ✅ Validates CNPJ checksum
- ✅ Formats CNPJ as user types

**Total:** 6 test cases

---

## 🐛 Known Issues

### Node.js Version
- **Issue:** WSL environment has Node.js v18, but Vite requires v20+
- **Impact:** Cannot run `npm test` or `npm run build` in WSL
- **Workaround:** TypeScript compilation works (`npx tsc -b`)
- **Solution:** Upgrade Node.js in WSL to v20+

---

## ✅ Acceptance Checklist

Before marking as complete, verify:

### Functionality
- [ ] User can register with all required fields
- [ ] CNPJ mask applies automatically
- [ ] CNPJ validation works (format + checksum)
- [ ] Backend creates User + Merchant entities
- [ ] Email confirmation token stored in Redis
- [ ] User receives confirmation email
- [ ] User can confirm email
- [ ] User can log in after confirmation
- [ ] User redirected to dashboard after login

### Validation
- [ ] Empty fields show errors
- [ ] Invalid CNPJ format shows error
- [ ] Invalid CNPJ checksum shows error
- [ ] Duplicate email shows error
- [ ] Duplicate CNPJ shows error

### UX
- [ ] CNPJ formatting is smooth (no lag)
- [ ] Error messages are clear and in Portuguese
- [ ] Loading state prevents double-submission
- [ ] Success message is clear
- [ ] No console errors during flow

### Technical
- [ ] TypeScript compiles without errors
- [ ] All unit tests pass
- [ ] Build succeeds
- [ ] No regressions in existing auth flows

---

## 📝 Test Data

### Valid CNPJs
```
11.222.333/0001-81
12.345.678/0001-95
```

### Invalid CNPJs (for testing)
```
11.222.333/0001-00  (wrong checksum)
11.222.333/0001-99  (wrong checksum)
00000000000000      (all zeros)
11111111111111      (all same digit)
123                 (too short)
11.222.333/0001     (incomplete)
```

### Generate More
https://www.4devs.com.br/gerador_de_cnpj

---

## 🔍 Debugging Tips

### Check Backend Logs
```bash
# User creation
grep "Creating user" logs/user-service.log

# Merchant creation
grep "Creating merchant" logs/user-service.log

# Email confirmation
grep "Email confirmation token" logs/user-service.log
```

### Check Redis
```bash
# List all keys
redis-cli KEYS "*"

# Get confirmation token
redis-cli GET "email:confirmation:<email>"
```

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit registration form
4. Look for `/api/v1/auth/register` request
5. Verify request payload includes all fields
6. Verify response status (201 = success, 400 = validation error)

---

## 🎯 Success Criteria

All scenarios above should pass with ✅ results.

**Status:** Ready for testing  
**Next:** Execute manual testing scenarios with backend running
