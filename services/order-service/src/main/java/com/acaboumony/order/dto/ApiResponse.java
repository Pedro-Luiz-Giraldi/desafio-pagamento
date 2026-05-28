package com.acaboumony.order.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        T data,
        Meta meta,
        List<ErrorDetail> errors
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, new Meta(Instant.now(), null), List.of());
    }

    public static <T> ApiResponse<T> success(T data, String requestId) {
        return new ApiResponse<>(data, new Meta(Instant.now(), requestId), List.of());
    }

    public static <T> ApiResponse<T> error(List<ErrorDetail> errors) {
        return new ApiResponse<>(null, new Meta(Instant.now(), null), errors);
    }

    public static <T> ApiResponse<T> error(List<ErrorDetail> errors, String requestId) {
        return new ApiResponse<>(null, new Meta(Instant.now(), requestId), errors);
    }

    public record Meta(Instant timestamp, String requestId) {
    }

    public record ErrorDetail(
            String code,
            String message,
            @JsonInclude(JsonInclude.Include.NON_NULL) String field,
            boolean retryable
    ) {
        public ErrorDetail(String code, String message) {
            this(code, message, null, false);
        }

        public ErrorDetail(String code, String message, boolean retryable) {
            this(code, message, null, retryable);
        }
    }
}
