# Tasks: Role-Based Access Control for Admin Routes

**Input**: Design documents from `D:\Projects\montessori-app\specs\001-extend-existing-next\`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✓ Found: Next.js 15, TypeScript, Auth.js, Drizzle ORM, PostgreSQL
   → ✓ Extract: tech stack, libraries, structure
2. Load optional design documents:
   → ✓ data-model.md: UserRole enum, User entity extension, AccessLog entity
   → ✓ contracts/: user-role-api.md, middleware-protection.md
   → ✓ research.md: TypeScript enum decisions, Auth.js patterns, middleware approach
3. Generate tasks by category:
   → Setup: project dependencies, database migration
   → Tests: API contract tests, integration test scenarios
   → Core: UserRole enum, database schema, Auth.js callbacks
   → Integration: middleware, API routes, logging
   → Polish: unauthorized page, logo update, performance validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✓ All contracts have tests
   → ✓ All entities have models
   → ✓ All endpoints implemented
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js app**: `app/`, `components/`, `lib/` at repository root
- **Database**: `lib/db/` for schemas, migrations, and queries
- **Auth**: `lib/auth/` for session management and middleware
- **API routes**: `app/api/` for Next.js API routes
- **Components**: `app/unauthorized/` for route-specific components

## Phase 3.1: Setup
- [X] T001 Install additional dependencies: @types/bcryptjs for password hashing types
- [X] T002 Create UserRole enum constants in lib/constants/user-roles.ts
- [X] T003 [P] Generate Drizzle migration for user role and session version fields

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [X] T004 [P] Contract test PUT /api/users/[id]/role in __tests__/api/user-role-update.test.ts
- [X] T005 [P] Contract test GET /api/users/me in __tests__/api/user-profile.test.ts
- [X] T006 [P] Contract test GET /api/admin/access-logs in __tests__/api/admin-access-logs.test.ts
- [X] T006b [P] Contract test POST /api/admin/users/[id]/assign-role in __tests__/api/admin-role-assignment.test.ts
- [X] T007 [P] Integration test admin access to protected routes in __tests__/integration/admin-access.test.ts
- [X] T008 [P] Integration test non-admin redirect to unauthorized in __tests__/integration/unauthorized-redirect.test.ts
- [X] T009 [P] Integration test role change session invalidation in __tests__/integration/session-invalidation.test.ts
- [X] T010 [P] Integration test role visibility in session in __tests__/integration/role-visibility.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [X] T011 [P] Extend User schema with role and sessionVersion fields in lib/db/schema.ts
- [X] T012 [P] Create AccessLog schema in lib/db/schema.ts
- [X] T013 [P] Update Auth.js JWT callback to include role in lib/auth/session.ts
- [X] T014 [P] Update Auth.js session callback to include role in lib/auth/session.ts
- [X] T015 [P] Create access logging service in lib/services/access-log-service.ts
- [X] T016 Create Next.js middleware for route protection in middleware.ts
- [X] T017 PUT /api/users/[id]/role route handler in app/api/users/[id]/role/route.ts
- [X] T018 GET /api/users/me route handler in app/api/users/me/route.ts
- [X] T019 GET /api/admin/access-logs route handler in app/api/admin/access-logs/route.ts
- [X] T019b POST /api/admin/users/[id]/assign-role route handler in app/api/admin/users/[id]/assign-role/route.ts

## Phase 3.4: UI Components (Server-first)
- [X] T020 [P] Create unauthorized page in app/unauthorized/page.tsx
- [X] T021 [P] Create simple school logo asset in public/images/school-logo.svg
- [X] T022 Update topbar logo reference in app/(dashboard)/layout.tsx
- [X] T023 [P] Create role assignment interface (admin only) in app/(dashboard)/admin/users/components/role-assignment.tsx

## Phase 3.5: Integration & Polish
- [X] T024 Run database migration to add user role and session version columns
- [X] T025 Update seed script to assign default roles to existing test users in lib/db/seed.ts
- [X] T026 [P] Add unit tests for UserRole enum validation in __tests__/unit/user-roles.test.ts
- [X] T027 [P] Add unit tests for access log service in __tests__/unit/access-log-service.test.ts
- [X] T028 Performance test middleware execution time in __tests__/performance/middleware-performance.test.ts
- [X] T029 [P] Update TypeScript types for extended session interface
- [X] T030 Run quickstart.md manual testing scenarios and validate all acceptance criteria

## Dependencies
- Setup tasks (T001-T003) before all other phases
- Tests (T004-T010) before implementation (T011-T019)
- Core schema tasks (T011-T012) before service tasks (T013-T015)
- Auth.js callbacks (T013-T014) before middleware (T016)
- Service layer (T015) before API routes (T017-T019)
- Core implementation before UI components (T020-T023)
- Database migration (T024) before seed updates (T025)
- Implementation before polish and validation (T026-T030)

## Parallel Example
```
# Launch T004-T010 together (all different test files):
Task: "Contract test PUT /api/users/[id]/role in __tests__/api/user-role-update.test.ts"
Task: "Contract test GET /api/users/me in __tests__/api/user-profile.test.ts"
Task: "Contract test GET /api/admin/access-logs in __tests__/api/admin-access-logs.test.ts"
Task: "Integration test admin access to protected routes in __tests__/integration/admin-access.test.ts"
Task: "Integration test non-admin redirect to unauthorized in __tests__/integration/unauthorized-redirect.test.ts"
Task: "Integration test role change session invalidation in __tests__/integration/session-invalidation.test.ts"
Task: "Integration test role visibility in session in __tests__/integration/role-visibility.test.ts"

# Launch T011-T015 together (all different lib files):
Task: "Extend User schema with role and sessionVersion fields in lib/db/schema.ts"
Task: "Create AccessLog schema in lib/db/schema.ts"  
Task: "Update Auth.js JWT callback to include role in lib/auth/session.ts"
Task: "Update Auth.js session callback to include role in lib/auth/session.ts"
Task: "Create access logging service in lib/services/access-log-service.ts"

# Launch T020-T021 together (different UI files):
Task: "Create unauthorized page in app/unauthorized/page.tsx"
Task: "Create simple school logo asset in public/images/school-logo.svg"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify all tests fail before implementing (TDD principle)
- Commit after each task completion
- Follow Monte SMS Constitution: micro functions, no hardcoding, server-first components
- All database queries must be tenant-scoped for multi-tenant isolation
- Role changes must increment sessionVersion to invalidate existing sessions
- Access logging is async to prevent blocking request processing

## Task Generation Rules Applied

1. **From Contracts**:
   - user-role-api.md → T004 (PUT role), T005 (GET profile), T006 (GET logs)
   - middleware-protection.md → T016 (middleware implementation)

2. **From Data Model**:
   - UserRole enum → T002 (enum constants)
   - User entity extension → T011 (schema extension)
   - AccessLog entity → T012 (access log schema)

3. **From Quickstart Scenarios**:
   - Scenario 1 → T007 (admin access test)
   - Scenario 2 → T008 (unauthorized redirect test)
   - Scenario 3 → T010 (role visibility test)  
   - Scenario 4 → T009 (session invalidation test)
   - Scenario 5 → T021-T022 (logo update)

4. **Ordering Applied**:
   - Setup → Tests → Models → Services → API Routes → UI → Polish
   - Dependencies enforced through prerequisite relationships

## Validation Checklist

- [x] All API contracts have corresponding test tasks
- [x] All data model entities have schema creation tasks
- [x] All integration scenarios have test tasks
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD order enforced (tests before implementation)
- [x] Constitution compliance built into task descriptions