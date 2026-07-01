package com.acaboumony.order.dto.response;

import java.util.UUID;

public record ProductResponse(
    UUID id,
    UUID merchantId,
    String name,
    String description,
    Long priceInCents,
    boolean active
) {}
