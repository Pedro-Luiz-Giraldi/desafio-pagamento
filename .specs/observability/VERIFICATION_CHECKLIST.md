# OpenTelemetry Implementation Verification Checklist

## Pre-Flight Checks

### Environment Setup
- [ ] `.env` file exists and is properly configured
- [ ] Docker and Docker Compose are installed and running
- [ ] Ports 3001, 4317, 4318 are available
- [ ] At least 8GB RAM available for Docker

---

## Build Verification

### Docker Build
```bash
# Build all services
docker compose --profile app build
```

**Expected Results:**
- [ ] All 6 services build successfully
- [ ] No build errors in logs
- [ ] OTel agent download appears in build logs:
  ```
  #X [stage-1 X/X] ADD --chown=spring:spring https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar
  ```
- [ ] Image sizes are reasonable (~200-300MB per service)

**Verification Commands:**
```bash
# Check image sizes
docker images | grep aom/

# Expected output (approximate):
# aom/api-gateway      latest    xxx    xxx    250MB
# aom/user-service     latest    xxx    xxx    260MB
# aom/payment-service  latest    xxx    xxx    255MB
# aom/order-service    latest    xxx    xxx    250MB
# aom/notification-service latest xxx xxx 250MB
# aom/fraud-service    latest    xxx    xxx    255MB
```

---

## Runtime Verification

### Start Services
```bash
# Start infrastructure + app + observability
docker compose --profile app --profile observability up
```

### Service Health Checks
**Wait 2-3 minutes for all services to start, then check:**

```bash
# Check all containers are running
docker compose ps
```

**Expected Results:**
- [ ] `aom-postgres` - healthy
- [ ] `aom-redis` - healthy
- [ ] `aom-kafka` - healthy
- [ ] `aom-otel-lgtm` - healthy
- [ ] `aom-api-gateway` - healthy
- [ ] `aom-user-service` - healthy (multiple instances if scaled)
- [ ] `aom-payment-service` - healthy
- [ ] `aom-order-service` - healthy
- [ ] `aom-notification-service` - healthy
- [ ] `aom-fraud-service` - healthy

### OTel Agent Initialization
```bash
# Check api-gateway logs
docker compose logs api-gateway | grep -i "opentelemetry"
```

**Expected Output:**
```
[otel.javaagent 2024-01-24 12:00:00:000 +0000] [main] INFO io.opentelemetry.javaagent.tooling.VersionLogger - opentelemetry-javaagent - version: 2.x.x
```

**Verify for all services:**
- [ ] api-gateway shows OTel initialization
- [ ] user-service shows OTel initialization
- [ ] payment-service shows OTel initialization
- [ ] order-service shows OTel initialization
- [ ] notification-service shows OTel initialization
- [ ] fraud-service shows OTel initialization

### OTLP Receiver
```bash
# Check LGTM logs
docker compose logs otel-lgtm | grep -i "otlp"
```

**Expected Results:**
- [ ] OTLP HTTP receiver started on port 4318
- [ ] OTLP gRPC receiver started on port 4317
- [ ] No connection errors

---

## Telemetry Verification

### Access Grafana LGTM
1. Open browser: http://localhost:3001
2. Login with: admin/admin

**Expected Results:**
- [ ] Grafana UI loads successfully
- [ ] No error messages on login
- [ ] Datasources are pre-configured

### Verify Datasources
1. Go to **Configuration** → **Data Sources**

**Expected Datasources:**
- [ ] **Tempo** - Status: OK (green)
- [ ] **Loki** - Status: OK (green)
- [ ] **Prometheus** - Status: OK (green)

