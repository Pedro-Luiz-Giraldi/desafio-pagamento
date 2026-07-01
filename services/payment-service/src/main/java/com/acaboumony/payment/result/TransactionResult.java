package com.acaboumony.payment.result;

import com.acaboumony.payment.dto.response.TransactionResponse;

import java.util.UUID;

public sealed interface TransactionResult permits
    TransactionResult.Approved,
    TransactionResult.Failed {

    record Approved(
        String transactionId,
        Long mpPaymentId,
        UUID orderId,
        long processingTimeMs,
        boolean duplicate
    ) implements TransactionResult {}

    record Failed(
        String errorCode,
        String message,
        boolean retryable,
        long processingTimeMs
    ) implements TransactionResult {}

    static TransactionResponse toResponse(TransactionResult result) {
        return switch (result) {
            case Approved a -> new TransactionResponse(
                a.transactionId(),
                a.mpPaymentId(),
                a.orderId(),
                null, // customerId
                null, // merchantId
                "APPROVED",
                null, // amountInCents
                null, // currency
                null, // cardBrand
                null, // cardLastFour
                null, // installments
                a.processingTimeMs(),
                null, // createdAt
                null  // refunds
            );
            case Failed f -> new TransactionResponse(
                null, // transactionId
                null, // mpPaymentId
                null, // orderId
                null, // customerId
                null, // merchantId
                "FAILURE",
                null, // amountInCents
                null, // currency
                null, // cardBrand
                null, // cardLastFour
                null, // installments
                f.processingTimeMs(),
                null, // createdAt
                null  // refunds
            );
        };
    }
}
