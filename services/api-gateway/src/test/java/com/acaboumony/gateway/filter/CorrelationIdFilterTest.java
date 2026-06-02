package com.acaboumony.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CorrelationIdFilterTest {

    CorrelationIdFilter filter;

    @BeforeEach
    void setUp() {
        filter = new CorrelationIdFilter();
    }

    @Test
    void deve_gerar_correlation_id_quando_header_ausente() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(captor.capture())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        String correlationId = captor.getValue().getRequest().getHeaders()
                .getFirst(CorrelationIdFilter.HEADER);
        assertThat(correlationId).isNotNull().isNotBlank();
    }

    @Test
    void deve_preservar_correlation_id_existente() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me")
                .header(CorrelationIdFilter.HEADER, "my-trace-id-123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(captor.capture())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        String correlationId = captor.getValue().getRequest().getHeaders()
                .getFirst(CorrelationIdFilter.HEADER);
        assertThat(correlationId).isEqualTo("my-trace-id-123");
    }

    @Test
    void deve_gerar_id_em_formato_uuid() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/auth/login").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(captor.capture())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        String correlationId = captor.getValue().getRequest().getHeaders()
                .getFirst(CorrelationIdFilter.HEADER);
        assertThat(correlationId).matches(
                "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
    }

    @Test
    void deve_ignorar_header_em_branco_e_gerar_novo_id() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me")
                .header(CorrelationIdFilter.HEADER, "   ")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(captor.capture())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        String correlationId = captor.getValue().getRequest().getHeaders()
                .getFirst(CorrelationIdFilter.HEADER);
        assertThat(correlationId).isNotBlank().isNotEqualTo("   ");
    }

    @Test
    void deve_ter_order_menor_que_AuthenticationFilter() {
        assertThat(filter.getOrder()).isLessThan(AuthenticationFilter.ORDER);
    }
}
