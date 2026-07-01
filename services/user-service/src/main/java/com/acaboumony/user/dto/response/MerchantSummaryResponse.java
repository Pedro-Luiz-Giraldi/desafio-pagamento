package com.acaboumony.user.dto.response;

import java.time.Instant;
import java.util.UUID;

public record MerchantSummaryResponse(
    UUID id,
    String companyName,
    Instant createdAt
) {}
