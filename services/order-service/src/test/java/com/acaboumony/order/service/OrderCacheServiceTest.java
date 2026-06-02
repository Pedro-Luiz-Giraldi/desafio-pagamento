package com.acaboumony.order.service;

import com.acaboumony.order.domain.entity.Order;
import com.acaboumony.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderCacheServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOps;

    @Mock
    private OrderRepository orderRepository;

    private OrderCacheService cacheService;

    private UUID orderId;
    private Order order;

    @BeforeEach
    void setUp() {
        cacheService = new OrderCacheService(redisTemplate, orderRepository, objectMapper);
        orderId = UUID.randomUUID();
        order = new Order();
        order.setId(orderId);
        order.setCustomerId(UUID.randomUUID());
        order.setMerchantId(UUID.randomUUID());
        order.setTotalInCents(1000L);
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
    }

    @Test
    void deve_retornar_order_do_cache_quando_hit() throws Exception {
        var json = objectMapper.writeValueAsString(order);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("order:" + orderId)).thenReturn(json);

        var result = cacheService.findById(orderId);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(orderId);
        verify(orderRepository, never()).findById(any());
    }

    @Test
    void deve_buscar_no_banco_quando_cache_miss() throws Exception {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("order:" + orderId)).thenReturn(null);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        var result = cacheService.findById(orderId);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(orderId);
        verify(valueOps).set(eq("order:" + orderId), anyString(), eq(60L), eq(TimeUnit.SECONDS));
    }

    @Test
    void deve_remover_do_cache_quando_evict() {
        cacheService.evict(orderId);

        verify(redisTemplate).delete("order:" + orderId);
    }

    @Test
    void deve_tratar_json_invalido_quando_cache_hit() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("order:" + orderId)).thenReturn("invalid-json");
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        var result = cacheService.findById(orderId);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(orderId);
        verify(redisTemplate).delete("order:" + orderId);
    }

    @Test
    void deve_cachear_order_manualmente_quando_cacheOrder() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        cacheService.cacheOrder(order);

        verify(valueOps).set(eq("order:" + orderId), anyString(), eq(60L), eq(TimeUnit.SECONDS));
    }

    @Test
    void deve_retornar_vazio_quando_cache_miss_e_sem_banco() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.get("order:" + orderId)).thenReturn(null);
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        var result = cacheService.findById(orderId);

        assertThat(result).isEmpty();
        verify(redisTemplate, never()).delete(anyString());
    }

    @Test
    void deve_tratar_erro_de_serializacao_quando_cache_order() throws Exception {
        var brokenMapper = new ObjectMapper();
        var service = new OrderCacheService(redisTemplate, orderRepository, brokenMapper);

        service.cacheOrder(order);

        verify(redisTemplate, never()).opsForValue();
    }
}
