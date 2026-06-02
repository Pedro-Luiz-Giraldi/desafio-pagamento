# Task 04: Rate limit metrics (notification-service)

## Objective
Expose EmailRateLimiter metrics via Micrometer MeterRegistry at /actuator/metrics.

## Priority: MEDIUM

## Target Files
- services/notification-service/src/main/java/com/acaboumony/notification/service/EmailRateLimiter.java

## Dependencies
None (can run in parallel with Tasks 01-03)

## TDD Mode: REQUIRED

## Behavior
1. Inject `MeterRegistry` into `EmailRateLimiter`
2. Add counters:
   - `notification.email.sent` — incremented on successful email send (counter)
   - `notification.email.rate.limited` — incremented when rate limited (counter)
3. Add gauge:
   - `notification.email.active.buckets` — current number of buckets in the rate limiter map
4. The metrics should be visible at `/actuator/metrics/notification.email.*`

## Tests to write
- `deve_incrementar_counter_quando_email_enviado()`
- `deve_incrementar_rate_limited_quando_excede_limite()`
- `deve_expor_gauge_de_buckets_ativos()`
