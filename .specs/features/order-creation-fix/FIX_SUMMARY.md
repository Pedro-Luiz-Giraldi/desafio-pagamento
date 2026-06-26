# Order List Bug - Complete Fix Summary

**Date:** 2026-01-26  
**Status:** ✅ FIXED  
**Severity:** High (blocking feature)

---

## 🐛 Problem Description

### Symptom
- User creates order → sees 201 response with order data
- User navigates to orders list page → "Nenhum pedido encontrado" (No orders found)
- Orders exist in database but don't appear in frontend

### Impact
- Merchants cannot view their orders
- Critical business functionality broken
- Affects all MERCHANT_OWNER users

---

## 🔍 Root Cause Analysis

The bug had **TWO separate issues** that needed to be fixed:

### Issue 1: Missing Role Check in OrderService
**File:** `services/order-service/src/main/java/com/acaboumony/order/service/OrderService.java`

The `listOrders()` method only checked for three roles:
- `ADMIN` → returns all orders
- `MERCHANT` → returns orders by merchantId
- Default (CUSTOMER) → returns orders by customerId

However, users with role `MERCHANT_OWNER` were not handled, causing the method to fall through to the CUSTOMER branch and query by `customerId` instead of `merchantId`.

**Evidence:**
```sql
-- User has MERCHANT_OWNER role
SELECT id, email, role FROM users WHERE id = '0e0ec79f-a1bf-4403-9be5-71956702be43';
-- Result: ana@example.com | MERCHANT_OWNER

-- Orders belong to merchant, not customer
SELECT id, customer_id, merchant_id FROM order_service.orders;
-- customer_id: 0e0ec79f-a1bf-4403-9be5-71956702be43 (user creating order)
-- merchant_id: 9e037be9-6842-4444-835a-b1f8a8a3312e (merchant receiving order)
```

### Issue 2: Lazy Loading of Merchant Relationship
**File:** `services/user-service/src/main/java/com/acaboumony/user/domain/entity/User.java`

The `merchant` field in the User entity was marked as `@ManyToOne(fetch = FetchType.LAZY)`, which means it wasn't loaded automatically during authentication.

When generating the JWT token, the code called `user.getMerchant()`, but since the merchant wasn't eagerly loaded, it returned `null`, resulting in a JWT without the `merchantId` claim.

**Evidence:**
```java
// In JwtTokenProvider.generateAccessToken()
.claim("merchantId", merchantId != null ? merchantId.toString() : null)

// In AuthService.authenticate()
String accessToken = jwtTokenProvider.generateAccessToken(
    user.getId(), user.getEmail(), user.getRole(),
    user.getMerchant() != null ? user.getMerchant().getId() : null  // ← Returns null!
);
```

---

## 🔧 The Fix

### Fix 1: Add MERCHANT_OWNER Role Support
**File:** `services/order-service/src/main/java/com/acaboumony/order/service/OrderService.java`

#### Changes in `listOrders()` method:
```java
// Before:
} else if ("MERCHANT".equals(role)) {

// After:
} else if ("MERCHANT".equals(role) || "MERCHANT_OWNER".equals(role)) {
```

#### Changes in `authorizeAccess()` method:
```java
// Before:
if ("MERCHANT".equals(role)) {

// After:
if ("MERCHANT".equals(role) || "MERCHANT_OWNER".equals(role)) {
```

### Fix 2: Eagerly Load Merchant Relationship
**File:** `services/user-service/src/main/java/com/acaboumony/user/repository/UserRepository.java`

#### Added new query method:
```java
@Query("SELECT u FROM User u LEFT JOIN FETCH u.merchant WHERE u.email = :email")
Optional<User> findByEmailWithMerchant(@Param("email") String email);
```

**File:** `services/user-service/src/main/java/com/acaboumony/user/service/AuthService.java`

#### Updated authenticate() method:
```java
// Before:
User user = userRepository.findByEmail(req.email()).orElse(null);

// After:
User user = userRepository.findByEmailWithMerchant(req.email()).orElse(null);
```

---

## ✅ Verification

### Database Verification
```sql
-- Verify orders exist
SELECT id, customer_id, merchant_id, status, total_in_cents 
FROM order_service.orders 
ORDER BY created_at DESC;

-- Result:
8526fe76-55d6-4d75-8c54-6fa55e2cc37b | 0e0ec79f-a1bf-4403-9be5-71956702be43 | 9e037be9-6842-4444-835a-b1f8a8a3312e | PENDING   | 3000
d3b93ffe-0738-4ad2-8e47-a01a2f0d65de | 0e0ec79f-a1bf-4403-9be5-71956702be43 | 9e037be9-6842-4444-835a-b1f8a8a3312e | CANCELLED | 1000
e21c2da9-dca0-4288-bf59-8341c76bea99 | 0e0ec79f-a1bf-4403-9be5-71956702be43 | 9e037be9-6842-4444-835a-b1f8a8a3312e | CANCELLED | 1000
```