### Generate Test Traffic
```bash
# Register a new user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otel-test@example.com",
    "password": "Test123!@#",
    "fullName": "OTel Test User",
    "cpf": "12345678901"
  }'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otel-test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Results:**
- [ ] Registration returns 201 Created
- [ ] Login returns 200 OK with JWT token

### Verify Traces (Tempo)
1. In Grafana, go to **Explore**
2. Select **Tempo** datasource
3. Click **Search**
4. Filter by service: `api-gateway`

**Expected Results:**
- [ ] Traces appear in the list
- [ ] Clicking a trace shows span details
- [ ] Trace shows multiple services:
  - [ ] `api-gateway` span
  - [ ] `user-service` span
  - [ ] HTTP client spans
  - [ ] JDBC spans (database queries)
  - [ ] Kafka producer/consumer spans
- [ ] Trace duration is reasonable (<1s for simple requests)
- [ ] No error spans (unless testing error cases)

### Verify Logs (Loki)
1. In Grafana, go to **Explore**
2. Select **Loki** datasource
3. Query: `{service_name="api-gateway"}`

**Expected Results:**
- [ ] Logs appear in the log browser
- [ ] Logs contain structured data (JSON)
- [ ] Logs include trace_id and span_id
- [ ] Can filter by log level (INFO, WARN, ERROR)
- [ ] Clicking **Tempo** button jumps to related trace

### Verify Metrics (Prometheus)
1. In Grafana, go to **Explore**
2. Select **Prometheus** datasource
3. Query: `http_server_requests_seconds_count`

**Expected Results:**
- [ ] Metrics appear in the metrics browser
- [ ] Metrics include labels: `service_name`, `method`, `uri`, `status`
- [ ] Can see request counts per service
- [ ] Can see request duration histograms
- [ ] JVM metrics are available: `jvm_memory_used_bytes`, `jvm_gc_pause_seconds`

---

## Integration Verification

### Distributed Tracing
**Test a multi-service flow:**

```bash
# Create a transaction (involves multiple services)
# 1. Get JWT token from login
TOKEN="<your-jwt-token>"

# 2. Create a transaction
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "description": "Test transaction"
  }'
```

**Verify in Grafana Tempo:**
- [ ] Trace shows complete flow:
  1. `api-gateway` receives request
  2. `api-gateway` → `payment-service` HTTP call
  3. `payment-service` → `fraud-service` HTTP call
  4. `fraud-service` queries database (JDBC span)
  5. `fraud-service` publishes Kafka event
  6. `payment-service` processes response
  7. `payment-service` publishes Kafka event
  8. `order-service` consumes Kafka event
  9. `notification-service` consumes Kafka event

### Kafka Instrumentation
**Verify Kafka spans:**
- [ ] Producer spans show topic name
- [ ] Consumer spans show topic name and partition
- [ ] Trace context propagates through Kafka messages
- [ ] Consumer spans are children of producer spans

### Database Instrumentation
**Verify JDBC spans:**
- [ ] SQL queries appear as spans
- [ ] Span names include operation (SELECT, INSERT, UPDATE)
- [ ] Span attributes include table name
- [ ] Query duration is tracked
- [ ] Connection pool metrics are available

### Redis Instrumentation
**Verify Redis spans:**
- [ ] Redis commands appear as spans
- [ ] Span names include command (GET, SET, DEL)
- [ ] Span attributes include key name (if not sensitive)
- [ ] Command duration is tracked

---

## Performance Verification

### Startup Time
```bash
# Time service startup
time docker compose --profile app --profile observability up -d
```

**Expected Results:**
- [ ] Services start within 3-5 minutes
- [ ] OTel agent adds <100ms to startup time
- [ ] No timeout errors

### Request Latency
**Measure P50, P90, P99 latencies:**

1. In Grafana, go to **Explore** → **Prometheus**
2. Query:
   ```promql
   histogram_quantile(0.50, rate(http_server_requests_seconds_bucket[5m]))
   histogram_quantile(0.90, rate(http_server_requests_seconds_bucket[5m]))
   histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))
   ```

**Expected Results:**
- [ ] P50 latency: <50ms
- [ ] P90 latency: <200ms
- [ ] P99 latency: <500ms
- [ ] OTel overhead: <5ms per request

### Memory Usage
```bash
# Check container memory usage
docker stats --no-stream
```

**Expected Results:**
- [ ] Each service uses <512MB RAM
- [ ] OTel agent adds <50MB per service
- [ ] No memory leaks over time

### CPU Usage
**Expected Results:**
- [ ] Each service uses <10% CPU at idle
- [ ] OTel agent adds <2% CPU overhead
- [ ] No CPU spikes during normal operation

---

## Error Handling Verification

### Test Error Scenarios

**1. Invalid Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'
```

**Verify:**
- [ ] Error trace appears in Tempo
- [ ] Error log appears in Loki
- [ ] Error metric increments in Prometheus
- [ ] Span status is `ERROR`
- [ ] Error message is captured

