package com.acaboumony.gateway.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

class FallbackControllerTest {

    FallbackController controller;

    @BeforeEach
    void setUp() {
        controller = new FallbackController();
    }

    @Test
    void deve_retornar_503_com_errorCode_SERVICE_UNAVAILABLE() {
        StepVerifier.create(controller.fallback())
                .assertNext(response -> {
                    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
                    assertThat(response.getBody()).containsEntry("errorCode", "SERVICE_UNAVAILABLE");
                })
                .verifyComplete();
    }

    @Test
    void deve_incluir_retryable_true_no_body() {
        StepVerifier.create(controller.fallback())
                .assertNext(response ->
                        assertThat(response.getBody()).containsEntry("retryable", true))
                .verifyComplete();
    }
}
