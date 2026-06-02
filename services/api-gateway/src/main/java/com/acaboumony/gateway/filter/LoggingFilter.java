package com.acaboumony.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    @Override
    public int getOrder() {
        return 1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long startTime = System.currentTimeMillis();
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getPath();
        String correlationId = exchange.getRequest().getHeaders().getFirst(CorrelationIdFilter.HEADER);
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");

        return chain.filter(exchange).doFinally(signalType -> {
            long durationMs = System.currentTimeMillis() - startTime;
            int status = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value() : 0;
            log.info("{\"correlationId\":\"{}\",\"method\":\"{}\",\"path\":\"{}\","
                    + "\"statusCode\":{},\"durationMs\":{},\"userId\":\"{}\"}",
                    correlationId, method, path, status, durationMs,
                    userId != null ? userId : "anonymous");
        });
    }
}
