# OpenTelemetry Implementation - Validation Checklist
**Date:** 2025-01-24

---

## Pre-Flight Checks

### ✅ Configuration Review
- [x] All 6 Dockerfiles have OpenTelemetry Java agent
- [x] docker-compose.yml has otel-lgtm service (observability profile)
- [x] All 6 services have OTEL environment variables
- [x] Stack trace capture configuration added to all services
- [x] Port 3001 configured for LGTM Grafana (no conflict with port 3000)

---

## Build Validation

### Step 1: Build All Services
```bash
docker compose --profile app build
```

**Expected Results:**
- [ ] All 6 services build successfully
- [ ] No errors downloading opentelemetry-javaagent.jar
- [ ] Build completes in reasonable time (~5-10 minutes)

**Troubleshooting:**
- If download fails: Check internet connection, GitHub may be rate-limiting
- If build fails: Check Docker daemon, disk space

---

## Runtime Validation

### Step 2: Start Infrastructure + Observability
```bash
docker compose --profile observability up -d
```

**Expected Results:**
- [ ] otel-lgtm container starts
- [ ] Health check passes (check with `docker compose ps`)
- [ ] Grafana UI accessible at http://localhost:3001

**Troubleshooting:**
- Check logs: `docker compose logs otel-lgtm`
- Verify port 3001 is not in use: `netstat -an | grep 3001`

### Step 3: Start Application Services
```bash
docker compose --profile app up
```

**Expected Results:**
- [ ] All 6 services start successfully
- [ ] Logs show "OpenTelemetry Javaagent" initialization messages
- [ ] All services pass health checks
- [ ] No OTEL-related errors in logs

**Check for OTel initialization:**
```bash
docker compose logs api-gateway | grep -i "opentelemetry"
docker compose logs user-service | grep -i "opentelemetry"
docker compose logs payment-service | grep -i "opentelemetry"
docker compose logs order-service | grep -i "opentelemetry"
docker compose logs notification-service | grep -i "opentelemetry"
docker compose logs fraud-service | grep -i "opentelemetry"
```

**Troubleshooting:**
- If services fail to start: Check depends_on conditions
- If OTel errors: Verify otel-lgtm is healthy and reachable

---

## Telemetry Validation

### Step 4: Verify Grafana Access
```bash
# Open in browser
http://localhost:3001
```

**Expected Results:**
- [ ] Grafana login page appears
- [ ] Can login (default: admin/admin)
- [ ] Datasources are pre-configured:
  - [ ] Tempo (traces)
  - [ ] Loki (logs)
  - [ ] Mimir/Prometheus (metrics)

### Step 5: Generate Some Traffic
```bash
# Make some API calls to generate telemetry
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/v1/users  # or any valid endpoint
```

**Expected Results:**
- [ ] Requests complete successfully
- [ ] Check otel-lgtm logs for incoming OTLP data:
```bash
docker compose logs otel-lgtm | grep -i "otlp"
```

### Step 6: Verify Traces in Grafana
1. Open http://localhost:3001
2. Go to **Explore** → Select **Tempo** datasource
3. Search for traces from the last 15 minutes

**Expected Results:**
- [ ] Traces appear for api-gateway, user-service, etc.
- [ ] Distributed traces show spans across multiple services
- [ ] HTTP requests are automatically instrumented
- [ ] Database queries visible (JDBC spans)
- [ ] Kafka operations visible (if triggered)

### Step 7: Verify Logs in Grafana
1. Open http://localhost:3001
2. Go to **Explore** → Select **Loki** datasource
3. Query: `{service_name="api-gateway"}`

**Expected Results:**
- [ ] Logs appear from all services
- [ ] Log format includes timestamp, logger, message
- [ ] Can filter by service_name

---

## Stack Trace Validation

### Step 8: Trigger an Error
```bash
# Trigger an error endpoint (you'll need to create one or trigger a real error)
# Example: Invalid request, missing auth, etc.
curl -i http://localhost:8080/api/v1/invalid-endpoint
```

**Expected Results:**
- [ ] HTTP response is clean (JSON error, no stack trace)
- [ ] Status code appropriate (400, 404, 500, etc.)
- [ ] Response body does NOT contain stack trace

**Example clean response:**
```json
{
  "timestamp": "2025-01-24T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Endpoint not found",
  "path": "/api/v1/invalid-endpoint"
}
```

### Step 9: Verify Stack Trace in Grafana Tempo
1. Open http://localhost:3001
2. Go to **Explore** → **Tempo**
3. Find the trace for the error request
4. Click on the span that has the error
5. Look for **Events** or **Exception** attributes

**Expected Results:**
- [ ] Span shows error status
- [ ] Exception event contains full stack trace
- [ ] Stack trace includes:
  - [ ] Exception class name
  - [ ] Error message
  - [ ] Full stack trace with line numbers
  - [ ] Caused by chains (if any)

