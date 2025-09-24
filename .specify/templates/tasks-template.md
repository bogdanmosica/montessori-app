# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js app**: `app/`, `components/`, `lib/` at repository root
- **Scoped components**: `app/(route-group)/components/` for route-specific components
- **Shared UI**: `components/ui/` for shadcn/ui and reusable components
- **Backend logic**: `lib/` for database, auth, and business logic
- **API routes**: `app/api/` for Next.js API routes
- Paths shown below assume Next.js structure - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create Next.js project structure per implementation plan
- [ ] T002 Initialize TypeScript project with Next.js 15, shadcn/ui, and Drizzle ORM dependencies
- [ ] T003 [P] Configure ESLint, Prettier, and TypeScript strict mode

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] API contract test POST /api/users in __tests__/api/users.post.test.ts
- [ ] T005 [P] API contract test GET /api/users/[id] in __tests__/api/users.get.test.ts
- [ ] T006 [P] Integration test user registration flow in __tests__/integration/registration.test.ts
- [ ] T007 [P] Integration test RBAC enforcement in __tests__/integration/rbac.test.ts
- [ ] T008 [P] Multi-tenant data isolation test in __tests__/integration/tenant-isolation.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 [P] User schema in lib/db/schema/users.ts
- [ ] T010 [P] School/tenant schema in lib/db/schema/schools.ts
- [ ] T011 [P] User service functions in lib/services/user-service.ts
- [ ] T012 [P] RBAC middleware in lib/auth/rbac-middleware.ts
- [ ] T013 [P] Multi-tenant query helpers in lib/db/tenant-queries.ts
- [ ] T014 POST /api/users route handler in app/api/users/route.ts
- [ ] T015 GET /api/users/[id] route handler in app/api/users/[id]/route.ts
- [ ] T016 Input validation with Zod schemas
- [ ] T017 Error handling and access logging

## Phase 3.4: UI Components (Server-first)
- [ ] T018 [P] User list server component in app/(dashboard)/users/components/user-list.tsx
- [ ] T019 [P] User form client component in app/(dashboard)/users/components/user-form.tsx
- [ ] T020 [P] RBAC guard component in components/rbac-guard.tsx
- [ ] T021 Users dashboard page in app/(dashboard)/users/page.tsx
- [ ] T022 User detail page in app/(dashboard)/users/[id]/page.tsx

## Phase 3.5: Integration & Polish
- [ ] T023 Connect user service to Drizzle ORM
- [ ] T024 Implement session management with role changes
- [ ] T025 Add access logging to all user actions
- [ ] T026 Configure tenant-scoped database queries
- [ ] T027 [P] Unit tests for user service in __tests__/unit/user-service.test.ts
- [ ] T028 [P] Component tests using React Testing Library
- [ ] T029 Performance optimization and query caching
- [ ] T030 Update documentation and type definitions

## Dependencies
- Tests (T004-T008) before implementation (T009-T017)
- Schema tasks (T009-T010) before service tasks (T011-T013)
- Service tasks before API routes (T014-T015)
- Server components (T018, T021-T022) before client components (T019)
- Core implementation before polish (T027-T030)

## Parallel Example
```
# Launch T004-T008 together (all different test files):
Task: "API contract test POST /api/users in __tests__/api/users.post.test.ts"
Task: "API contract test GET /api/users/[id] in __tests__/api/users.get.test.ts" 
Task: "Integration test registration flow in __tests__/integration/registration.test.ts"
Task: "Integration test RBAC enforcement in __tests__/integration/rbac.test.ts"
Task: "Multi-tenant data isolation test in __tests__/integration/tenant-isolation.test.ts"

# Launch T009-T013 together (all different lib files):
Task: "User schema in lib/db/schema/users.ts"
Task: "School schema in lib/db/schema/schools.ts"
Task: "User service functions in lib/services/user-service.ts"
Task: "RBAC middleware in lib/auth/rbac-middleware.ts"
Task: "Multi-tenant query helpers in lib/db/tenant-queries.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task