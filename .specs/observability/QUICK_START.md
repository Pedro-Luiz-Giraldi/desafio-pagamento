# OpenTelemetry Quick Start Guide

## 🚀 Quick Start

### 1. Start Services with Observability
```bash
# Start infrastructure + app + observability
docker compose --profile app --profile observability up --build

# Or start observability separately
docker compose --profile observability up -d
docker compose --profile app up --build
```

### 2. Access Grafana LGTM
Open your browser to: **http://localhost:3001**

Default credentials:
- Username: `admin`
- Password: `admin`

### 3. Explore Telemetry Data

#### View Traces (Tempo)
1. Click **Explore** (compass icon) in left sidebar
2. Select **Tempo** datasource
3. Click **Search**
4. Filter by:
   - Service: `api-gateway`, `user-service`, etc.
   - Duration: `> 100ms`
   - Status: `error` or `ok`

#### View Logs (Loki)
1. Click **Explore**
2. Select **Loki** datasource
3. Use LogQL queries:
   ```logql
   {service_name="api-gateway"}
   {service_name="payment-service"} |= "error"
   {service_name=~".*-service"} | json | level="ERROR"
   ```

#### View Metrics (Prometheus/Mimir)
1. Click **Explore**
2. Select **Prometheus** datasource
3. Use PromQL queries:
   ```promql
   # Request rate per service
   rate(http_server_requests_seconds_count[5m])
   
   # P99 latency
   histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m]))
   
   # Error rate
   rate(http_server_requests_seconds_count{status=~"5.."}[5m])
   ```

---

## 📊 Common Use Cases

### Trace a Request End-to-End
1. Make a request to the API:
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!@#",
       "fullName": "Test User",
       "cpf": "12345678901"
     }'
   ```

2. In Grafana:
   - Go to **Explore** → **Tempo**
   - Search for service: `api-gateway`
   - Click on a trace to see the full request flow:
     - `api-gateway` → `user-service`
     - HTTP calls, Kafka messages, database queries

### Find Slow Requests
1. Go to **Explore** → **Tempo**
2. Add filter: `Duration > 500ms`
3. Click on slow traces to identify bottlenecks

### Monitor Error Rates
1. Go to **Explore** → **Prometheus**
2. Query:
   ```promql
   sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (service_name)
   ```
3. Switch to **Graph** view to see trends

### Debug Failed Transactions
1. Go to **Explore** → **Loki**
2. Query:
   ```logql
   {service_name="payment-service"} |= "transaction" |= "failed"
   ```
3. Click on a log line to see full context
4. Click **Tempo** button to jump to the trace

---

## 🔍 Service-Specific Queries

### API Gateway
```logql
# All requests
{service_name="api-gateway"}

# Failed authentications
{service_name="api-gateway"} |= "authentication" |= "failed"

# Rate limiting
{service_name="api-gateway"} |= "rate limit"
```

### Payment Service
```logql
# Payment processing
{service_name="payment-service"} |= "payment"

# MercadoPago integration
{service_name="payment-service"} |= "mercadopago"

# Failed payments
{service_name="payment-service"} |= "payment" |= "failed"
```

### Fraud Service
```logql
# Fraud detection
{service_name="fraud-service"} |= "fraud"

# High risk scores
{service_name="fraud-service"} |= "risk_score" | json | risk_score > 70

# AI analysis
{service_name="fraud-service"} |= "anthropic"
```

---

## 📈 Create Custom Dashboards

### 1. Create a New Dashboard
1. Click **Dashboards** (four squares icon)
2. Click **New** → **New Dashboard**
3. Click **Add visualization**

### 2. Add Service Overview Panel
- **Datasource:** Prometheus
- **Query:**
  ```promql
  sum(rate(http_server_requests_seconds_count[5m])) by (service_name)
  ```
- **Panel title:** "Request Rate by Service"
- **Visualization:** Time series

### 3. Add Error Rate Panel
- **Datasource:** Prometheus
- **Query:**
  ```promql
  sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (service_name)
  ```
- **Panel title:** "Error Rate by Service"
- **Visualization:** Time series

### 4. Add Latency Panel
- **Datasource:** Prometheus
- **Query:**
  ```promql
  histogram_quantile(0.99, 
    sum(rate(http_server_requests_seconds_bucket[5m])) by (service_name, le)
  )
  ```
- **Panel title:** "P99 Latency by Service"
- **Visualization:** Time series

### 5. Save Dashboard
- Click **Save dashboard** (disk icon)
- Name: "Service Overview"
- Click **Save**

---

## 🛠️ Troubleshooting

### No traces appearing
```bash
# Check if services are sending telemetry
docker compose logs api-gateway | grep -i "otel"

# Check OTLP receiver
docker compose logs otel-lgtm | grep -i "otlp"

# Verify environment variables
docker compose exec api-gateway env | grep OTEL_
```

### Services not starting
```bash
# Check if OTel agent was downloaded
docker compose logs api-gateway | grep "opentelemetry-javaagent"

# Rebuild without cache
docker compose --profile app build --no-cache

# Check for port conflicts
docker compose ps
netstat -an | grep -E "3001|4318|4317"
```

### High memory usage
```bash
# Check container stats
docker stats

# Reduce sampling rate (add to docker-compose.yml):
OTEL_TRACES_SAMPLER: parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG: 0.1  # 10% sampling
```

---

## 🎯 Best Practices

### 1. Use Trace Context
Always propagate trace context in HTTP headers:
```java
// Spring Boot does this automatically with OTel agent
// Headers: traceparent, tracestate
```

### 2. Add Custom Attributes
For business-critical operations, add custom span attributes:
```java
Span span = Span.current();
span.setAttribute("user.id", userId);
span.setAttribute("transaction.amount", amount);
span.setAttribute("payment.method", "credit_card");
```

### 3. Set Up Alerts
Create alerts for:
- Error rate > 5%
- P99 latency > 1s
- Service down
- High memory usage

### 4. Regular Cleanup
```bash
# Clean up old data (LGTM retains 7 days by default)
docker compose exec otel-lgtm rm -rf /data/tempo/blocks/*
docker compose exec otel-lgtm rm -rf /data/loki/chunks/*
```

---

## 📚 Resources

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Grafana Tempo Docs](https://grafana.com/docs/tempo/latest/)
- [Grafana Loki Docs](https://grafana.com/docs/loki/latest/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [LogQL Cheat Sheet](https://grafana.com/docs/loki/latest/logql/)

---

## 🔄 Switching Between Monitoring Stacks

### Use Both Stacks Simultaneously
```bash
# Start everything
docker compose --profile app --profile monitoring --profile observability up --build

# Access:
# - LGTM Grafana (OTel): http://localhost:3001
# - Monitoring Grafana (k6): http://localhost:3000
# - Prometheus: http://localhost:9090
```

### Use Only LGTM (Recommended)
```bash
docker compose --profile app --profile observability up --build

# Access:
# - LGTM Grafana: http://localhost:3001
```

### Use Only Monitoring (k6 tests)
```bash
docker compose --profile app --profile monitoring up --build

# Access:
# - Grafana: http://localhost:3000
# - Prometheus: http://localhost:9090
```

---

## 🎉 You're Ready!

Start exploring your distributed traces, logs, and metrics in Grafana LGTM!

For detailed implementation information, see: `.specs/observability/otel-implementation-summary.md`