### Step 10: Verify Stack Trace in Grafana Loki
1. Open http://localhost:3001
2. Go to **Explore** → **Loki**
3. Query: `{service_name="api-gateway"} |= "ERROR"`

**Expected Results:**
- [ ] Error logs appear
- [ ] Logs include full exception details
- [ ] Stack trace visible with `%ex{full}` format
- [ ] Multiple lines showing the complete trace

---

## Integration Validation

### Step 11: Distributed Tracing
Make a request that spans multiple services:
```bash
# Example: Create user → triggers Kafka event → notification service
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Expected Results:**
- [ ] Single trace ID spans multiple services
- [ ] Trace shows: api-gateway → user-service → kafka → notification-service
- [ ] Parent-child span relationships correct
- [ ] Timing information accurate

### Step 12: Database Instrumentation
**Expected Results:**
- [ ] JDBC spans visible in traces
- [ ] SQL queries captured (sanitized)
- [ ] Database connection pool metrics available

### Step 13: Kafka Instrumentation
**Expected Results:**
- [ ] Kafka producer spans visible
- [ ] Kafka consumer spans visible
- [ ] Topic names captured
- [ ] Message propagation traced across services

---

## Performance Validation

### Step 14: Check Startup Time
```bash
# Check service startup logs
docker compose logs api-gateway | grep "Started"
```

**Expected Results:**
- [ ] Services start within expected time (+50-100ms overhead)
- [ ] No significant performance degradation

### Step 15: Check Runtime Overhead
Monitor service metrics during normal operation:

**Expected Results:**
- [ ] CPU usage increase <5%
- [ ] Memory usage reasonable (~10MB per service for agent)
- [ ] Response times not significantly impacted

---

## Security Validation

### Step 16: Verify Stack Traces NOT Exposed
Test various error scenarios:
```bash
# 400 Bad Request
curl -i -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'

# 401 Unauthorized
curl -i http://localhost:8080/api/v1/protected-endpoint

# 500 Internal Server Error (if you can trigger one)
```

**Expected Results:**
- [ ] All HTTP responses are clean JSON
- [ ] NO stack traces in response body
- [ ] NO internal class names exposed
- [ ] NO file paths exposed
- [ ] Error messages are user-friendly

### Step 17: Verify Stack Traces in Backend Only
**Expected Results:**
- [ ] Full stack traces visible in Grafana Tempo
- [ ] Full stack traces visible in Grafana Loki
- [ ] Stack traces include internal details (safe in backend)

---

## Coexistence Validation

### Step 18: Verify Both Monitoring Stacks Work
```bash
# Start everything
docker compose --profile app --profile monitoring --profile observability up -d
```

**Expected Results:**
- [ ] Existing Grafana accessible at http://localhost:3000
- [ ] LGTM Grafana accessible at http://localhost:3001
- [ ] Prometheus accessible at http://localhost:9090
- [ ] No port conflicts
- [ ] Both stacks collect data independently

---

## Final Checks

### Step 19: Clean Shutdown
```bash
docker compose --profile app --profile observability down
```

**Expected Results:**
- [ ] All containers stop gracefully
- [ ] No errors in shutdown logs
- [ ] Data persisted in volumes

### Step 20: Restart and Verify Persistence
```bash
docker compose --profile app --profile observability up -d
```

**Expected Results:**
- [ ] Services restart successfully
- [ ] Historical telemetry data still available in Grafana
- [ ] No data loss

---

## Success Criteria

✅ **Implementation is successful if:**
1. All services build and run with OTel agent
2. Telemetry (traces, logs, metrics) flows to Grafana LGTM
3. Full stack traces visible in Grafana when errors occur
4. Stack traces NOT exposed in HTTP responses to users
5. Distributed tracing works across services
6. Auto-instrumentation captures HTTP, JDBC, Kafka, Redis
7. Performance overhead is acceptable (<5%)
8. Both monitoring stacks coexist without conflicts

---

## Rollback Procedure (If Needed)

If critical issues occur:

1. **Remove OTel agent from Dockerfiles:**
```bash
# Remove these lines from all 6 Dockerfiles:
# ADD --chown=spring:spring https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar
# Change ENTRYPOINT back to: ["java", "-jar", "app.jar"]
```

2. **Remove OTEL env vars from docker-compose.yml:**
```bash
# Remove all OTEL_* and LOGGING_* environment variables
```

3. **Rebuild and restart:**
```bash
docker compose --profile app build
docker compose --profile app up
```

---

## Notes
- This checklist should be completed in order
- Document any issues encountered
- Take screenshots of Grafana dashboards for reference
- Save example traces/logs for documentation
