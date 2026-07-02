# OpenTelemetry Implementation Plan
**Feature:** Add OpenTelemetry instrumentation to Spring Boot services using Grafana LGTM stack  
**Scope:** Medium - straightforward instrumentation, no code changes  
**Date:** 2025-01-24

---

## Overview
Add zero-code OpenTelemetry Java agent instrumentation to all 6 Spring Boot services and configure the Grafana LGTM (Loki, Grafana, Tempo, Mimir) all-in-one container for observability.

**Services to instrument:**
1. api-gateway (port 8080)
2. user-service (port 8081)
3. payment-service (port 8082)
4. order-service (port 8083)
5. notification-service (port 8084)
6. fraud-service (port 8085)

---

## Implementation Tasks

### Task 1: Add OpenTelemetry Java Agent to Dockerfiles
**What:** Modify all 6 Spring Boot service Dockerfiles to download and configure the OpenTelemetry Java agent

**Changes per Dockerfile:**
- Download OTel Java agent in runtime stage (latest stable version)
- Add OTEL environment variables for service name, endpoint, and protocol
- Modify ENTRYPOINT to use `-javaagent` flag

**Files to modify:**
- `services/api-gateway/Dockerfile`
- `services/user-service/Dockerfile`
- `services/payment-service/Dockerfile`
- `services/order-service/Dockerfile`
- `services/notification-service/Dockerfile`
- `services/fraud-service/Dockerfile`

**Pattern to apply:**
```dockerfile
# In runtime stage, before USER directive:
ADD --chown=spring:spring https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar

# Modify ENTRYPOINT:
ENTRYPOINT ["java", "-javaagent:/app/opentelemetry-javaagent.jar", "-jar", "app.jar"]
```

**Environment variables (set in docker-compose.yml):**
- `OTEL_SERVICE_NAME`: Service identifier (e.g., "api-gateway")
- `OTEL_EXPORTER_OTLP_ENDPOINT`: http://otel-lgtm:4318
- `OTEL_EXPORTER_OTLP_PROTOCOL`: http/protobuf
- `OTEL_METRICS_EXPORTER`: otlp
- `OTEL_LOGS_EXPORTER`: otlp
- `OTEL_INSTRUMENTATION_COMMON_EXPERIMENTAL_CONTROLLER_TELEMETRY_ENABLED`: true
- `OTEL_INSTRUMENTATION_COMMON_EXPERIMENTAL_VIEW_TELEMETRY_ENABLED`: true
- `OTEL_INSTRUMENTATION_SPRING_WEBMVC_CAPTURE_EXPERIMENTAL_SPAN_ATTRIBUTES`: true
- `OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST`: ""
- `OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_RESPONSE`: ""

---

### Task 2: Add Grafana LGTM to docker-compose.yml
**What:** Add the `grafana/otel-lgtm` service with a new `observability` profile

**Configuration:**
- Service name: `otel-lgtm`
- Image: `grafana/otel-lgtm:latest`
- Profile: `observability` (NEW - separate from existing `monitoring` profile)
- Ports:
  - 3001: Grafana UI (avoiding conflict with existing Grafana on 3000)
  - 4318: OTLP HTTP receiver
  - 4317: OTLP gRPC receiver (optional)
- Volumes: Persist LGTM data (separate from existing grafana_data)
- Network: `aom-network`
- Health check: Grafana API endpoint on port 3001
- Environment variables:
  - `GF_SERVER_HTTP_PORT: 3001` (to avoid port conflict)

**Note:** This runs independently from the existing Prometheus + Grafana setup. Both can coexist.

---

### Task 3: Update docker-compose.yml Service Definitions
**What:** Add OTEL environment variables to all 6 Spring Boot services

**For each service, add:**
```yaml
OTEL_SERVICE_NAME: <service-name>
OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-lgtm:4318
OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
OTEL_METRICS_EXPORTER: otlp
OTEL_LOGS_EXPORTER: otlp
OTEL_RESOURCE_ATTRIBUTES: deployment.environment=${APP_ENV:-production}
# Capture full exception stack traces in spans (backend-only, not exposed to users)
OTEL_INSTRUMENTATION_COMMON_EXPERIMENTAL_CONTROLLER_TELEMETRY_ENABLED: "true"
OTEL_INSTRUMENTATION_COMMON_EXPERIMENTAL_VIEW_TELEMETRY_ENABLED: "true"
OTEL_INSTRUMENTATION_SPRING_WEBMVC_CAPTURE_EXPERIMENTAL_SPAN_ATTRIBUTES: "true"
# Enable exception recording with full stack traces
OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT: "12000"
# Configure logging to capture full error details
LOGGING_LEVEL_ROOT: INFO
LOGGING_PATTERN_CONSOLE: "%d{yyyy-MM-dd HH:mm:ss} - %logger{36} - %msg%n%ex{full}"
```

