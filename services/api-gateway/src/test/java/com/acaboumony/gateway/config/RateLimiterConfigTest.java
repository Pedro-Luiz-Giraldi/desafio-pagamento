package com.acaboumony.gateway.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterConfigTest {

    RateLimiterConfig config;

    @BeforeEach
    void setUp() {
        config = new RateLimiterConfig();
    }

    @Test
    void ipKeyResolver_deve_retornar_ip_do_client() {
        KeyResolver resolver = config.ipKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/auth/login")
                .remoteAddress(new InetSocketAddress("10.0.0.5", 12345))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(resolver.resolve(exchange))
                .assertNext(key -> assertThat(key).isEqualTo("10.0.0.5"))
                .verifyComplete();
    }

    @Test
    void ipKeyResolver_deve_retornar_unknown_quando_sem_remoteAddress() {
        KeyResolver resolver = config.ipKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/auth/login").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(resolver.resolve(exchange))
                .assertNext(key -> assertThat(key).isEqualTo("unknown"))
                .verifyComplete();
    }

    @Test
    void userKeyResolver_deve_retornar_userId_do_header() {
        KeyResolver resolver = config.userKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me")
                .header("X-User-Id", "user-uuid-123")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(resolver.resolve(exchange))
                .assertNext(key -> assertThat(key).isEqualTo("user-uuid-123"))
                .verifyComplete();
    }

    @Test
    void userKeyResolver_deve_retornar_anonymous_quando_header_ausente() {
        KeyResolver resolver = config.userKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(resolver.resolve(exchange))
                .assertNext(key -> assertThat(key).isEqualTo("anonymous"))
                .verifyComplete();
    }
}
