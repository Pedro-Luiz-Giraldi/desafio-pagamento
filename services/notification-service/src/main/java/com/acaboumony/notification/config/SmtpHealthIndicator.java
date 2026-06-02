package com.acaboumony.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.AbstractHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;
import java.net.Socket;

@Component
public class SmtpHealthIndicator extends AbstractHealthIndicator {

    private final String host;
    private final int port;
    private final int timeout;

    public SmtpHealthIndicator(
            @Value("${spring.mail.host:localhost}") String host,
            @Value("${spring.mail.port:3025}") int port,
            @Value("${mail.smtp.connection-timeout:5000}") int timeout) {
        this.host = host;
        this.port = port;
        this.timeout = timeout;
    }

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try (var socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeout);
            builder.up()
                    .withDetail("host", host)
                    .withDetail("port", port)
                    .withDetail("timeout", timeout);
        } catch (Exception e) {
            builder.down(e)
                    .withDetail("host", host)
                    .withDetail("port", port)
                    .withDetail("error", e.getMessage());
        }
    }
}
