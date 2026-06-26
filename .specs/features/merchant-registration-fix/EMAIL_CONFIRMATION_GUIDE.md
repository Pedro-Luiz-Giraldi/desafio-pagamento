# Email Confirmation Guide

**Feature:** Merchant Registration  
**Date:** 2025-01-24

---

## 📧 How Email Confirmation Works

### Flow Overview

1. **User registers** → Backend creates user with status `PENDING_EMAIL_CONFIRMATION`
2. **Backend generates token** → Stores in Redis with 24h TTL: `email_confirm:{token}` → `{userId}`
3. **Backend publishes event** → `UserRegistered` event with token to Kafka
4. **Email service** (if running) → Sends email with confirmation link
5. **User clicks link** → Opens `/confirm-email?token={token}`
6. **Frontend calls API** → `POST /api/v1/auth/confirm-email` with token
7. **Backend validates** → Changes user status to `ACTIVE`
8. **User can login** → Account is now active

---

## 🔍 How to Get the Confirmation Token

Since you're in development and may not have an email service running, here are **3 ways** to get the token:

### Method 1: Check Backend Logs ✅ (Recommended)

The backend logs the token when a user registers. Look for:

```
User registered: userId={uuid}, role=MERCHANT_OWNER
```

Then check the Kafka event logs or Redis directly.

**Better approach:** Check the `UserEventProducer` - it publishes the token in the event.

### Method 2: Check Redis Directly ✅ (Easiest)

The token is stored in Redis with the key pattern `email_confirm:{token}`.

**Steps:**
```bash
# Connect to Redis
redis-cli

# List all email confirmation tokens
KEYS email_confirm:*

# Example output:
# 1) "email_confirm:a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Get the userId for a token
GET email_confirm:a1b2c3d4-e5f6-7890-abcd-ef1234567890
# Output: "user-uuid-here"
```

**Extract the token:**
The token is the part after `email_confirm:`, for example:
- Key: `email_confirm:a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Token: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Method 3: Check Kafka Events ✅ (If Kafka is running)

The `UserRegistered` event contains the confirmation token.

**Steps:**
```bash
# Consume from the user-events topic
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic user-events \
  --from-beginning

# Look for events like:
{
  "eventType": "USER_REGISTERED",
  "userId": "...",
  "email": "merchant@example.com",
  "confirmationToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

## 🚀 How to Confirm Email

### Option 1: Use the Frontend (Recommended)

Once you have the token, open this URL in your browser:

```
http://localhost:5173/confirm-email?token=YOUR_TOKEN_HERE
```

**Example:**
```
http://localhost:5173/confirm-email?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

The page will:
1. Show "Confirmando email" (loading)
2. Call the backend API
3. Show "Email confirmado com sucesso" (success)
4. Provide a link to login

### Option 2: Use curl (Direct API Call)

```bash
curl -X POST http://localhost:8080/api/v1/auth/confirm-email \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

**Success response:** `200 OK` (empty body)

**Error response:** `400 Bad Request` if token is invalid/expired

---

## 🧪 Complete Testing Flow

### Step-by-Step

1. **Register a new merchant:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePass123",
       "fullName": "Test User",
       "role": "MERCHANT_OWNER",
       "companyName": "Test Company",
       "cnpj": "11222333000181"
     }'
   ```

   **Expected response (201 Created):**
   ```json
   {
     "userId": "uuid-here",
     "email": "test@example.com",
     "role": "MERCHANT_OWNER",
     "merchantId": "merchant-uuid-here",
     "emailConfirmed": false
   }
   ```

2. **Get the confirmation token from Redis:**
   ```bash
   redis-cli KEYS "email_confirm:*"
   ```

   Copy the token (the part after `email_confirm:`).

3. **Confirm the email:**
   
   **Option A - Browser:**
   ```
   http://localhost:5173/confirm-email?token=YOUR_TOKEN
   ```

   **Option B - curl:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/confirm-email \
     -H "Content-Type: application/json" \
     -d '{"token": "YOUR_TOKEN"}'
   ```

4. **Verify the token is deleted from Redis:**
   ```bash
   redis-cli KEYS "email_confirm:*"
   # Should return empty or not include your token
   ```

5. **Login with the confirmed account:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePass123"
     }'
   ```

   **Expected response (200 OK):**
   ```json
   {
     "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
     "tokenType": "Bearer",
     "expiresIn": 900,
     "requiresTwoFactor": false
   }
   ```

6. **Login via frontend:**
   - Go to http://localhost:5173/login
   - Enter email and password
   - Should redirect to dashboard

---

## ❌ Common Issues

### Issue 1: "Token de confirmacao ausente"
**Cause:** No token in URL query parameter  
**Solution:** Make sure URL has `?token=...` at the end

### Issue 2: "Nao foi possivel confirmar o email"
**Cause:** Token is invalid or expired  
**Solutions:**
- Check if token exists in Redis: `redis-cli GET email_confirm:YOUR_TOKEN`
- Token expires after 24 hours - resend confirmation if expired
- Make sure you copied the full token (UUIDs are 36 characters with dashes)

### Issue 3: Login fails with "Email not confirmed"
**Cause:** Email confirmation didn't work  
**Solutions:**
- Check user status in database: should be `ACTIVE`, not `PENDING_EMAIL_CONFIRMATION`
- Confirm email again using the steps above
- Check backend logs for errors during confirmation

### Issue 4: Can't find token in Redis
**Cause:** Token wasn't created or Redis is not running  
**Solutions:**
- Check if Redis is running: `redis-cli ping` (should return `PONG`)
- Check backend logs for errors during registration
- Make sure backend is connected to Redis (check application.yml)

---

## 🔧 Resend Confirmation Email

If the token expired (24h TTL), you can request a new one:

```bash
curl -X POST http://localhost:8080/api/v1/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Response:** `200 OK` (empty body)

Then get the new token from Redis and confirm again.

---

## 📊 Check User Status

To verify if email is confirmed, check the database:

```sql
-- PostgreSQL
SELECT id, email, full_name, role, status, email_confirmed_at 
FROM users 
WHERE email = 'test@example.com';
```

**Status values:**
- `PENDING_EMAIL_CONFIRMATION` - Email not confirmed yet
- `ACTIVE` - Email confirmed, can login
- `DISABLED` - Account disabled by admin

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| List tokens | `redis-cli KEYS "email_confirm:*"` |
| Get userId | `redis-cli GET email_confirm:TOKEN` |
| Confirm via browser | `http://localhost:5173/confirm-email?token=TOKEN` |
| Confirm via API | `curl -X POST http://localhost:8080/api/v1/auth/confirm-email -H "Content-Type: application/json" -d '{"token": "TOKEN"}'` |
| Resend confirmation | `curl -X POST http://localhost:8080/api/v1/auth/resend-confirmation -H "Content-Type: application/json" -d '{"email": "EMAIL"}'` |
| Check Redis | `redis-cli` |
| Check user status | `SELECT status FROM users WHERE email = 'EMAIL';` |

---

## 🎉 Success!

Once email is confirmed:
- ✅ User status changes to `ACTIVE`
- ✅ Token is deleted from Redis
- ✅ User can login successfully
- ✅ User is redirected to dashboard

---

**Need help?** Check the backend logs for detailed error messages.
