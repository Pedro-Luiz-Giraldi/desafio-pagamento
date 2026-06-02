package com.acaboumony.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {

    public static final String HEADER = "X-Correlation-Id";
    static final int ORDER = -10;

    @Override
    public int getOrder() {
        return ORDER;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = exchange.getRequest().getHeaders().getFirst(HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        String finalId = correlationId;

        ServerWebExchange mutated = exchange.mutate()
                .request(r -> r.header(HEADER, finalId))
                .build();

        mutated.getResponse().beforeCommit(() -> {
            mutated.getResponse().getHeaders().set(HEADER, finalId);
            return Mono.empty();
        });

        return chain.filter(mutated);
    }
}
