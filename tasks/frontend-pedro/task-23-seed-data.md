# T23: Clear Dev Database / Seed Data

**Phase:** 5 — Integration & Polish
**Service:** all
**Dependencies:** None

## TDD Mode: NOT REQUIRED (data seeding)

## Objective

Clear existing development data and insert fresh seed data for both roles.

## Target Files

- `scripts/*.sql` (existing location for SQL scripts)

## Details

**Seed data needed:**
1. At least 2 MERCHANT_OWNER users with merchants
2. Products for each merchant (3-5 each)
3. At least 1 CUSTOMER user
4. At least 1 order with PENDING status (for testing payment)
5. At least 1 order with PAID status (for testing history)

## Acceptance Criteria

- Fresh database has test data for all roles
- Both merchant and client users can log in and see data
- Products are visible in merchant/merchant listing

## Traceability

All requirements
