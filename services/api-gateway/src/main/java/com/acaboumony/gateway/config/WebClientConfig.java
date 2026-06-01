package com.acaboumony.gateway.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@RequiredArgsConstructor
public class WebClientConfig {

    private final UserServiceProperties userServiceProperties;

    @Bean
    public WebClient userServiceWebClient() {
        return WebClient.builder()
                .baseUrl(userServiceProperties.url())
                .defaultHeader("X-Internal-Secret", userServiceProperties.internalSecret())
                .build();
    }
}
