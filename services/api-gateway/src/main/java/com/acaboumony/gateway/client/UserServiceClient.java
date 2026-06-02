package com.acaboumony.gateway.client;

import com.acaboumony.gateway.exception.TokenValidationException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserServiceClient {

    private final WebClient userServiceWebClient;
    private final ReactiveStringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final Duration CACHE_TTL = Duration.ofSeconds(30);
    private static final String CACHE_PREFIX = "token_validation:";

    public Mono<ValidatedClaims> validateToken(String token) {
        String cacheKey = CACHE_PREFIX + sha256(token);

        return redisTemplate.opsForValue().get(cacheKey)
                .flatMap(json -> {
                    try {
                        return Mono.just(objectMapper.readValue(json, ValidatedClaims.class));
                    } catch (Exception e) {
                        log.warn("Failed to deserialize cached claims, bypassing cache");
                        return Mono.<ValidatedClaims>empty();
                    }
                })
                .switchIfEmpty(
                        callUserService(token)
                                .flatMap(claims -> cacheAndReturn(cacheKey, claims))
                );
    }

    private Mono<ValidatedClaims> callUserService(String token) {
        return userServiceWebClient.post()
                .uri("/internal/auth/validate-token")
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        Mono.error(new TokenValidationException(
                                "Token validation failed with status: " + response.statusCode().value()))
                )
                .bodyToMono(ValidatedClaims.class);
    }

    private Mono<ValidatedClaims> cacheAndReturn(String cacheKey, ValidatedClaims claims) {
        try {
            String json = objectMapper.writeValueAsString(claims);
            return redisTemplate.opsForValue()
                    .set(cacheKey, json, CACHE_TTL)
                    .thenReturn(claims)
                    .onErrorReturn(claims);
        } catch (Exception e) {
            return Mono.just(claims);
        }
    }

    static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
