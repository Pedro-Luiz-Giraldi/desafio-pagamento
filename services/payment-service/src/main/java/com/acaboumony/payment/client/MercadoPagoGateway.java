package com.acaboumony.payment.client;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.core.MPRequestOptions;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;

@Component
public class MercadoPagoGateway {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoGateway.class);

    private final PaymentClient paymentClient;
    private final ExecutorService executor;
    private final long timeoutMs;
    private final String notificationUrl;
    private final CircuitBreaker circuitBreaker;

    public MercadoPagoGateway(
            @Value("${mercadopago.timeout-ms:800}") long timeoutMs,
            @Value("${mercadopago.notification-url:}") String notificationUrl,
            CircuitBreakerRegistry circuitBreakerRegistry) {
        this.paymentClient = new PaymentClient();
        this.executor = Executors.newVirtualThreadPerTaskExecutor();
        this.timeoutMs = timeoutMs;
        this.notificationUrl = notificationUrl;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("mercadoPago");
    }

    public PaymentResult createPayment(String cardToken, Long amountInCents,
                                        String paymentMethodId, Integer installments,
                                        UUID orderId, String customerEmail) {
        try {
            return circuitBreaker.executeSupplier(() ->
                doCreatePayment(cardToken, amountInCents, paymentMethodId,
                    installments, orderId, customerEmail));
        } catch (Exception e) {
            log.warn("MP gateway circuit breaker fallback: {}", e.getMessage(), e);
            return PaymentResult.timeout();
        }
    }

    private PaymentResult doCreatePayment(String cardToken, Long amountInCents,
                                           String paymentMethodId, Integer installments,
                                           UUID orderId, String customerEmail) {
        var start = Instant.now();
        
        // Log request details for debugging
        log.info("Creating MP payment: amount={}, paymentMethod={}, installments={}, orderId={}, email={}, tokenLength={}", 
            amountInCents, paymentMethodId, installments, orderId, customerEmail, cardToken.length());
        
        var future = CompletableFuture.supplyAsync(() -> {
            try {
                var requestBuilder = PaymentCreateRequest.builder()
                    .transactionAmount(new BigDecimal(amountInCents).divide(new BigDecimal(100)))
                    .token(cardToken)
                    .description("Acabou o Mony - Pedido " + orderId)
                    .installments(installments)
                    .paymentMethodId(paymentMethodId)
                    .payer(PaymentPayerRequest.builder()
                        .email(customerEmail).build());

                // Temporarily removed: notification URL points to stale ngrok tunnel

                var request = requestBuilder.build();

                log.info("Sending payment request to Mercado Pago...");
                return paymentClient.create(request);
            } catch (MPApiException e) {
                log.error("MPApiException during payment creation: status={}, message={}", 
                    e.getStatusCode(), e.getMessage());
                throw new CompletionException(e);
            } catch (MPException e) {
                log.error("MPException during payment creation: {}", e.getMessage());
                throw new CompletionException(e);
            }
        }, executor);

        try {
            Payment payment = future.get(timeoutMs, TimeUnit.MILLISECONDS);
            log.info("MP payment created in {}ms: id={}, status={}",
                Duration.between(start, Instant.now()).toMillis(),
                payment.getId(), payment.getStatus());

            return switch (payment.getStatus()) {
                case "approved" -> PaymentResult.approved(payment.getId());
                case "rejected" -> PaymentResult.declined(
                    payment.getStatusDetail() != null ? payment.getStatusDetail() : "CARD_DECLINED");
                default -> PaymentResult.declined("UNEXPECTED_STATUS");
            };
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CompletionException(e);
        } catch (TimeoutException e) {
            log.warn("MP gateway timeout after {}ms", Duration.between(start, Instant.now()).toMillis());
            throw new CompletionException(e);
        } catch (ExecutionException e) {
            var cause = e.getCause();
            if (cause instanceof MPApiException mpApi) {
                var status = mpApi.getStatusCode();
                var apiResponse = mpApi.getApiResponse();
                var responseBody = apiResponse != null ? apiResponse.getContent() : "null";
                
                // Enhanced logging for debugging
                log.error("MP API error: status={} body={} message={}", 
                    status, responseBody, mpApi.getMessage());
                
                // Log additional details if available
                if (apiResponse != null) {
                    log.error("MP API response headers: {}", apiResponse.getHeaders());
                }
                
                if (status == 400 || status == 422) {
                    // Parse error details from response body if possible
                    String errorDetail = parseErrorDetail(responseBody);
                    log.warn("Payment declined by MP: {}", errorDetail);
                    return PaymentResult.declined("CARD_DECLINED");
                }
                if (status >= 500) {
                    log.error("MP server error - this may indicate: invalid access token, malformed request, or MP service issue");
                    return PaymentResult.declined("MP_SERVER_ERROR");
                }
                return PaymentResult.declined("MP_API_ERROR");
            }
            log.error("Unexpected MP gateway error: {}", cause != null ? cause.getMessage() : "unknown", cause);
            throw new CompletionException("MP gateway error", e.getCause());
        }
    }
    
    private String parseErrorDetail(String responseBody) {
        try {
            if (responseBody != null && responseBody.contains("message")) {
                return responseBody;
            }
        } catch (Exception e) {
            log.debug("Could not parse error detail: {}", e.getMessage());
        }
        return "CARD_DECLINED";
    }

    public RefundResult refundPayment(Long mpPaymentId, Long amountInCents) {
        try {
            return circuitBreaker.executeSupplier(() -> {
                try {
                    BigDecimal amount = amountInCents != null
                        ? new BigDecimal(amountInCents).divide(new BigDecimal(100))
                        : null;
                    var refund = paymentClient.refund(mpPaymentId, amount);
                    return new RefundResult(true, refund.getId());
                } catch (MPApiException e) {
                    throw new CompletionException(e);
                } catch (MPException e) {
                    throw new CompletionException(e);
                }
            });
        } catch (Exception e) {
            log.error("MP refund error for payment {}: {}", mpPaymentId, e.getMessage());
            return new RefundResult(false, null);
        }
    }

    public record PaymentResult(
        boolean success,
        Long mpPaymentId,
        String errorCode,
        boolean isTimeout
    ) {
        public static PaymentResult approved(Long mpPaymentId) {
            return new PaymentResult(true, mpPaymentId, null, false);
        }
        public static PaymentResult declined(String errorCode) {
            return new PaymentResult(false, null, errorCode, false);
        }
        public static PaymentResult timeout() {
            return new PaymentResult(false, null, "MP_GATEWAY_TIMEOUT", true);
        }
    }

    public record RefundResult(boolean success, Long mpRefundId) {}
}
