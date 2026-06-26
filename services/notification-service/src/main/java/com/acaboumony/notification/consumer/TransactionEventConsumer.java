package com.acaboumony.notification.consumer;

import com.acaboumony.notification.dto.event.TransactionCompletedEvent;
import com.acaboumony.notification.dto.event.TransactionFailedEvent;
import com.acaboumony.notification.dto.event.TransactionRefundedEvent;
import com.acaboumony.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class TransactionEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(TransactionEventConsumer.class);

    private final EmailService emailService;

    public TransactionEventConsumer(EmailService emailService) {
        this.emailService = emailService;
    }

    @KafkaListener(topics = "transaction.completed", groupId = "notification-service-group")
    public void consumeTransactionCompleted(TransactionCompletedEvent event) {
        log.info("Received transaction.completed event for transactionId={}", event.transactionId());

        var formattedAmount = String.format("R$ %.2f", event.amountInCents() / 100.0);
        var itemsHtml = event.items() != null ? event.items().stream()
                .map(i -> String.format("%s x%d — R$ %.2f",
                        i.description(), i.quantity(), (i.unitPriceInCents() * i.quantity()) / 100.0))
                .reduce((a, b) -> a + "<br/>" + b)
                .orElse("") : "";

        if (event.customerEmail() != null) {
            var customerVars = new HashMap<String, Object>();
            customerVars.put("formattedAmount", formattedAmount);
            customerVars.put("cardBrand", event.cardBrand() != null ? event.cardBrand() : "");
            customerVars.put("cardLastFour", event.cardLastFour() != null ? event.cardLastFour() : "****");
            customerVars.put("installments", event.installments() != null ? event.installments() : 1);
            customerVars.put("itemsHtml", itemsHtml);
            customerVars.put("orderId", event.orderId().toString());
            emailService.sendEmail(
                    event.customerEmail(),
                    "Pagamento confirmado — Pedido #" + event.orderId(),
                    "payment-confirmed-customer",
                    customerVars,
                    event.transactionId() + "-customer"
            );
        }

        if (event.merchantEmail() != null) {
            var merchantVars = new HashMap<String, Object>();
            merchantVars.put("formattedAmount", formattedAmount);
            merchantVars.put("itemsHtml", itemsHtml);
            merchantVars.put("orderId", event.orderId().toString());
            emailService.sendEmail(
                    event.merchantEmail(),
                    "Nova venda confirmada — " + formattedAmount,
                    "payment-confirmed-merchant",
                    merchantVars,
                    event.transactionId() + "-merchant"
            );
        }
    }

    @KafkaListener(topics = "transaction.failed", groupId = "notification-service-group")
    public void consumeTransactionFailed(TransactionFailedEvent event) {
        log.info("Received transaction.failed event for transactionId={}", event.transactionId());

        if (event.customerEmail() == null) {
            log.warn("transaction.failed event has no customerEmail, skipping notification. transactionId={}", event.transactionId());
            return;
        }

        var formattedAmount = String.format("R$ %.2f", event.amountInCents() / 100.0);
        emailService.sendEmail(
                event.customerEmail(),
                "Pagamento não aprovado — " + formattedAmount,
                "payment-failed",
                Map.of(
                        "formattedAmount", formattedAmount,
                        "reason", event.reason() != null ? event.reason() : "Motivo não informado"
                ),
                event.transactionId()
        );
    }

    @KafkaListener(topics = "transaction.refunded", groupId = "notification-service-group")
    public void consumeTransactionRefunded(TransactionRefundedEvent event) {
        log.info("Received transaction.refunded event for transactionId={}", event.transactionId());

        if (event.customerEmail() == null) {
            log.warn("transaction.refunded event has no customerEmail, skipping notification. refundId={}", event.refundId());
            return;
        }

        var formattedAmount = String.format("R$ %.2f", event.amountRefundedInCents() / 100.0);
        var refundVars = new HashMap<String, Object>();
        refundVars.put("formattedAmount", formattedAmount);
        refundVars.put("estimatedArrivalDays", event.estimatedArrivalDays() != null ? event.estimatedArrivalDays() : 5);
        refundVars.put("refundId", event.refundId() != null ? event.refundId() : "");
        emailService.sendEmail(
                event.customerEmail(),
                "Estorno processado — " + formattedAmount,
                "refund-confirmed",
                refundVars,
                event.refundId()
        );
    }
}
