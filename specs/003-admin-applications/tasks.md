# Tasks: Admin Applications Management

**Input**: Design documents from `/specs/003-admin-applications/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ COMPLETED: TypeScript/Next.js 15/React 19 stack identified
   → ✅ COMPLETED: Drizzle ORM, Auth.js, shadcn/ui dependencies confirmed
2. Load optional design documents:
   → ✅ COMPLETED: data-model.md: Applications, Enrollments, Users (extends), Children (extends)
   → ✅ COMPLETED: contracts/: 4 API endpoints (applications, enrollment, children, users)
   → ✅ COMPLETED: research.md: Atomic transactions, pagination, table patterns
3. Generate tasks by category:
   → Setup: constants, schema, migrations (3 tasks)
   → Tests: contract tests, integration tests (6 tasks)
   → Core: API endpoints, server functions, components (10 tasks)
   → Integration: middleware, approval workflow, forms (5 tasks)
   → Polish: unit tests, performance optimization, validation (4 tasks)
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✅ All contracts have tests
   → ✅ All entities have models
   → ✅ All endpoints implemented
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js app**: `app/`, `components/`, `lib/` at repository root
- **Scoped components**: `app/admin/applications/components/` for applications-specific components
- **Shared UI**: `components/ui/` for shadcn/ui and reusable components
- **Backend logic**: `lib/` for database, auth, and business logic
- **API routes**: `app/api/` for Next.js API routes

## Phase 3.1: Setup & Constants
- [X] T001 [P] Create application constants file at `app/admin/applications/constants.ts` with ApplicationStatus, EnrollmentStatus, and validation enums, ensuring all hardcoded strings are eliminated per FR-014
- [X] T002 [P] Create applications schema at `lib/db/schema/applications.ts` with all fields, optimized indexes for search/filtering performance (NFR-004), and relationships
- [X] T003 [P] Create enrollments schema at `lib/db/schema/enrollments.ts` with enrollment entity definition

## Phase 3.2: Contract Tests (TDD)
- [X] T004 [P] Create contract test for GET /api/applications at `__tests__/api/applications-list.test.ts`
- [X] T005 [P] Create contract test for POST /api/admin/enrollment at `__tests__/api/admin-enrollment.test.ts`
- [X] T006 [P] Create contract test for POST /api/children at `__tests__/api/children-create.test.ts`
- [X] T007 [P] Create contract test for POST /api/users at `__tests__/api/users-create.test.ts`

## Phase 3.3: Database & Queries
- [X] T008 [P] Create applications queries helper at `lib/db/queries/applications.ts` with optimized pagination, search, and filtering ensuring <200ms response times per NFR-004
- [X] T009 Extend users schema at `lib/db/schema/users.ts` to include applicationId and isFromApplication fields
- [X] T010 Extend children schema at `lib/db/schema/children.ts` to include applicationId field

## Phase 3.4: API Endpoints
- [X] T011 Implement GET /api/applications route at `app/api/applications/route.ts` for applications listing with pagination
- [X] T012 Implement POST /api/admin/enrollment route at `app/api/admin/enrollment/route.ts` for approval/rejection workflow
- [X] T013 Implement POST /api/children route at `app/api/children/route.ts` for child record creation
- [X] T014 Extend POST /api/users route at `app/api/users/route.ts` to support parent account creation from applications

## Phase 3.5: Server Functions
- [X] T015 [P] Create applications server functions at `app/admin/applications/server/applications.ts` for server-side data fetching
- [X] T016 [P] Create application types at `lib/types/applications.ts` with TypeScript interfaces

## Phase 3.6: Components
- [X] T017 [P] Create ApplicationsTable component at `app/admin/applications/components/ApplicationsTable.tsx` with search, filtering, and pagination
- [X] T018 [P] Create ApplicationActions component at `app/admin/applications/components/ApplicationActions.tsx` with approve/reject buttons
- [X] T019 [P] Create AddParentForm component at `app/admin/applications/components/AddParentForm.tsx` for parent account details
- [X] T020 [P] Create AddChildForm component at `app/admin/applications/components/AddChildForm.tsx` for child record details

## Phase 3.7: Integration & Workflows
- [X] T021 Create main applications page at `app/admin/applications/page.tsx` composing all components with server-side rendering
- [X] T022 Implement approval workflow with atomic transactions linking applications server functions and API endpoints
- [X] T023 Add middleware protection for admin-only access to `/admin/applications` route using existing Auth.js RBAC patterns
- [X] T024 Implement concurrent processing prevention with admin identification in applications table

## Phase 3.8: Integration Tests
- [X] T025 [P] Create integration test for approval workflow at `__tests__/integration/application-approval.test.ts`
- [X] T026 [P] Create integration test for rejection workflow at `__tests__/integration/application-rejection.test.ts`

## Phase 3.9: Polish & Validation
- [X] T027 [P] Add unit tests for applications server functions at `__tests__/unit/applications-server.test.ts`
- [X] T028 [P] Add performance optimization for applications table pagination and implement caching strategy
- [X] T029 Run quickstart validation scenarios and fix any issues identified in the 15-minute test suite

## Dependency Graph

```
T001, T002, T003 (Setup) → Can run in parallel
    ↓
