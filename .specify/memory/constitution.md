<!--
  Sync Impact Report
  Version change: N/A (template) → 1.0.0
  Modified principles: N/A (initial creation)
  Added sections:
    - I. Test-First & Correctness
    - II. Security-First Architecture
    - III. Performance Budget & Efficiency
    - IV. Code Quality & Maintainability
    - V. Observability & Auditability
    - Security & Compliance Standards
    - Development Workflow & Quality Gates
  Removed sections: N/A
  Templates requiring updates:
    ✅ .specify/templates/tasks-template.md (updated — tests are now mandatory)
    ✅ .specify/templates/constitution-template.md (no change needed — source template)
    ✅ .specify/templates/plan-template.md (no change — generic gate reference)
    ✅ .specify/templates/spec-template.md (no change — testing section already mandatory)
    ✅ .specify/templates/checklist-template.md (no change — generic)
  Follow-up TODOs: None
-->

# Desafio Pagamento Constitution

## Core Principles

### I. Test-First & Correctness (NON-NEGOTIABLE)

Every feature MUST be preceded by automated tests that initially fail (Red),
then implemented to pass (Green), and finally refactored (Refactor). All test
suites MUST pass before any merge. Payment correctness logic requires coverage
of happy paths, edge cases, and failure modes. Bugs in payment calculations are
unacceptable — tests are the primary defense.

### II. Security-First Architecture

Security MUST be considered at every stage from design through deployment.
Sensitive data (PII, payment credentials, secrets) MUST NEVER be logged,
committed to version control, or exposed in transit or at rest without
encryption. Authentication, authorization, and input validation MUST be enforced
at every public entry point. Dependencies MUST be scanned for known
vulnerabilities before adoption.

### III. Performance Budget & Efficiency

Performance requirements MUST be defined upfront for every feature and enforced
through automated benchmarks or load tests. Regressions beyond an established
budget MUST block merge. Response times, throughput, and resource consumption
MUST be measured and tracked. Optimizations MUST be data-driven — never
speculative.

### IV. Code Quality & Maintainability

All code MUST follow established project conventions for naming, structure, and
formatting. Every public API MUST include usage documentation. Static analysis
and linting MUST be configured and enforced in CI. Complexity MUST be justified
— simple solutions are preferred over clever ones. Every pull request requires
at least one review approval before merge.

### V. Observability & Auditability

Every operation that mutates state or processes a payment MUST produce an
immutable audit log entry. Structured logging (machine-parseable) is required.
Metrics for key business and technical indicators MUST be exposed for
monitoring. Failures MUST produce actionable error messages with correlation
IDs.

## Security & Compliance Standards

All data handling MUST follow data-protection best practices appropriate for
payment systems. Secrets (API keys, database credentials, tokens) MUST be
managed through a secrets vault or environment variables — NEVER hardcoded.
Communications MUST use TLS in transit. Access controls MUST follow least-
privilege principle. Third-party integrations MUST be reviewed for security
before adoption. Compliance with applicable regulations (e.g., LGPD, PCI DSS
principles) is mandatory.

## Development Workflow & Quality Gates

Every change MUST follow this lifecycle:
1. Feature is specified with acceptance criteria and test scenarios
2. Tests are written and verified to fail
3. Implementation makes tests pass
4. Code review enforces constitution principles
5. All CI gates pass (lint, test, security scan, performance check)
6. Merge only after review approval and green CI

Any deviation from these gates MUST be documented and explicitly approved.
The constitution check in the plan template MUST verify compliance before
research begins and after design completes.

## Governance

This constitution supersedes all ad-hoc practices. Amendments require:
- A documented proposal describing the change and rationale
- Review by at least one other team member
- Version bump per semantic versioning rules:
  - MAJOR: Backward incompatible governance/principle removals or redefinitions
  - MINOR: New principle/section added or materially expanded guidance
  - PATCH: Clarifications, wording, typo fixes, non-semantic refinements
- Update of the LAST_AMENDED_DATE

All pull requests and reviews MUST verify compliance with this constitution.
Complexity that violates a principle MUST be justified in the plan template.

**Version**: 1.0.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-05-27
