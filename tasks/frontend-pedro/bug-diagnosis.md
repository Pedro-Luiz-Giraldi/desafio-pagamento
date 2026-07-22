# Bug Diagnosis: Chaos Monkey Not Working

## Bug Summary
Chaos Monkey is configured for user-service but does not throw exceptions when requests are made.

## Root Cause
**Version incompatibility between `chaos-monkey-spring-boot` and Spring Boot.**

The `pom.xml` declares dependency `de.codecentric:chaos-monkey-spring-boot:2.0.0`, but the project uses Spring Boot 3.4.5. Version 2.0.0 was built for Spring Boot 2.x and is not compatible with Spring Boot 3.x. The auto-configuration classes in version 2.0.0 target the Spring Boot 2.x auto-configuration registration mechanism (`META-INF/spring.factories`), while Spring Boot 3.x uses `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. As a result, the CM auto-configuration is silently not loaded — no error, no log, just no Chaos Monkey.

## Evidence
- `application.yml` has `chaos.monkey.enabled: true` and assault/watcher config
- Docker compose logs show **zero** chaos-monkey-related log entries (no `ChaosMonkey`, `Watcher`, or `Assault` messages)
- `chaos-monkey-spring-boot:2.0.0` was released in 2020 for Spring Boot 2.x
- Spring Boot 3.x requires chaos-monkey-spring-boot 3.x (e.g., 3.2.1 built for Spring Boot 3.4.5)

## Proposed Fix
Update the dependency version in `services/user-service/pom.xml`:
- From: `chaos-monkey-spring-boot:2.0.0`
- To: `chaos-monkey-spring-boot:3.2.1`

Version 3.2.1 is built for Spring Boot 3.4.5 (exact match).

## Affected Files
- `services/user-service/pom.xml` (line 36-37: dependency version)

## Test Plan
- Rebuild Docker image: `docker compose --profile app up --build user-service`
- Check logs for Chaos Monkey startup messages (should see `ChaosMonkey enabled`, watcher activation)
- Make a request to user-service and verify exception is thrown
