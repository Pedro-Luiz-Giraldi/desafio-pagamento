package com.acaboumony.order.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ItemRequest(
        @NotBlank String productId,
        @NotBlank @Size(max = 255) String description,
        @NotNull @Min(1) @Max(999) Integer quantity,
        @NotNull @Min(1) @Max(999999) Long unitPriceInCents
) {
}