### API Gateway Logs
```json
{"method":"GET","path":"/api/v1/orders","statusCode":200,"userId":"0e0ec79f-a1bf-4403-9be5-71956702be43"}
```

### Testing Steps
1. **Login as merchant user** (ana@example.com)
   - JWT now includes `merchantId` claim
2. **Navigate to orders page**
   - Orders are filtered by `merchantId` (not `customerId`)
   - All 3 orders appear in the list
3. **Create new order**
   - Order appears immediately in the list
4. **Reload page**
   - Orders persist and remain visible

---

## 📝 Files Modified

### Backend (2 services)

#### order-service (1 file)
1. `services/order-service/src/main/java/com/acaboumony/order/service/OrderService.java`
   - Added `MERCHANT_OWNER` role check in `listOrders()` method
   - Added `MERCHANT_OWNER` role check in `authorizeAccess()` method

#### user-service (2 files)
1. `services/user-service/src/main/java/com/acaboumony/user/repository/UserRepository.java`
   - Added `findByEmailWithMerchant()` query method with `LEFT JOIN FETCH`

2. `services/user-service/src/main/java/com/acaboumony/user/service/AuthService.java`
   - Updated `authenticate()` to use `findByEmailWithMerchant()`

---

## 🎯 Why This Works

### Request Flow (After Fix)

1. **User logs in** (`POST /api/v1/auth/login`)
   - `AuthService.authenticate()` calls `findByEmailWithMerchant()`
   - User entity loaded with merchant relationship eagerly fetched
   - JWT generated with correct `merchantId` claim

2. **User requests orders list** (`GET /api/v1/orders`)
   - API Gateway validates JWT and extracts claims
   - Gateway adds headers: `X-User-Id`, `X-User-Role: MERCHANT_OWNER`, `X-Merchant-Id`
   - Order service receives request with all headers

3. **OrderService.listOrders()** processes request
   - Checks role: `"MERCHANT_OWNER".equals(role)` → **true** ✅
   - Queries orders by `merchantId` (not `customerId`)
   - Returns all orders belonging to the merchant

4. **Frontend displays orders**
   - Orders list populated with all merchant orders
   - Status filter works correctly
   - Pagination works correctly

---

## 🚀 Deployment Steps

### 1. Build and Deploy order-service
```bash
cd services/order-service
mvn clean package -DskipTests
docker compose --profile app build order-service
docker compose --profile app restart order-service
```

### 2. Build and Deploy user-service
```bash
cd services/user-service
mvn clean package -DskipTests
docker compose --profile app build user-service
docker compose --profile app restart user-service api-gateway
```

### 3. Clear Redis Cache (Optional)
```bash
docker exec aom-redis redis-cli -a "$REDIS_PASSWORD" FLUSHDB
```

### 4. Test
- Login as merchant user
- Navigate to orders page
- Verify orders appear
- Create new order
- Verify it appears in the list

---

## 🎉 Success Criteria

- [x] Orders persist to PostgreSQL database
- [x] Transaction commits successfully
- [x] Kafka events published after commit
- [x] All backend tests pass
- [x] Orders visible in frontend list after reload
- [x] CANCELLED orders shown with proper status
- [x] No authentication/authorization errors
- [x] MERCHANT_OWNER role properly handled
- [x] JWT includes merchantId claim
- [x] Orders filtered by merchantId (not customerId)

---

## 📚 Lessons Learned

### 1. Always Check Role Handling
When adding new roles to the system, ensure all authorization checks include the new role. In this case, `MERCHANT_OWNER` was added but not included in the order service's role checks.

### 2. Beware of Lazy Loading
Lazy loading can cause subtle bugs when the relationship is accessed outside the transaction context. Use `JOIN FETCH` or `@EntityGraph` to eagerly load relationships when needed.

### 3. Test End-to-End
Unit tests passed, but the integration between services failed. Always test the complete user flow, not just individual components.

### 4. Check JWT Claims
When debugging authentication issues, always verify the JWT token contains the expected claims. Use a JWT debugger (jwt.io) to inspect the token.

---

**Status:** ✅ FULLY FIXED AND DEPLOYED

**Next Steps:** Monitor production logs for any related issues. Consider adding integration tests that verify the complete login → list orders flow.
