# Research: Verify and Stabilize Montessori-App After Database Migration

## Decision: Manual User Test Cases Only
- No code implementation or automation for this phase. All validation will be performed via manual user testing.

## Rationale
- User requested manual test cases only for this phase to focus on validating critical flows and schema migration impact without introducing new code or automation.
- Ensures that all user-facing functionality is verified by real users or QA testers, covering edge cases and acceptance criteria.

## Alternatives Considered
- Automated Playwright/E2E tests: Not selected for this phase per user instruction.
- Code-based unit/integration tests: Deferred until after manual validation.

## Manual Testing Best Practices
- Use real user accounts for each role (Admin, Teacher, Parent).
- Validate all dashboard, list, and payment flows as described in acceptance criteria.
- Record any errors, missing data, or broken references for follow-up fixes.
- Document test steps and outcomes for each scenario.

## Outstanding Unknowns
- Some edge cases and technical constraints remain unresolved (see spec for details). Manual testing should note any additional ambiguities or failures encountered.

---
