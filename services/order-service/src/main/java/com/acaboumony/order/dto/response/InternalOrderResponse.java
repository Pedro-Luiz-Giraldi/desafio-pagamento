package com.acaboumony.order.dto.response;

import java.util.List;
import java.util.UUID;

public record InternalOrderResponse(
        UUID orderId,
        String status,
        long totalInCents,
        UUID merchantId,
        UUID customerId,
        List<ItemDto> items
) {
    public record ItemDto(String description, Integer quantity, Long unitPriceInCents) {}
}
