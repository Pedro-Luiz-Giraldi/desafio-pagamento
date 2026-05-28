package com.acaboumony.order.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class IdempotencyService {

    private static final String KEY_PREFIX = "idempotency:order:";
    private static final long TTL_HOURS = 24;

    private final StringRedisTemplate redisTemplate;

    public IdempotencyService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean isDuplicate(UUID idempotencyKey) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(buildKey(idempotencyKey)));
    }

    public void markProcessed(UUID idempotencyKey) {
        redisTemplate.opsForValue().set(buildKey(idempotencyKey), "1", TTL_HOURS, TimeUnit.HOURS);
    }

    public void markProcessed(UUID idempotencyKey, UUID orderId) {
        redisTemplate.opsForValue().set(buildKey(idempotencyKey), orderId.toString(), TTL_HOURS, TimeUnit.HOURS);
    }

    public Optional<UUID> getExistingOrderId(UUID idempotencyKey) {
        var value = redisTemplate.opsForValue().get(buildKey(idempotencyKey));
        if (value == null || "1".equals(value)) {
            return Optional.empty();
        }
        return Optional.of(UUID.fromString(value));
    }

    private String buildKey(UUID idempotencyKey) {
        return KEY_PREFIX + idempotencyKey;
    }
}
