# Task 02: Fix OrderCacheService to properly cache Order entities

## Objective
Fix OrderCacheService to serialize the full Order entity (as JSON) in Redis instead of just storing the orderId. Also update TransactionEventConsumer to use the cache for reads.

## Priority: HIGH

## Target Files
- services/order-service/src/main/java/com/acaboumony/order/service/OrderCacheService.java
- services/order-service/src/main/java/com/acaboumony/order/event/TransactionEventConsumer.java

## Dependencies
None (can run in parallel with Task 01)

## TDD Mode: REQUIRED

## Behavior
1. **OrderCacheService.findById()**: On cache hit, deserialize the stored JSON string back to an Order entity using Jackson ObjectMapper. On cache miss, fetch from DB, serialize to JSON, store in Redis with TTL 60s.
2. **OrderCacheService.evict()**: Keep existing evict logic.
3. **TransactionEventConsumer**: Use `orderCacheService.findById()` instead of `orderRepository.findById()` for reads before updating status. Keep the evict call after save.

## Tests to write
- `deve_retornar_order_do_cache_quando_hit()` — cache hit retorna Order desserializado, sem chamar DB
- `deve_buscar_no_banco_quando_cache_miss()` — cache miss busca no DB e popula cache
- `deve_remover_do_cache_quando_evict()` — evict remove a chave do Redis
- `deve_usar_cache_quando_consumer_atualiza_status()` — TransactionEventConsumer usa cache antes de atualizar