T004, T005, T006, T007 (Contract Tests) → Depends on T001 (constants)
    ↓
T008 (Queries) → Depends on T002 (applications schema)
T009, T010 (Schema Extensions) → Depends on existing schema files
    ↓
T011, T012, T013, T014 (API Endpoints) → Depends on T008, T009, T010
    ↓
T015, T016 (Server Functions & Types) → Can run in parallel, depends on T008
    ↓
T017, T018, T019, T020 (Components) → Can run in parallel, depends on T015, T016
    ↓
T021 (Main Page) → Depends on T017, T018
T022 (Approval Workflow) → Depends on T012, T013, T014, T015
T023 (Middleware) → Independent, can run early
T024 (Concurrent Processing) → Depends on T017, T022
    ↓
T025, T026 (Integration Tests) → Depends on T021, T022
    ↓
T027, T028, T029 (Polish) → Can run in parallel, depends on all previous tasks
```

## Parallel Execution Examples

### Phase 1: Setup (All Parallel)
```bash
# Can run simultaneously
Task T001: Create constants file
Task T002: Create applications schema  
Task T003: Create enrollments schema
```

### Phase 2: Contract Tests (All Parallel)
```bash
# Can run simultaneously after T001 completes
Task T004: Applications list contract test
Task T005: Admin enrollment contract test
Task T006: Children create contract test
Task T007: Users create contract test
```

### Phase 3: Components (All Parallel)
```bash
# Can run simultaneously after server functions ready
Task T017: ApplicationsTable component
Task T018: ApplicationActions component
Task T019: AddParentForm component
Task T020: AddChildForm component
```

### Phase 4: Polish (All Parallel)
```bash
# Can run simultaneously at the end
Task T027: Unit tests for server functions
Task T028: Performance optimization
Task T029: Quickstart validation
```

## Execution Notes

### Constitutional Compliance
- All tasks follow micro-functions principle (small, focused components)
- Server-first approach (minimal client components)
- Multi-tenant security enforced throughout
- No hardcoded strings (all use constants from T001)

### Performance Targets
- Applications table must load in under 2 seconds (per clarifications)
- Optimized for low concurrency (1-3 admins per school)
- Server-side pagination and filtering for efficiency

### Security Requirements
- Admin-only middleware protection (T023)
- Multi-tenant query scoping in all database operations
- Basic audit logging (admin ID, application ID, action, timestamp)
- Concurrent processing prevention (T024)

### Testing Strategy
- TDD approach: Contract tests before implementation
- Integration tests cover complete approval/rejection workflows
- Quickstart validation ensures end-to-end functionality
- Performance tests validate 2-second loading target

## Task Completion Criteria

Each task is complete when:
1. **Code Quality**: Follows constitutional principles and TypeScript strict mode
2. **Testing**: Associated tests pass (where applicable)
3. **Integration**: Works with existing montessori-app codebase
4. **Documentation**: Includes proper TypeScript types and comments
5. **Security**: Multi-tenant scoping and admin-only access enforced

## Next Steps After Task Completion

1. **Phase 4**: Execute tasks.md following dependency order
2. **Phase 5**: Run quickstart validation scenarios (T029)
3. **Integration**: Merge with main codebase after all tests pass
4. **Deployment**: Deploy to staging for user acceptance testing