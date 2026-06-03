package com.acaboumony.order.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdempotencyServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOps;

    private IdempotencyService idempotencyService;

    @BeforeEach
    void setUp() {
        idempotencyService = new IdempotencyService(redisTemplate);
    }

    @Test
    void shouldReturnTrueWhenKeyExists() {
        var key = UUID.randomUUID();
        when(redisTemplate.hasKey("idempotency:order:" + key)).thenReturn(true);

        var result = idempotencyService.isDuplicate(key);

        assertThat(result).isTrue();
    }

    @Test
    void shouldReturnFalseWhenKeyDoesNotExist() {
        var key = UUID.randomUUID();
        when(redisTemplate.hasKey("idempotency:order:" + key)).thenReturn(false);

        var result = idempotencyService.isDuplicate(key);

        assertThat(result).isFalse();
    }

    @Test
    void shouldMarkProcessedWithOrderId() {
        var key = UUID.randomUUID();
        var orderId = UUID.randomUUID();
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        idempotencyService.markProcessed(key, orderId);

        verify(valueOps).set("idempotency:order:" + key, orderId.toString(), 24, TimeUnit.HOURS);
    }

    @Test
    void shouldMarkProcessedWithoutOrderId() {
        var key = UUID.randomUUID();
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        idempotencyService.markProcessed(key);

        verify(valueOps).set("idempotency:order:" + key, "1", 24, TimeUnit.HOURS);
    }

    @Test
    void shouldReturnExistingOrderId() {
        var key = UUID.randomUUID();
        var orderId = UUID.randomUUID();
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("idempotency:order:" + key)).thenReturn(orderId.toString());

        var result = idempotencyService.getExistingOrderId(key);

        assertThat(result).isPresent().contains(orderId);
    }

    @Test
    void shouldReturnEmptyWhenValueIsOne() {
        var key = UUID.randomUUID();
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("idempotency:order:" + key)).thenReturn("1");

        var result = idempotencyService.getExistingOrderId(key);

        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnEmptyWhenNull() {
        var key = UUID.randomUUID();
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("idempotency:order:" + key)).thenReturn(null);

        var result = idempotencyService.getExistingOrderId(key);

        assertThat(result).isEmpty();
    }
}
