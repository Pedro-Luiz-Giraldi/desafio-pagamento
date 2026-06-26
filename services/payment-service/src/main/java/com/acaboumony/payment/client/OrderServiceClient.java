package com.acaboumony.payment.client;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class OrderServiceClient {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceClient.class);

    private final RestTemplate restTemplate;
    private final String orderServiceUrl;
    private final String internalSecret;
    private final CircuitBreaker circuitBreaker;

    public OrderServiceClient(@Value("${order.service.url}") String orderServiceUrl,
                              @Value("${payment.internal-secret:dev-secret}") String internalSecret,
                              CircuitBreakerRegistry circuitBreakerRegistry) {
        this.orderServiceUrl = orderServiceUrl;
        this.internalSecret = internalSecret;
        this.restTemplate = new RestTemplateBuilder()
            .setConnectTimeout(Duration.ofMillis(500))
            .setReadTimeout(Duration.ofMillis(500))
            .build();
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("orderService");
    }

    public OrderValidationResult validateOrder(UUID orderId, UUID merchantId) {
        try {
            return circuitBreaker.executeSupplier(() -> {
                var headers = new HttpHeaders();
                headers.set("X-Internal-Secret", internalSecret);

                var entity = new HttpEntity<Void>(headers);
                ResponseEntity<OrderData> response = restTemplate.exchange(
                    orderServiceUrl + "/internal/orders/{orderId}",
                    HttpMethod.GET,
                    entity,
                    OrderData.class,
                    orderId
                );

                var orderData = response.getBody();
                if (orderData == null) {
                    return new OrderValidationResult(false, "ORDER_NOT_FOUND");
                }

                if (!"PENDING".equals(orderData.status())) {
                    return new OrderValidationResult(false, "ORDER_NOT_PENDING");
                }

                return new OrderValidationResult(true, null);
            });
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            return new OrderValidationResult(false, "ORDER_NOT_FOUND");
        } catch (Exception e) {
            log.warn("Order service unavailable or error: {}", e.getMessage());
            return new OrderValidationResult(false, "ORDER_SERVICE_UNAVAILABLE");
        }
    }

    public Optional<OrderDetails> fetchOrderDetails(UUID orderId) {
        try {
            return circuitBreaker.executeSupplier(() -> {
                var headers = new HttpHeaders();
                headers.set("X-Internal-Secret", internalSecret);

                var entity = new HttpEntity<Void>(headers);
                ResponseEntity<OrderData> response = restTemplate.exchange(
                    orderServiceUrl + "/internal/orders/{orderId}",
                    HttpMethod.GET,
                    entity,
                    OrderData.class,
                    orderId
                );

                var body = response.getBody();
                if (body == null) return Optional.<OrderDetails>empty();

                var items = body.items() != null ? body.items() : List.<OrderDetails.ItemDto>of();
                return Optional.of(new OrderDetails(body.orderId(), body.status(), body.totalInCents(), items));
            });
        } catch (Exception e) {
            log.warn("Could not fetch order details for {}: {}", orderId, e.getMessage());
            return Optional.empty();
        }
    }

    public record OrderValidationResult(boolean valid, String errorCode) {}

    public record OrderDetails(UUID orderId, String status, Long totalInCents, List<ItemDto> items) {
        public record ItemDto(String description, Integer quantity, Long unitPriceInCents) {}
    }

    private record OrderData(
        UUID orderId,
        UUID customerId,
        UUID merchantId,
        String status,
        Long totalInCents,
        List<OrderDetails.ItemDto> items
    ) {}
}
