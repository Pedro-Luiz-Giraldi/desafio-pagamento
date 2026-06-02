package com.acaboumony.gateway.filter;

import com.acaboumony.gateway.client.UserServiceClient;
import com.acaboumony.gateway.client.ValidatedClaims;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter, Ordered {

    static final int ORDER = -5;
    private static final Set<String> PUBLIC_PREFIXES = Set.of("/api/v1/auth/");
    private static final String INTERNAL_PREFIX = "/internal/";

    private final UserServiceClient userServiceClient;

    @Override
    public int getOrder() {
        return ORDER;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (path.startsWith(INTERNAL_PREFIX)) {
            exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
            return exchange.getResponse().setComplete();
        }

        if (isPublic(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "MISSING_TOKEN",
                    "Authorization header ausente ou inválido");
        }

        String token = authHeader.substring(7);
        return userServiceClient.validateToken(token)
                .flatMap(claims -> chain.filter(injectUserHeaders(exchange, claims)))
                .onErrorResume(e -> writeError(exchange, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN",
                        "Token inválido ou expirado"));
    }

    private boolean isPublic(String path) {
        return PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private ServerWebExchange injectUserHeaders(ServerWebExchange exchange, ValidatedClaims claims) {
        return exchange.mutate()
                .request(r -> {
                    r.header("X-User-Id", claims.userId().toString());
                    r.header("X-User-Email", claims.email());
                    r.header("X-User-Role", claims.role());
                    if (claims.merchantId() != null) {
                        r.header("X-Merchant-Id", claims.merchantId().toString());
                    }
                })
                .build();
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status,
                                   String code, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"errorCode\":\"%s\",\"message\":\"%s\"}".formatted(code, message);
        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
