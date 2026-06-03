package com.acaboumony.notification.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmailRateLimiterTest {

    private final MeterRegistry meterRegistry = new SimpleMeterRegistry();
    private EmailRateLimiter limiter;

    @BeforeEach
    void setUp() {
        // limiter is created per-test with different limits
    }

    @Test
    void shouldAllowFirstEmail() {
        limiter = new EmailRateLimiter(10, meterRegistry);
        assertThat(limiter.isRateLimited("test@test.com")).isFalse();
    }

    @Test
    void shouldBlockAfterMaxEmails() {
        limiter = new EmailRateLimiter(2, meterRegistry);

        assertThat(limiter.isRateLimited("test@test.com")).isFalse();
        assertThat(limiter.isRateLimited("test@test.com")).isFalse();
        assertThat(limiter.isRateLimited("test@test.com")).isTrue();
    }

    @Test
    void shouldTrackSeparateBuckets() {
        limiter = new EmailRateLimiter(2, meterRegistry);

        assertThat(limiter.isRateLimited("alice@test.com")).isFalse();
        assertThat(limiter.isRateLimited("bob@test.com")).isFalse();
        assertThat(limiter.isRateLimited("alice@test.com")).isFalse();
        assertThat(limiter.isRateLimited("bob@test.com")).isFalse();

        assertThat(limiter.isRateLimited("alice@test.com")).isTrue();
        assertThat(limiter.isRateLimited("bob@test.com")).isTrue();
    }

    @Test
    void shouldNotRateLimitNullRecipient() {
        limiter = new EmailRateLimiter(1, meterRegistry);
        assertThat(limiter.isRateLimited(null)).isFalse();
    }

    @Test
    void shouldNotRateLimitBlankRecipient() {
        limiter = new EmailRateLimiter(1, meterRegistry);
        assertThat(limiter.isRateLimited("")).isFalse();
        assertThat(limiter.isRateLimited("   ")).isFalse();
    }

    @Test
    void shouldAllowDifferentRecipientsIndependently() {
        limiter = new EmailRateLimiter(1, meterRegistry);

        assertThat(limiter.isRateLimited("a@test.com")).isFalse();
        assertThat(limiter.isRateLimited("b@test.com")).isFalse();

        assertThat(limiter.isRateLimited("a@test.com")).isTrue();
        assertThat(limiter.isRateLimited("b@test.com")).isTrue();
    }

    @Test
    void deve_incrementar_counter_quando_rate_limited() {
        limiter = new EmailRateLimiter(1, meterRegistry);

        limiter.isRateLimited("alice@test.com");
        limiter.isRateLimited("alice@test.com");

        var counter = meterRegistry.counter("notification.email.rate.limited", "recipient", "alice@test.com");
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    void deve_expor_gauge_de_buckets_ativos() {
        limiter = new EmailRateLimiter(5, meterRegistry);
        limiter.startCleanup();

        limiter.isRateLimited("alice@test.com");
        limiter.isRateLimited("bob@test.com");
        limiter.isRateLimited("charlie@test.com");

        var gauge = meterRegistry.find("notification.email.active.buckets").gauge();
        assertThat(gauge).isNotNull();
        assertThat(gauge.value()).isEqualTo(3.0);
    }

    @Test
    void deve_incrementar_counter_por_destinatario_quando_rate_limited() {
        limiter = new EmailRateLimiter(1, meterRegistry);

        limiter.isRateLimited("a@test.com");
        limiter.isRateLimited("a@test.com");
        limiter.isRateLimited("b@test.com");
        limiter.isRateLimited("b@test.com");

        var counterA = meterRegistry.counter("notification.email.rate.limited", "recipient", "a@test.com");
        var counterB = meterRegistry.counter("notification.email.rate.limited", "recipient", "b@test.com");
        assertThat(counterA.count()).isEqualTo(1.0);
        assertThat(counterB.count()).isEqualTo(1.0);
    }
}
