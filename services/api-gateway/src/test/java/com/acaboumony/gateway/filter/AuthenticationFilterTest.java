package com.acaboumony.gateway.filter;

import com.acaboumony.gateway.client.UserServiceClient;
import com.acaboumony.gateway.client.ValidatedClaims;
import com.acaboumony.gateway.exception.TokenValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationFilterTest {

    @Mock UserServiceClient userServiceClient;

    AuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthenticationFilter(userServiceClient);
    }

    // ─── /internal/** bloqueado ───────────────────────────────────────────────

    @Test
    void deve_retornar_404_quando_path_internal() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/internal/auth/validate-token").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(chain, never()).filter(any());
    }

    // ─── Rotas públicas ───────────────────────────────────────────────────────

    @Test
    void deve_passar_sem_token_em_rota_publica_auth() {
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/v1/auth/login").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(captor.capture())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        verify(userServiceClient, never()).validateToken(any());
    }

    @Test
    void deve_passar_sem_token_em_rota_publica_register() {
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/api/v1/auth/register").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(any())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        verify(userServiceClient, never()).validateToken(any());
    }

    // ─── Authorization ausente ou inválido ────────────────────────────────────

    @Test
    void deve_retornar_401_MISSING_TOKEN_quando_header_authorization_ausente() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void deve_retornar_401_MISSING_TOKEN_quando_header_nao_e_Bearer() {
        MockServerHttpRequest request = MockServerHttpRequest
                .get("/api/v1/users/me")
                .header("Authorization", "Basic dXNlcjpwYXNz")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(userServiceClient, never()).validateToken(any());
    }

    // ─── Token válido → injeção de headers ───────────────────────────────────

    @Test
    void deve_injetar_headers_X_User_quando_token_valido_CUSTOMER() {
        UUID userId = UUID.randomUUID();
        ValidatedClaims claims = new ValidatedClaims(userId, "ana@loja.com.br", "CUSTOMER", null);
        when(userServiceClient.validateToken("valid.jwt")).thenReturn(Mono.just(claims));

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me")
                .header("Authorization", "Bearer valid.jwt")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(captor.capture())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        var headers = captor.getValue().getRequest().getHeaders();
        assertThat(headers.getFirst("X-User-Id")).isEqualTo(userId.toString());
        assertThat(headers.getFirst("X-User-Email")).isEqualTo("ana@loja.com.br");
        assertThat(headers.getFirst("X-User-Role")).isEqualTo("CUSTOMER");
        assertThat(headers.getFirst("X-Merchant-Id")).isNull();
    }

    @Test
    void deve_injetar_X_Merchant_Id_quando_usuario_e_MERCHANT_OWNER() {
        UUID userId = UUID.randomUUID();
        UUID merchantId = UUID.randomUUID();
        ValidatedClaims claims = new ValidatedClaims(userId, "dono@loja.com.br",
                "MERCHANT_OWNER", merchantId);
        when(userServiceClient.validateToken("merchant.jwt")).thenReturn(Mono.just(claims));

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me")
                .header("Authorization", "Bearer merchant.jwt")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);
        when(chain.filter(captor.capture())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(captor.getValue().getRequest().getHeaders().getFirst("X-Merchant-Id"))
                .isEqualTo(merchantId.toString());
    }

    // ─── Token inválido ───────────────────────────────────────────────────────

    @Test
    void deve_retornar_401_INVALID_TOKEN_quando_UserServiceClient_lanca_excecao() {
        when(userServiceClient.validateToken("bad.token"))
                .thenReturn(Mono.error(new TokenValidationException("Token expired")));

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/users/me")
                .header("Authorization", "Bearer bad.token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void deve_retornar_401_quando_qualquer_excecao_na_validacao() {
        when(userServiceClient.validateToken("error.token"))
                .thenReturn(Mono.error(new RuntimeException("Connection refused")));

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/orders/123")
                .header("Authorization", "Bearer error.token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
