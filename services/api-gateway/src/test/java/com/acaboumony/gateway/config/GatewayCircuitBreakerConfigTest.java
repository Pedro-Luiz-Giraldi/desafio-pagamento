package com.acaboumony.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.cloud.circuitbreaker.resilience4j.ReactiveResilience4JCircuitBreakerFactory;
import org.springframework.cloud.client.circuitbreaker.Customizer;

import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;

class GatewayCircuitBreakerConfigTest {

    @Test
    void deve_criar_customizer_nao_nulo() {
        GatewayCircuitBreakerConfig config = new GatewayCircuitBreakerConfig();
        Customizer<ReactiveResilience4JCircuitBreakerFactory> customizer = config.defaultCustomizer();
        assertThat(customizer).isNotNull();
    }

    @SuppressWarnings("unchecked")
    @Test
    void customizer_deve_invocar_configureDefault_e_construir_config_resilience4j() {
        GatewayCircuitBreakerConfig config = new GatewayCircuitBreakerConfig();
        Customizer<ReactiveResilience4JCircuitBreakerFactory> customizer = config.defaultCustomizer();

        ReactiveResilience4JCircuitBreakerFactory factory = mock(ReactiveResilience4JCircuitBreakerFactory.class);
        AtomicReference<Object> builtConfig = new AtomicReference<>();

        doAnswer(invocation -> {
            Function<String, ?> configFn = invocation.getArgument(0);
            builtConfig.set(configFn.apply("payment-service"));
            return null;
        }).when(factory).configureDefault(any());

        customizer.customize(factory);

        assertThat(builtConfig.get()).isNotNull();
    }
}
