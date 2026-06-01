package com.acaboumony.gateway.client;

import java.util.UUID;

public record ValidatedClaims(
        UUID userId,
        String email,
        String role,
        UUID merchantId
) {}
