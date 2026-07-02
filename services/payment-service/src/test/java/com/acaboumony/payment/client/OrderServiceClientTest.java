package com.acaboumony.payment.client;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OrderServiceClientTest {

    private final OrderServiceClient client = new OrderServiceClient("http://localhost:9999", "test-secret", CircuitBreakerRegistry.ofDefaults());

    @Test
    void validateOrder_whenServiceUnavailable_returnsUnavailable() {
        var result = client.validateOrder(UUID.randomUUID(), UUID.randomUUID());

        assertNotNull(result);
        assertFalse(result.valid());
        assertEquals("ORDER_SERVICE_UNAVAILABLE", result.errorCode());
    }

    @Test
    void validateOrder_recordConstructor_works() {
        var merchantId = UUID.randomUUID();
        var result = new OrderServiceClient.OrderValidationResult(true, null, merchantId);

        assertTrue(result.valid());
        assertNull(result.errorCode());
        assertEquals(merchantId, result.merchantId());
    }

    @Test
    void validateOrder_recordWithErrorCode() {
        var result = new OrderServiceClient.OrderValidationResult(false, "ORDER_NOT_FOUND", null);

        assertFalse(result.valid());
        assertEquals("ORDER_NOT_FOUND", result.errorCode());
        assertNull(result.merchantId());
    }
}
