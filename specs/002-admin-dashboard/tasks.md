# Tasks: Admin Dashboard for Monte SMS

**Input**: Design documents from `D:\Projects\montessori-app\specs\002-admin-dashboard\`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✓ Found: Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, Recharts
   → ✓ Extract: Server-side rendering, consolidated API, scoped components
2. Load optional design documents:
   → ✓ data-model.md: DashboardMetrics, CashflowMetrics, Family/Child entities, SecurityAlert
   → ✓ contracts/: api-admin-metrics.md endpoint specification
   → ✓ research.md: Server-first strategy, Recharts client components, caching approach
   → ✓ quickstart.md: Performance testing, cashflow validation, capacity scenarios
3. Generate tasks by category:
   → Setup: constants, dependencies, database schema
   → Tests: API contract tests, integration scenarios
   → Core: database helpers, API endpoint, caching
   → Components: server-first dashboard components with minimal client code
   → Integration: page composition, performance optimization
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✓ API contract has test
   → ✓ All data entities have models
   → ✓ All dashboard scenarios have integration tests
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Dashboard route**: `app/admin/dashboard/` for dashboard-specific files
- **Scoped components**: `app/admin/dashboard/components/` for dashboard components
- **Server helpers**: `app/admin/dashboard/server/` for database query functions
- **API routes**: `app/api/admin/` for admin-specific endpoints
- **Shared types**: `lib/types/` for TypeScript interfaces
- **Database**: `lib/db/` for schema and query helpers

## Phase 3.1: Setup & Constants
- [x] T001 Install Recharts dependency for dashboard charts (`pnpm add recharts @types/recharts`)
- [x] T002 [P] Create dashboard constants in app/admin/dashboard/constants.ts
- [x] T003 [P] Create dashboard TypeScript types in lib/types/dashboard.ts
- [x] T003b [P] Create dashboard context and permissions helper in lib/auth/dashboard-context.ts
- [x] T004 [P] Extend database schema with cashflow and family entities in lib/db/schema.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] API contract test GET /api/admin/metrics in __tests__/api/admin-metrics.test.ts
- [x] T006 [P] Integration test admin dashboard performance in __tests__/integration/dashboard-performance.test.ts
- [x] T007 [P] Integration test cashflow metrics calculation in __tests__/integration/cashflow-calculation.test.ts
- [x] T008 [P] Integration test capacity utilization display in __tests__/integration/capacity-utilization.test.ts
- [x] T009 [P] Integration test security alerts display in __tests__/integration/security-alerts.test.ts
- [x] T010 [P] Integration test empty state handling in __tests__/integration/empty-states.test.ts
- [x] T011 [P] Integration test Super Admin aggregated view in __tests__/integration/super-admin-view.test.ts

## Phase 3.3: Database & API Layer (ONLY after tests are failing)
- [x] T012 [P] Create cashflow calculation helpers in app/admin/dashboard/server/cashflow-metrics.ts
- [x] T013 [P] Create capacity utilization helpers in app/admin/dashboard/server/capacity-metrics.ts
- [x] T014 [P] Create security alerts query helpers in app/admin/dashboard/server/security-alerts.ts
- [x] T015 [P] Create teacher activity metrics helpers in app/admin/dashboard/server/teacher-metrics.ts
- [x] T016 Create consolidated metrics service in app/admin/dashboard/server/metrics.ts
- [x] T017 GET /api/admin/metrics route handler in app/api/admin/metrics/route.ts
- [x] T018 Add response caching and error handling to metrics API

## Phase 3.4: Dashboard Components (Server-first)
- [x] T019 [P] Create MetricsCard server component in app/admin/dashboard/components/MetricsCard.tsx
- [x] T020 [P] Create CashflowCard server component in app/admin/dashboard/components/CashflowCard.tsx
- [x] T021 [P] Create CapacityCard server component in app/admin/dashboard/components/CapacityCard.tsx
- [x] T022 [P] Create AlertsBanner server component in app/admin/dashboard/components/AlertsBanner.tsx
- [x] T023 [P] Create EmptyState server component in app/admin/dashboard/components/EmptyState.tsx
- [x] T024 Create TrendsChart client component in app/admin/dashboard/components/TrendsChart.client.tsx
- [x] T025 Create main dashboard page composition in app/admin/dashboard/page.tsx

## Phase 3.5: Super Admin Features
- [x] T026 [P] Create Super Admin metrics aggregation helpers in app/admin/dashboard/server/super-admin-metrics.ts
- [x] T027 [P] Create SystemHealthCard server component in app/admin/dashboard/components/SystemHealthCard.tsx
- [x] T028 Add Super Admin conditional rendering to dashboard page

## Phase 3.6: Integration & Polish
- [x] T029 Add database migration for family and cashflow schema changes
- [x] T030 Update seed script with family relationships and fee structures in lib/db/seed.ts
- [x] T031 [P] Add unit tests for cashflow calculations in __tests__/unit/cashflow-metrics.test.ts
- [x] T032 [P] Add unit tests for capacity calculations in __tests__/unit/capacity-metrics.test.ts
- [x] T033 [P] Add unit tests for security alerts processing in __tests__/unit/security-alerts.test.ts
- [x] T034 [P] Add component tests for dashboard components in __tests__/components/dashboard-components.test.tsx
- [x] T035 Performance optimization: implement metrics response caching
- [x] T036 Add error boundaries and loading states to dashboard components
- [x] T037 Run quickstart.md validation scenarios and performance benchmarks
- [x] T038 Design Consistency Validation: Create visual regression tests and document design system usage
- [x] T039 Accessibility Compliance: Implement WCAG 2.1 AA testing with axe-core and manual validation

## Dependencies
- Setup tasks (T001-T004) before all other phases
- Tests (T005-T011) before implementation (T012-T025)
- Database helpers (T012-T015) before consolidated service (T016)
- Consolidated service (T016) before API route (T017)
- API route (T017) before dashboard components (T019-T025)
- Server components (T019-T023, T027) before client components (T024)
- Component creation before page composition (T025)
- Super Admin helpers (T026) before conditional rendering (T028)
- Core implementation before database migration (T029) and polish (T031-T037)

## Parallel Example
```
# Launch T005-T011 together (all different test files):
Task: "API contract test GET /api/admin/metrics in __tests__/api/admin-metrics.test.ts"
Task: "Integration test admin dashboard performance in __tests__/integration/dashboard-performance.test.ts"
Task: "Integration test cashflow metrics calculation in __tests__/integration/cashflow-calculation.test.ts"
Task: "Integration test capacity utilization display in __tests__/integration/capacity-utilization.test.ts"
Task: "Integration test security alerts display in __tests__/integration/security-alerts.test.ts"
Task: "Integration test empty state handling in __tests__/integration/empty-states.test.ts"
Task: "Integration test Super Admin aggregated view in __tests__/integration/super-admin-view.test.ts"

