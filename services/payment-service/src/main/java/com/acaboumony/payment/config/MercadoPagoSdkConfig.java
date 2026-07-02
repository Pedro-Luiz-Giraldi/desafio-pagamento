package com.acaboumony.payment.config;

import com.mercadopago.MercadoPagoConfig;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MercadoPagoSdkConfig {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoSdkConfig.class);

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @PostConstruct
    public void init() {
        if (accessToken == null || accessToken.isBlank()) {
            log.error("MERCADOPAGO_ACCESS_TOKEN is not set! Payment processing will fail.");
            throw new IllegalStateException("MERCADOPAGO_ACCESS_TOKEN environment variable is required");
        }
        
        // Validate token format
        if (!accessToken.startsWith("TEST-") && !accessToken.startsWith("APP_USR-")) {
            log.warn("Access token does not start with TEST- or APP_USR-. Format: {}", 
                accessToken.substring(0, Math.min(10, accessToken.length())) + "...");
        }
        
        MercadoPagoConfig.setAccessToken(accessToken);
        
        // Log masked token for verification
        String maskedToken = accessToken.length() > 20 
            ? accessToken.substring(0, 10) + "..." + accessToken.substring(accessToken.length() - 4)
            : accessToken.substring(0, Math.min(10, accessToken.length())) + "...";
        
        log.info("MercadoPago SDK configured with access token: {}", maskedToken);
    }
}
