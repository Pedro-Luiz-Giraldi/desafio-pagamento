# Task 05: OpenAPI documentation (order-service)

## Objective
Add explicit OpenAPI/Swagger documentation configuration for the order-service REST API.

## Priority: LOW

## Target Files
- services/order-service/src/main/java/com/acaboumony/order/config/OpenApiConfig.java (new)

## Dependencies
None (can run in parallel with all other tasks)

## TDD Mode: REQUIRED

## Behavior
1. Create `OpenApiConfig.java` with `@OpenAPIDefinition`:
   - title: "Order Service API"
   - description: "API for managing orders in the Acabou o Mony payment platform"
   - version: "1.0.0"
   - Contact info
2. Add `@Tag` annotations on OrderController endpoints for grouping
3. Verify /swagger-ui.html and /v3/api-docs endpoints respond correctly

## Tests to write
Implicit — test is a @SpringBootTest that verifies the OpenAPI endpoint responds:
- `deve_expor_swagger_ui_quanto_acessado()`
