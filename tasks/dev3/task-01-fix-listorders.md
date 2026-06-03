# Task 01: Fix listOrders ADMIN/MERCHANT + authorizeAccess NPE

## Objective
Fix bugs in OrderService.listOrders() for ADMIN and MERCHANT roles, and fix NullPointerException in authorizeAccess() when merchantId is null.

## Priority: HIGH

## Target Files
- services/order-service/src/main/java/com/acaboumony/order/repository/OrderRepository.java
- services/order-service/src/main/java/com/acaboumony/order/service/OrderService.java

## Dependencies
None

## TDD Mode: REQUIRED

## Behavior
1. **ADMIN listOrders with statusFilter**: Add `Page<Order> findByStatus(OrderStatus status, Pageable pageable)` to `OrderRepository`. In `OrderService.listOrders()`, use it when ADMIN role has a status filter (instead of `findByCustomerIdAndStatus(null, ...)`).
2. **MERCHANT listOrders fallthrough**: Change the MERCHANT branch condition from `"MERCHANT".equals(role) && merchantId != null` to check merchantId inside the branch. If merchantId is null for MERCHANT, throw InsufficientPermissionsException.
3. **authorizeAccess NPE**: Add null guard before `order.getMerchantId().equals(merchantId)` — check `merchantId != null` first.
4. **MERCHANT authorizeAccess**: Also validate merchantId is not null for MERCHANT role.

## Tests to write
- `deve_listar_pedidos_com_statusFilter_quando_admin()` — ADMIN lista com status filter, usa findByStatus
- `deve_listar_pedidos_sem_statusFilter_quando_admin()` — ADMIN lista sem filter, usa findAll
- `deve_lancar_erro_quando_merchant_sem_merchantId_lista()` — MERCHANT sem X-Merchant-Id lança erro
- `deve_listar_pedidos_quando_merchant_com_merchantId()` — MERCHANT com merchantId lista corretamente
- `deve_autorizar_merchant_quando_merchantId_valido()` — authorizeAccess com merchantId válido
- `deve_lancar_erro_quando_merchant_sem_merchantId_acessa()` — authorizeAccess com merchantId null
