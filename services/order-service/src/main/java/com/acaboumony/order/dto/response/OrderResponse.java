package com.acaboumony.order.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID orderId,
        String status,
        Long totalInCents,
        List<ItemResponse> items,
        Instant expiresAt,
        Instant createdAt
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
