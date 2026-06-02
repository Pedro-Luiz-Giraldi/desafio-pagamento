package com.acaboumony.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "services.user-service")
public record UserServiceProperties(
        String url,
        String internalSecret
) {}
