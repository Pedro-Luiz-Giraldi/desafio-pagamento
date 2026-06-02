package com.acaboumony.order.service;

import com.acaboumony.order.domain.entity.Order;
import com.acaboumony.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class OrderCacheService {

    private static final Logger log = LoggerFactory.getLogger(OrderCacheService.class);
    private static final String KEY_PREFIX = "order:";
    private static final long TTL_SECONDS = 60;

    private final StringRedisTemplate redisTemplate;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    public OrderCacheService(StringRedisTemplate redisTemplate, OrderRepository orderRepository, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.orderRepository = orderRepository;
        this.objectMapper = objectMapper;
    }

    public Optional<Order> findById(UUID orderId) {
        var cached = redisTemplate.opsForValue().get(buildKey(orderId));
        if (cached != null) {
            log.debug("Cache hit for order {}", orderId);
            try {
                return Optional.of(objectMapper.readValue(cached, Order.class));
            } catch (Exception e) {
                log.warn("Failed to deserialize cached order {}, falling back to DB", orderId, e);
                redisTemplate.delete(buildKey(orderId));
            }
        }

        log.debug("Cache miss for order {}", orderId);
        var order = orderRepository.findById(orderId);
        order.ifPresent(o -> {
            try {
                var json = objectMapper.writeValueAsString(o);
                redisTemplate.opsForValue().set(buildKey(orderId), json, TTL_SECONDS, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("Failed to serialize order {} for caching", orderId, e);
            }
        });
        return order;
    }

    public void evict(UUID orderId) {
        redisTemplate.delete(buildKey(orderId));
        log.debug("Cache evicted for order {}", orderId);
    }

    public void cacheOrder(Order order) {
        try {
            var json = objectMapper.writeValueAsString(order);
            redisTemplate.opsForValue().set(buildKey(order.getId()), json, TTL_SECONDS, TimeUnit.SECONDS);
            log.debug("Order {} cached manually", order.getId());
        } catch (Exception e) {
            log.warn("Failed to cache order {} manually", order.getId(), e);
        }
    }

    private String buildKey(UUID orderId) {
        return KEY_PREFIX + orderId;
    }
}