# Launch T012-T015 together (all different server helper files):
Task: "Create cashflow calculation helpers in app/admin/dashboard/server/cashflow-metrics.ts"
Task: "Create capacity utilization helpers in app/admin/dashboard/server/capacity-metrics.ts"
Task: "Create security alerts query helpers in app/admin/dashboard/server/security-alerts.ts"
Task: "Create teacher activity metrics helpers in app/admin/dashboard/server/teacher-metrics.ts"

# Launch T019-T023 together (all different server component files):
Task: "Create MetricsCard server component in app/admin/dashboard/components/MetricsCard.tsx"
Task: "Create CashflowCard server component in app/admin/dashboard/components/CashflowCard.tsx"
Task: "Create CapacityCard server component in app/admin/dashboard/components/CapacityCard.tsx"
Task: "Create AlertsBanner server component in app/admin/dashboard/components/AlertsBanner.tsx"
Task: "Create EmptyState server component in app/admin/dashboard/components/EmptyState.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify all tests fail before implementing (TDD principle)
- Dashboard page (T025) must be thin, only composing child components
- Only TrendsChart.client.tsx (T024) uses `use client` directive
- All constants and enums defined in constants.ts (T002) - no hardcoding
- Database queries must be tenant-scoped for multi-tenant isolation
- Cashflow calculations must respect sibling discount configurations
- Capacity metrics include age group breakdowns and utilization percentages
- Performance target: <500ms TTFB for dashboard, <300ms API response
- Server components preferred for better performance and SEO

## Task Generation Rules Applied

1. **From API Contract**:
   - api-admin-metrics.md → T005 (contract test), T017 (API implementation)

2. **From Data Model Entities**:
   - DashflowMetrics → T012 (cashflow helpers), T020 (cashflow card)
   - Family/Child relationships → T013 (capacity helpers), T021 (capacity card)
   - SecurityAlert → T014 (security helpers), T022 (alerts banner)
   - TeacherActivity → T015 (teacher helpers), T019 (metrics card)

3. **From Quickstart Scenarios**:
   - Scenario 1 (performance) → T006 (performance test)
   - Scenario 7 (cashflow) → T007 (cashflow test)
   - Scenario 8 (capacity) → T008 (capacity test)
   - Scenario 2 (alerts) → T009 (alerts test)
   - Scenario 3 (empty states) → T010 (empty states test)
   - Scenario 4 (Super Admin) → T011 (super admin test)

4. **From Research Decisions**:
   - Server-side rendering → Server components prioritized (T019-T023)
   - Recharts client-only → T024 marked as client component
   - Consolidated API → T016-T017 single service and endpoint
   - Component scoping → T002 constants, scoped component structure

## Validation Checklist

- [x] API contract has corresponding test task (T005)
- [x] All data model entities have helper creation tasks
- [x] All quickstart scenarios have integration tests
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD order enforced (tests T005-T011 before implementation T012+)
- [x] Constitution compliance: server-first, micro functions, no hardcoding
- [x] Performance requirements reflected in caching and optimization tasks