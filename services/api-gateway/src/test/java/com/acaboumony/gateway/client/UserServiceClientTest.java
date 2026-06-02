package com.acaboumony.gateway.client;

import com.acaboumony.gateway.exception.TokenValidationException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserServiceClientTest {

    WireMockServer wireMock;

    @Mock ReactiveStringRedisTemplate redisTemplate;
    @Mock ReactiveValueOperations<String, String> valueOps;

    UserServiceClient client;
    ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();

        WebClient webClient = WebClient.builder()
                .baseUrl("http://localhost:" + wireMock.port())
                .defaultHeader("X-Internal-Secret", "test-secret")
                .build();

        when(redisTemplate.opsForValue()).thenReturn(valueOps);

        client = new UserServiceClient(webClient, redisTemplate, objectMapper);
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    // ─── Cache miss → chama user-service ─────────────────────────────────────

    @Test
    void deve_chamar_user_service_e_retornar_claims_quando_cache_vazio() {
        UUID userId = UUID.randomUUID();
        String responseBody = """
                {"userId":"%s","email":"ana@loja.com.br","role":"CUSTOMER","merchantId":null}
                """.formatted(userId).strip();

        wireMock.stubFor(post(urlEqualTo("/internal/auth/validate-token"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody(responseBody)));

        when(valueOps.get(anyString())).thenReturn(Mono.empty());
        when(valueOps.set(anyString(), anyString(), any())).thenReturn(Mono.just(true));

        StepVerifier.create(client.validateToken("valid.jwt.token"))
                .assertNext(claims -> {
                    assertThat(claims.userId()).isEqualTo(userId);
                    assertThat(claims.email()).isEqualTo("ana@loja.com.br");
                    assertThat(claims.role()).isEqualTo("CUSTOMER");
                    assertThat(claims.merchantId()).isNull();
                })
                .verifyComplete();
    }

    @Test
    void deve_retornar_merchantId_quando_usuario_e_MERCHANT_OWNER() {
        UUID userId = UUID.randomUUID();
        UUID merchantId = UUID.randomUUID();
        String responseBody = """
                {"userId":"%s","email":"dono@loja.com.br","role":"MERCHANT_OWNER","merchantId":"%s"}
                """.formatted(userId, merchantId).strip();

        wireMock.stubFor(post(urlEqualTo("/internal/auth/validate-token"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody(responseBody)));

        when(valueOps.get(anyString())).thenReturn(Mono.empty());
        when(valueOps.set(anyString(), anyString(), any())).thenReturn(Mono.just(true));

        StepVerifier.create(client.validateToken("merchant.jwt.token"))
                .assertNext(claims -> assertThat(claims.merchantId()).isEqualTo(merchantId))
                .verifyComplete();
    }

    // ─── Cache hit → não chama user-service ──────────────────────────────────

    @Test
    void deve_retornar_claims_do_cache_redis_sem_chamar_user_service() throws Exception {
        UUID userId = UUID.randomUUID();
        ValidatedClaims cached = new ValidatedClaims(userId, "cached@loja.com.br", "CUSTOMER", null);
        String cachedJson = objectMapper.writeValueAsString(cached);

        when(valueOps.get(anyString())).thenReturn(Mono.just(cachedJson));

        StepVerifier.create(client.validateToken("any.token"))
                .assertNext(claims -> {
                    assertThat(claims.userId()).isEqualTo(userId);
                    assertThat(claims.email()).isEqualTo("cached@loja.com.br");
                })
                .verifyComplete();

        wireMock.verify(0, postRequestedFor(urlEqualTo("/internal/auth/validate-token")));
        verify(valueOps, never()).set(anyString(), anyString(), any());
    }

    // ─── Token inválido → exceção ─────────────────────────────────────────────

    @Test
    void deve_lancar_TokenValidationException_quando_user_service_retorna_401() {
        wireMock.stubFor(post(urlEqualTo("/internal/auth/validate-token"))
                .willReturn(aResponse().withStatus(401)));

        when(valueOps.get(anyString())).thenReturn(Mono.empty());

        StepVerifier.create(client.validateToken("expired.jwt"))
                .expectError(TokenValidationException.class)
                .verify();
    }

    @Test
    void deve_lancar_TokenValidationException_quando_user_service_retorna_403() {
        wireMock.stubFor(post(urlEqualTo("/internal/auth/validate-token"))
                .willReturn(aResponse().withStatus(403)));

        when(valueOps.get(anyString())).thenReturn(Mono.empty());

        StepVerifier.create(client.validateToken("forbidden.jwt"))
                .expectError(TokenValidationException.class)
                .verify();
    }

    // ─── Cache com JSON inválido → faz nova chamada ───────────────────────────

    @Test
    void deve_chamar_user_service_quando_cache_contem_json_invalido() {
        UUID userId = UUID.randomUUID();
        String responseBody = """
                {"userId":"%s","email":"fresh@loja.com.br","role":"CUSTOMER","merchantId":null}
                """.formatted(userId).strip();

        wireMock.stubFor(post(urlEqualTo("/internal/auth/validate-token"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody(responseBody)));

        when(valueOps.get(anyString())).thenReturn(Mono.just("{ invalid json !!"));
        when(valueOps.set(anyString(), anyString(), any())).thenReturn(Mono.just(true));

        StepVerifier.create(client.validateToken("any.token"))
                .assertNext(claims -> assertThat(claims.email()).isEqualTo("fresh@loja.com.br"))
                .verifyComplete();
    }

    // ─── sha256 ───────────────────────────────────────────────────────────────

    @Test
    void sha256_deve_produzir_hash_consistente() {
        String hash1 = UserServiceClient.sha256("my-token");
        String hash2 = UserServiceClient.sha256("my-token");
        assertThat(hash1).isEqualTo(hash2).hasSize(64);
    }

    @Test
    void sha256_deve_produzir_hashes_diferentes_para_tokens_diferentes() {
        assertThat(UserServiceClient.sha256("token-a"))
                .isNotEqualTo(UserServiceClient.sha256("token-b"));
    }
}
