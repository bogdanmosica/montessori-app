# Tasks: Admin Applications Management

**Input**: Design documents from `/specs/003-build-the-admin/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 15 App Router, TypeScript, Drizzle ORM, Auth.js, shadcn/ui, Tailwind CSS
   → Structure: Next.js application (web frontend + backend API routes)
2. Load design documents:
   → data-model.md: 5 entities → model tasks
   → contracts/api-spec.yaml: 5 endpoints → contract test tasks
   → quickstart.md: 9 scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: Next.js project, dependencies, linting, database
   → Tests: contract tests, integration tests
   → Core: schemas, services, API routes
   → UI: pages, components (server-first)
   → Polish: unit tests, performance, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Tasks numbered T001-T035 with dependencies
6. Parallel execution examples provided
7. Validation: All contracts tested, entities modeled, stories covered
8. Return: SUCCESS (35 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js app**: `app/`, `components/`, `lib/` at repository root
- **Admin routes**: `app/admin/applications/` for feature-specific components
- **Shared UI**: `components/ui/` for shadcn/ui and reusable components
- **Backend logic**: `lib/` for database, auth, and business logic
- **API routes**: `app/api/admin/` for admin-specific API endpoints

## Phase 3.1: Setup & Environment
- [x] T001 Configure database schema migrations for new entities (applications, child_profiles, parent_profiles, parent_child_relationships, access_logs)
- [x] T002 [P] Create application status enums in lib/constants/application-status.ts
- [x] T003 [P] Create relationship type enums in lib/constants/relationship-types.ts
- [x] T004 [P] Create access log action enums in lib/constants/access-log-actions.ts
- [x] T005 Add admin applications route group structure in app/admin/applications/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests
- [x] T006 [P] API contract test GET /api/admin/applications in __tests__/api/admin-applications-list.test.ts
- [x] T007 [P] API contract test GET /api/admin/applications/[id] in __tests__/api/admin-applications-detail.test.ts
- [x] T008 [P] API contract test POST /api/admin/applications/[id]/approve in __tests__/api/admin-applications-approve.test.ts
- [x] T009 [P] API contract test POST /api/admin/applications/[id]/reject in __tests__/api/admin-applications-reject.test.ts
- [x] T010 [P] API contract test POST /api/admin/children in __tests__/api/admin-children-create.test.ts

### Integration Tests (from quickstart scenarios)
- [x] T011 [P] Integration test applications list viewing with tenant scoping in __tests__/integration/applications-list-view.test.ts
- [ ] T012 [P] Integration test application status filtering in __tests__/integration/applications-filtering.test.ts
- [ ] T013 [P] Integration test application search functionality in __tests__/integration/applications-search.test.ts
- [x] T014 [P] Integration test application approval workflow in __tests__/integration/application-approval.test.ts
- [ ] T015 [P] Integration test application rejection workflow in __tests__/integration/application-rejection.test.ts
- [ ] T016 [P] Integration test direct child creation workflow in __tests__/integration/direct-child-creation.test.ts
- [ ] T017 [P] Integration test multi-tenant security isolation in __tests__/integration/tenant-security.test.ts
- [ ] T018 [P] Integration test audit trail logging in __tests__/integration/audit-logging.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Schemas (Drizzle ORM)
- [x] T019 [P] Application entity schema in lib/db/schema/applications.ts
- [x] T020 [P] Child profile entity schema in lib/db/schema/child-profiles.ts
- [x] T021 [P] Parent profile entity schema in lib/db/schema/parent-profiles.ts
- [x] T022 [P] Parent-child relationship schema in lib/db/schema/parent-child-relationships.ts
- [x] T023 [P] Access log entity schema in lib/db/schema/access-logs.ts

### Service Layer
- [x] T024 [P] Application queries service in lib/services/application-queries.ts
- [x] T025 [P] Application processing service (approve/reject) in lib/services/application-processing.ts
- [x] T026 [P] Parent profile matching service in lib/services/parent-profile-matching.ts
- [x] T027 [P] Child profile creation service in lib/services/child-profile-creation.ts
- [x] T028 [P] Access logging service in lib/services/access-logging.ts

### API Route Handlers
- [x] T029 GET /api/admin/applications route handler in app/api/admin/applications/route.ts
- [x] T030 GET /api/admin/applications/[id] route handler in app/api/admin/applications/[id]/route.ts
- [x] T031 POST /api/admin/applications/[id]/approve route handler in app/api/admin/applications/[id]/approve/route.ts
- [x] T032 POST /api/admin/applications/[id]/reject route handler in app/api/admin/applications/[id]/reject/route.ts
- [x] T033 POST /api/admin/children route handler in app/api/admin/children/route.ts

## Phase 3.4: UI Components (Server-first)

### Server Components
- [x] T034 [P] Applications list server component in app/admin/applications/components/applications-list.tsx
- [x] T035 [P] Application detail server component in app/admin/applications/components/application-detail.tsx
- [x] T036 [P] Application status badge component in app/admin/applications/components/application-status-badge.tsx

### Client Components (minimal use client)
- [x] T037 [P] Application filters client component in app/admin/applications/components/application-filters.tsx
- [x] T038 [P] Application search client component in app/admin/applications/components/application-search.tsx
- [x] T039 [P] Application actions client component in app/admin/applications/components/application-actions.tsx
- [ ] T040 [P] Direct child creation form in app/admin/applications/components/create-child-form.tsx

### Pages
- [x] T041 Applications list page in app/admin/applications/page.tsx
- [x] T042 Application detail page in app/admin/applications/[id]/page.tsx

## Phase 3.5: Integration & Polish

### Middleware & Security
- [ ] T043 Admin RBAC enforcement for /admin/applications routes in middleware.ts updates
- [ ] T044 Multi-tenant query scoping validation for all application services

### Performance & Caching
- [ ] T045 [P] Database query optimization and indexing strategy
- [ ] T046 [P] Pagination performance testing with large datasets
- [ ] T047 [P] Page load performance validation (<200ms requirement) with realistic data volumes

### Unit Tests
- [ ] T048 [P] Unit tests for application queries service in __tests__/unit/application-queries.test.ts
- [ ] T049 [P] Unit tests for parent profile matching in __tests__/unit/parent-profile-matching.test.ts
- [ ] T050 [P] Unit tests for child profile creation in __tests__/unit/child-profile-creation.test.ts

### Documentation & Types
- [ ] T051 [P] Component documentation and TypeScript type definitions
- [ ] T052 [P] API documentation updates for admin endpoints

## Dependencies

### Critical Path
1. **Setup** (T001-T005) → **Tests** (T006-T018) → **Implementation** (T019-T033)
2. **Schemas** (T019-T023) → **Services** (T024-T028) → **API Routes** (T029-T033)
3. **Server Components** (T034-T036) → **Pages** (T041-T042)
4. **Core Implementation** → **Integration & Polish** (T043-T052)

### Parallel Execution Blocks
- **Constants** (T002-T004): All different files, no dependencies
- **Contract Tests** (T006-T010): All different test files
- **Integration Tests** (T011-T018): All different test files
- **Schemas** (T019-T023): All different schema files
- **Services** (T024-T028): All different service files
- **Server Components** (T034-T036): All different component files
- **Client Components** (T037-T040): All different component files

## Parallel Example
```bash
# Phase 3.2 - Launch all contract tests together:
Task: "API contract test GET /api/admin/applications in __tests__/api/admin-applications-list.test.ts"
Task: "API contract test GET /api/admin/applications/[id] in __tests__/api/admin-applications-detail.test.ts"
Task: "API contract test POST /api/admin/applications/[id]/approve in __tests__/api/admin-applications-approve.test.ts"
Task: "API contract test POST /api/admin/applications/[id]/reject in __tests__/api/admin-applications-reject.test.ts"
Task: "API contract test POST /api/admin/children in __tests__/api/admin-children-create.test.ts"

