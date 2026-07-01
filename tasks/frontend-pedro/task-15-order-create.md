# T15: Order Creation with Merchant Selection + Product Catalog

**Phase:** 4 — Client Frontend
**Service:** frontend
**Dependencies:** T3, T14

## TDD Mode: REQUIRED

## Objective

Replace the existing order creation page with a multi-step flow: select merchant → browse products → add items → submit.

## Target Files

- `frontend/src/pages/orders/order-create-page.tsx` (rewrite, significant changes)

## Details

1. **Step 1 — Select Merchant** (if not preselected from `/merchants`): dropdown/list of merchants, or skip if `?merchantId=` in URL
2. **Step 2 — Browse Products:** fetch `useProducts(merchantId)`, display catalog, "Adicionar" per product, cart summary
3. **Step 3 — Review & Submit:** cart items with quantity changes, submit → `ordersApi.create()`
4. **On success:** redirect to `/pay/{orderId}` (R23)
5. Hide `/orders/new` from MERCHANT_OWNER nav; redirect to `/dashboard` if MERCHANT_OWNER visits directly

**API call:**
```typescript
await ordersApi.create({
  merchantId: selectedMerchantId,
  items: cartItems.map(item => ({
    productId: item.product.id,
    description: item.product.name,
    quantity: item.quantity,
    unitPriceInCents: item.product.priceInCents,
  }))
})
```

## Acceptance Criteria

- Client can select merchant, browse products, add to cart, and submit
- `productId` from catalog is sent (not free-text)
- After submission, redirected to `/pay/{orderId}`
- Merchant visiting `/orders/new` is redirected
- Tests pass

## Traceability

R21, R23