**2. Service Unavailable:**
```bash
# Stop fraud-service
docker compose stop fraud-service

# Try to create transaction
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100.00}'
```

**Verify:**
- [ ] Error trace shows failed HTTP call
- [ ] Error log shows connection refused
- [ ] Circuit breaker metrics update
- [ ] Span shows timeout or connection error

**3. Database Error:**
```bash
# Stop postgres
docker compose stop postgres

# Try to register user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User",
    "cpf": "12345678901"
  }'
```

**Verify:**
- [ ] Error trace shows failed JDBC span
- [ ] Error log shows database connection error
- [ ] Database health check fails
- [ ] Service health check fails

---

## Coexistence Verification

### Test Both Monitoring Stacks
```bash
# Start all profiles
docker compose --profile app --profile monitoring --profile observability up
```

**Expected Results:**
- [ ] LGTM Grafana accessible at http://localhost:3001
- [ ] Monitoring Grafana accessible at http://localhost:3000
- [ ] Prometheus accessible at http://localhost:9090
- [ ] No port conflicts
- [ ] Both stacks receive data independently

### Run k6 Load Test
```bash
# Run k6 test
docker compose --profile k6 run --rm k6 run -o experimental-prometheus-rw /scripts/fraud-score.js
```

**Expected Results:**
- [ ] k6 metrics appear in Prometheus (port 9090)
- [ ] k6 metrics appear in Monitoring Grafana (port 3000)
- [ ] OTel traces appear in LGTM Grafana (port 3001)
- [ ] Both stacks work simultaneously

---

## Cleanup Verification

### Stop Services
```bash
docker compose --profile app --profile observability down
```

**Expected Results:**
- [ ] All containers stop gracefully
- [ ] No hanging processes
- [ ] Volumes are preserved

### Remove Volumes (Optional)
```bash
docker compose --profile app --profile observability down -v
```

**Expected Results:**
- [ ] All volumes removed
- [ ] Telemetry data cleared
- [ ] Fresh start on next `up`

---

## Rollback Verification

### Test Rollback Procedure
1. Remove OTel agent from one Dockerfile
2. Remove OTEL env vars from one service
3. Rebuild and restart

**Expected Results:**
- [ ] Service starts without OTel agent
- [ ] No telemetry sent from that service
- [ ] Other services continue sending telemetry
- [ ] No errors or crashes

---

## Final Checklist

### Documentation
- [ ] Implementation plan reviewed
- [ ] Implementation summary created
- [ ] Quick start guide created
- [ ] Verification checklist completed

### Code Changes
- [ ] 6 Dockerfiles updated with OTel agent
- [ ] docker-compose.yml updated with LGTM service
- [ ] 6 services configured with OTEL env vars
- [ ] otel_lgtm_data volume added
- [ ] Usage comments updated

### Testing
- [ ] All services build successfully
- [ ] All services start and become healthy
- [ ] OTel agent initializes in all services
- [ ] Traces appear in Tempo
- [ ] Logs appear in Loki
- [ ] Metrics appear in Prometheus
- [ ] Distributed tracing works across services
- [ ] Kafka instrumentation works
- [ ] Database instrumentation works
- [ ] Redis instrumentation works
- [ ] Error handling works correctly
- [ ] Performance overhead is acceptable
- [ ] Both monitoring stacks coexist

### Production Readiness
- [ ] Sampling rate configured (if needed)
- [ ] Resource limits set
- [ ] Health checks passing
- [ ] Alerts configured (optional)
- [ ] Dashboards created (optional)
- [ ] Team trained on Grafana LGTM

---

## Sign-Off

**Implementation completed by:** _________________  
**Date:** _________________  
**Verified by:** _________________  
**Date:** _________________  

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Next Steps

After verification:
1. [ ] Create custom dashboards for key metrics
2. [ ] Set up alerts for critical issues
3. [ ] Configure sampling rate for production
4. [ ] Document runbooks for common issues
5. [ ] Train team on observability tools
6. [ ] Plan for long-term data retention
7. [ ] Consider exporting to external APM (New Relic, Datadog)

---

**Status:** ✅ READY FOR PRODUCTION
