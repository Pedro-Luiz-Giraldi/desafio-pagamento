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
```

**Add dependency:**
```yaml
depends_on:
  otel-lgtm:
    condition: service_healthy
```

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

---

## Next Steps
1. Review this plan
2. Confirm approach (especially LGTM vs separate Prometheus/Grafana)
3. Execute Task 1-4 sequentially
4. Validate each verification criterion
5. Document Grafana dashboard setup (optional follow-up)