# Phase 3.3 - Launch all schema tasks together:
Task: "Application entity schema in lib/db/schema/applications.ts"
Task: "Child profile entity schema in lib/db/schema/child-profiles.ts"
Task: "Parent profile entity schema in lib/db/schema/parent-profiles.ts"
Task: "Parent-child relationship schema in lib/db/schema/parent-child-relationships.ts"
Task: "Access log entity schema in lib/db/schema/access-logs.ts"

# Phase 3.4 - Launch server components together:
Task: "Applications list server component in app/admin/applications/components/applications-list.tsx"
Task: "Application detail server component in app/admin/applications/components/application-detail.tsx"
Task: "Application status badge component in app/admin/applications/components/application-status-badge.tsx"
```

## Notes
- **TDD Critical**: All tests (T006-T018) must be written and failing before any implementation starts
- **Server-First**: UI components default to server components, use `use client` only where needed (T037-T040)
- **Multi-Tenant**: All database queries must include tenant scoping validation
- **Constitutional Compliance**: All tasks follow Monte SMS constitution principles
- **Audit Trail**: Every admin action must generate corresponding access log entry

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts** (5 endpoints):
   - Each endpoint → contract test task [P] (T006-T010)
   - Each endpoint → implementation task (T029-T033)

2. **From Data Model** (5 entities):
   - Each entity → schema creation task [P] (T019-T023)
   - Related services → service layer tasks [P] (T024-T028)

3. **From Quickstart** (9 scenarios):
   - Each scenario → integration test [P] (T011-T018)
   - UI workflows → component tasks (T034-T042)

4. **Constitutional Requirements**:
   - Multi-tenant security → validation tasks (T043-T044)
   - Performance goals → optimization tasks (T045-T046)
   - Audit compliance → logging validation (T018, T028)

## Validation Checklist
*GATE: Checked before task execution*

- [x] All 5 API contracts have corresponding tests (T006-T010)
- [x] All 5 entities have schema tasks (T019-T023)
- [x] All 9 quickstart scenarios have integration tests (T011-T018)
- [x] All tests come before implementation (T006-T018 before T019-T033)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] Constitutional compliance validated throughout
- [x] Multi-tenant security requirements addressed
- [x] Server-first architecture maintained