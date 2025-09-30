# Tasks: Extend Child Creation with Monthly Fee Assignment

**Input**: Design documents from `/specs/009-extend-child-creation/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Foundation
- [X] T001 Run database migration to add `monthly_fee_override` column to enrollments table (drizzle/0005_add_monthly_fee_override.sql)
- [X] T002 [P] Create currency constants and formatting utilities in lib/constants/currency.ts
- [X] T003 [P] Create fee validation schemas in lib/validations/fee-validation.ts
- [X] T004 [P] Extend child validation schema with monthlyFee in lib/validations/child-validation.ts
- [X] T005 [P] Extend enrollment validation schema with monthlyFeeOverride in lib/validations/enrollment-validation.ts

## Phase 3.2: Service Layer
- [X] T006 Create fee resolution service in lib/services/fee-service.ts
- [X] T007 Extend child service with fee handling in lib/services/child-service.ts
- [X] T008 Extend enrollment service with fee override logic in lib/services/enrollment-service.ts

## Phase 3.3: API Layer
- [X] T009 Extend POST /api/admin/children route with fee handling in app/api/admin/children/route.ts
- [X] T010 Extend PATCH /api/admin/children/[id] route with fee updates in app/api/admin/children/[id]/route.ts
- [X] T011 [P] Create GET /api/admin/children/[id]/fee-details endpoint in app/api/admin/children/[id]/fee-details/route.ts
- [X] T012 Extend POST /api/admin/enrollments route with fee override in app/api/admin/enrollments/route.ts
- [X] T013 Extend PATCH /api/admin/enrollments/[id] route with fee override updates in app/api/admin/enrollments/[id]/route.ts
- [X] T014 [P] Create GET /api/admin/enrollments/[id]/effective-fee endpoint in app/api/admin/enrollments/[id]/effective-fee/route.ts

## Phase 3.4: UI Components
- [X] T015 [P] Create fee input component in components/ui/fee-input.tsx
- [X] T016 [P] Create fee display component in components/ui/fee-display.tsx
- [X] T017 Update child creation form in app/admin/enrollments/new/page.tsx to include fee input (added monthlyFeeOverride to EnrollmentForm)
- [X] T018 Update child creation form in app/admin/applications/create-child/page.tsx to include fee input (added monthly_fee field)
- [N/A] T019 Update child edit forms in app/admin/children/[id]/edit/page.tsx to support fee modification (page does not exist)
- [X] T020 Update enrollment forms in app/admin/enrollments/[id]/edit/page.tsx to support fee override input (uses EnrollmentForm which already has the field)
- [X] T021 Update child detail views in app/admin/children/[id]/page.tsx to display fee information
- [X] T022 Update enrollment detail views in app/admin/enrollments/[id]/page.tsx to display effective fee

## Phase 3.5: Testing & Validation
- [X] T023 [P] Create contract tests for POST /api/admin/children with fee scenarios
- [X] T024 [P] Create contract tests for PATCH /api/admin/children/[id] with fee updates
- [X] T025 [P] Create contract tests for enrollment endpoints with fee override
- [X] T026 [P] Create integration test for Scenario 1: Create child with fee (from quickstart.md)
- [X] T027 [P] Create integration test for Scenario 2: Create child without fee (from quickstart.md)
- [X] T028 [P] Create integration test for Scenario 3: Enrollment fee override (from quickstart.md)
- [X] T029 [P] Create integration test for Scenario 4: Update child fee (from quickstart.md)
- [X] T030 [P] Create integration test for Scenario 5: Fee validation testing (from quickstart.md)
- [X] T031 [P] Create integration test for Scenario 6: Multi-tenant isolation (from quickstart.md)
- [X] T032 Test performance targets (<200ms response time)
- [X] T033 Execute quickstart.md scenarios manually for final validation
- [X] T037 Fix database migration issue and test both child creation and enrollment functionality
- [X] T038 Fix enrollment edit route import error (@/lib/auth -> @/lib/auth/config)
- [X] T034 [P] Create constitutional compliance test for multi-tenant fee data isolation (__tests__/integration/fee-multi-tenant-isolation.test.ts)
- [X] T035 [P] Create constitutional compliance test for admin-only fee access control (__tests__/integration/fee-rbac-enforcement.test.ts)
- [X] T036 [P] Create constitutional compliance test for fee modification audit logging (__tests__/integration/fee-audit-logging.test.ts)

## Dependencies
- T001 must complete before all other tasks (database schema requirement)
- T002-T005 (validation/constants) must complete before T006-T008 (services)
- T006-T008 (services) must complete before T009-T014 (API routes)
- T009-T014 (API routes) must complete before T015-T022 (UI components)
- T023-T036 (tests) can run in parallel after their dependencies are implemented

## Parallel Execution Examples

### Phase 3.1 (after T001):
```
Launch T002-T005 together:
- Create currency constants in lib/constants/currency.ts
- Create fee validation in lib/validations/fee-validation.ts
- Extend child validation in lib/validations/child-validation.ts
- Extend enrollment validation in lib/validations/enrollment-validation.ts
```

### Phase 3.3 (after services complete):
```
Launch T011 and T014 together:
- Create GET /api/admin/children/[id]/fee-details
- Create GET /api/admin/enrollments/[id]/effective-fee
```

### Phase 3.4 (after APIs complete):
```
Launch T015 and T016 together:
- Create fee input component
- Create fee display component
```

### Phase 3.5 (testing):
```
Launch T023-T036 together (all independent test files):
- Contract tests for all endpoints
- Integration tests for all quickstart scenarios
- Constitutional compliance tests for security and audit requirements
```

## Notes
- All tasks must enforce multi-tenant security (schoolId scoping)
- All tasks must follow constitutional principles (micro-functions, no hardcoding, component reuse)
- Fee amounts stored in cents (integer), displayed in RON
- Admin-only access enforced via existing RBAC middleware
- Access logging for all fee modification operations

## Estimated Completion
- Phase 3.1: 2-3 hours
- Phase 3.2: 2-3 hours
- Phase 3.3: 3-4 hours
- Phase 3.4: 4-5 hours
- Phase 3.5: 3-4 hours
- **Total**: 14-19 hours

---
*Generated from plan.md v1.0 | Ready for /implement execution*