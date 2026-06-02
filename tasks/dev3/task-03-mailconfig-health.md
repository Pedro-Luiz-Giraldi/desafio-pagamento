# Task 03: MailConfig.java + Health checks (notification-service)

## Objective
Create explicit MailConfig.java with JavaMailSender connection pool configuration and custom SmtpHealthIndicator.

## Priority: HIGH

## Target Files
- services/notification-service/src/main/java/com/acaboumony/notification/config/MailConfig.java (new)
- services/notification-service/src/main/java/com/acaboumony/notification/config/SmtpHealthIndicator.java (new)

## Dependencies
None (can run in parallel with Tasks 01, 02)

## TDD Mode: REQUIRED

## Behavior
1. **MailConfig.java**: Create `@Configuration` class with:
   - `@Bean` for `JavaMailSender` using `JavaMailSenderImpl`
   - Configuration properties bound from `spring.mail.*` (host, port, username, password, protocol)
   - Connection pool: set `mail.smtp.connectiontimeout`, `mail.smtp.timeout`, `mail.smtp.writetimeout` from config
   - Use `@ConfigurationProperties(prefix = "spring.mail")` or manual binding
   - Properties class `MailProperties` (if not already using Spring Boot's auto-configured one but making it explicit)
   - TLS/STARTTLS properties from env

2. **SmtpHealthIndicator**: Create `@Component` extending `AbstractHealthIndicator`:
   - Attempts a socket connection to SMTP host:port
   - Returns UP if connect succeeds, DOWN with exception details if fails
   - Timeout configurable (default 3s)
   
3. Add health check configuration to `application.yml` to show details always.

## Tests to write
Unit tests for SmtpHealthIndicator using mock server socket:
- `deve_retornar_up_quando_smtp_connect_ok()`
- `deve_retornar_down_quando_smtp_indisponivel()`
