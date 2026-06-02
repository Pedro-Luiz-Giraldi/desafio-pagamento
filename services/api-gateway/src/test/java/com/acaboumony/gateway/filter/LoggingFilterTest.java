package com.acaboumony.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LoggingFilterTest {

    LoggingFilter filter;

    @BeforeEach
    void setUp() {
        filter = new LoggingFilter();
    }

    @Test
    void deve_chamar_chain_e_completar() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me")
                .header(CorrelationIdFilter.HEADER, "trace-abc")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        verify(chain).filter(exchange);
    }

    @Test
    void deve_completar_mesmo_quando_chain_emite_erro() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/transactions/pay")
                .header("X-User-Id", "user-uuid")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.error(new RuntimeException("downstream error")));

        StepVerifier.create(filter.filter(exchange, chain)).verifyError(RuntimeException.class);
    }

    @Test
    void deve_ter_order_maior_que_AuthenticationFilter() {
        assertThat(filter.getOrder()).isGreaterThan(AuthenticationFilter.ORDER);
    }

    private static org.assertj.core.api.AbstractIntegerAssert<?> assertThat(int actual) {
        return org.assertj.core.api.Assertions.assertThat(actual);
    }
}