**Add dependency:**
```yaml
depends_on:
  otel-lgtm:
    condition: service_healthy
```

**Important notes:**
- Stack traces are captured in **spans and logs** sent to Grafana only
- They are **NOT exposed** in HTTP responses to end users
- Spring Boot's default error handling still returns clean error responses
- Full stack traces visible only in Grafana Tempo (traces) and Loki (logs)

---

### Task 4: Update docker-compose.yml Usage Comments
**What:** Update the header comments to reflect the new observability setup

**Add:**
```yaml
#   Observability (LGTM): docker compose --profile observability up -d
#   App + Observability:  docker compose --profile app --profile observability up --build
#   All profiles:         docker compose --profile app --profile monitoring --profile observability up --build
```

**Note:** The new `observability` profile is independent from the existing `monitoring` profile (Prometheus + Grafana on port 3000)

---

## Verification Criteria

### ✅ Build Verification
- [ ] All 6 services build successfully with `docker compose --profile app build`
- [ ] No errors downloading OpenTelemetry Java agent
- [ ] Image sizes remain reasonable (<200MB increase per service)

### ✅ Runtime Verification
- [ ] All services start successfully with `docker compose --profile app --profile observability up`
- [ ] No OTel-related errors in service logs
- [ ] Services log "OpenTelemetry Javaagent" initialization messages
- [ ] All services pass health checks
- [ ] otel-lgtm container starts and passes health check

### ✅ Telemetry Verification
- [ ] Grafana UI accessible at http://localhost:3001 (LGTM Grafana)
- [ ] Existing Grafana still accessible at http://localhost:3000 (if monitoring profile is running)
- [ ] OTLP receiver accepting data (check otel-lgtm logs)
- [ ] Traces visible in Grafana Tempo datasource
- [ ] Metrics visible in Grafana Mimir/Prometheus datasource
- [ ] Logs visible in Grafana Loki datasource
- [ ] Service names appear correctly in Grafana
- [ ] **Full stack traces visible in Grafana** when errors occur (check span attributes and logs)
- [ ] **Stack traces NOT exposed** in HTTP error responses to end users (verify with curl/browser)

### ✅ Integration Verification
- [ ] Distributed traces span across services (e.g., api-gateway → user-service)
- [ ] HTTP requests automatically instrumented
- [ ] Kafka producer/consumer spans captured
- [ ] Database queries instrumented (JDBC)
- [ ] Redis operations instrumented

---

## Rollback Plan
If issues occur:
1. Remove `-javaagent` flag from Dockerfiles
2. Remove OTEL environment variables from docker-compose.yml
3. Rebuild services: `docker compose --profile app build`
4. Restart: `docker compose --profile app up`

---

## Notes
- **Zero code changes required** - OTel Java agent auto-instruments Spring Boot, Kafka, JDBC, Redis, HTTP clients
- **Minimal overhead** - Agent adds ~50-100ms startup time, <5% runtime overhead
- **Coexists with existing monitoring** - New `observability` profile runs independently from existing `monitoring` profile
  - Existing: Prometheus (9090) + Grafana (3000) - for k6 load tests
  - New: LGTM Grafana (3001) - for OpenTelemetry traces, metrics, logs
- **LGTM is all-in-one** - Includes Loki (logs), Grafana (UI), Tempo (traces), Mimir (metrics), and OTLP collector
- **Port allocation:**
  - 3000: Existing Grafana (monitoring profile)
  - 3001: LGTM Grafana (observability profile)
  - 4318: OTLP HTTP receiver
  - 9090: Existing Prometheus (monitoring profile)
- **Stack trace capture strategy:**
  - OTel Java agent automatically captures exceptions and stack traces in span events
  - `OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT: 12000` allows full stack traces (default is 1024 chars)
  - Logging pattern configured to include full exception details (`%ex{full}`)
  - Stack traces sent to Grafana backend only - **never exposed in HTTP responses**
  - Spring Boot's default error handling remains unchanged (clean JSON error responses)
  - View stack traces in:
    - **Grafana Tempo**: Check span events and exception attributes
    - **Grafana Loki**: Search logs with `level="ERROR"` filter

---

## Next Steps
1. Review this plan
2. Confirm approach (especially LGTM vs separate Prometheus/Grafana)
3. Execute Task 1-4 sequentially
4. Validate each verification criterion
5. Document Grafana dashboard setup (optional follow-up)
