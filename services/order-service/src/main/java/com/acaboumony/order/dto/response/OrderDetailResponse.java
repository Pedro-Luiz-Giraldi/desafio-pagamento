package com.acaboumony.order.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderDetailResponse(
        UUID orderId,
        UUID customerId,
        UUID merchantId,
        String status,
        Long totalInCents,
        List<ItemResponse> items,
        String transactionId,
        Instant createdAt,
        Instant updatedAt,
        Instant expiresAt
) {
    public record ItemResponse(
            String productId,
            String description,
            Integer quantity,
            Long unitPriceInCents,
            Long subtotalInCents
    ) {
    }
}
