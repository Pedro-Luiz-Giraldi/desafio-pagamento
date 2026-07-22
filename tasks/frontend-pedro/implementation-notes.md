# Implementation Notes

## Change
Updated `chaos-monkey-spring-boot` dependency version from `2.0.0` to `3.2.1` in `services/user-service/pom.xml`.

## Why
Version 2.0.0 was built for Spring Boot 2.x. The auto-configuration registration mechanism changed between Spring Boot 2 and 3 (`spring.factories` vs `AutoConfiguration.imports`). With version 2.0.0 on Spring Boot 3.4.5, CM auto-configuration is silently not loaded — no errors, no logs, no chaos.

Version 3.2.1 is built for Spring Boot 3.4.5 (exact version match).

## Risk
- Low. Only a dependency version bump; no code changes.
- Build compiles cleanly.
- Pre-existing test failures (6 in AuthServiceTest) are unrelated to this change.

## TDD
Skipped — this is a dependency version fix, not a code logic change. No new test needed.
