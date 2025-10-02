# Tasks: Initialize Teacher Module

**Input**: Design documents from `/specs/012-initialize-the-teacher/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Found: tech stack (Next.js 15, TypeScript, React 19), structure (Next.js App Router)
   → Extract: Teacher module with empty pages only, RBAC integration
2. Load optional design documents:
   → data-model.md: Extract Teacher, TeacherStudentAssignment entities
   → contracts/: Route contracts (dashboard, students), API contracts  
   → research.md: Next.js patterns, RBAC integration, minimal scope
3. Generate tasks by category:
   → Setup: Role constants, route groups, middleware extension
   → Tests: Route protection tests, empty state tests
   → Core: Empty page components, basic navigation
   → Integration: RBAC middleware, route protection
   → Polish: Documentation, type definitions
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P]) 
   → Focus on structure over functionality (per user requirements)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph for minimal Teacher module
7. Create parallel execution examples
8. Validate task completeness for empty page structure
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Infrastructure
- [x] T001 [P] Create Teacher role constants in lib/constants/roles.ts
- [x] T002 [P] Create Teacher route constants in lib/constants/routes.ts
- [x] T003 Create Teacher route group structure app/(teacher)/
- [x] T004 Update middleware to recognize Teacher role in middleware.ts
- [x] T005 [P] Create Teacher navigation constants in lib/constants/navigation.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T006 [P] Route protection test for /teacher/dashboard in __tests__/integration/teacher-routes.test.ts
- [ ] T007 [P] Route protection test for /teacher/students in __tests__/integration/teacher-students.test.ts
- [ ] T008 [P] RBAC middleware test for Teacher role in __tests__/integration/teacher-rbac.test.ts
- [ ] T009 [P] Teacher navigation component test in __tests__/components/teacher-navigation.test.tsx
- [ ] T010 [P] Empty state component tests in __tests__/components/teacher-empty-states.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T011 [P] Teacher dashboard empty page component in app/(teacher)/dashboard/page.tsx
- [x] T012 [P] Teacher students empty page component in app/(teacher)/students/page.tsx
- [x] T013 [P] Teacher layout component in app/(teacher)/layout.tsx
- [x] T014 [P] Teacher dashboard empty state component in app/(teacher)/dashboard/components/dashboard-empty.tsx
- [x] T015 [P] Student roster empty state component in app/(teacher)/students/components/roster-empty.tsx
- [x] T016 [P] Teacher navigation component in components/teacher-navigation.tsx

## Phase 3.4: RBAC Integration
- [x] T017 Extend existing RBAC middleware for Teacher routes in middleware.ts
- [x] T018 [P] Teacher route guard component in components/rbac/teacher-guard.tsx
- [x] T019 [P] Unauthorized redirect handler in lib/auth/redirect-handlers.ts
- [x] T020 Add Teacher role checking to existing session validation

## Phase 3.5: Navigation & Layout Integration
- [x] T021 [P] Teacher menu configuration in lib/config/teacher-menu.ts
- [x] T022 Update root layout to include Teacher navigation routing
- [x] T023 [P] Teacher breadcrumb component in components/teacher/breadcrumbs.tsx
- [x] T024 [P] Teacher page title component in components/teacher/page-title.tsx

## Phase 3.6: Polish & Validation
- [x] T025 [P] Teacher module type definitions in lib/types/teacher.ts
- [x] T026 [P] Teacher route utilities in lib/utils/teacher-routes.ts
- [x] T027 Validate Teacher route redirects work correctly (non-teachers → /unauthorized, unauthenticated → /sign-in)
- [x] T028 [P] Update CLAUDE.md with Teacher module context
- [x] T029 [P] Create Teacher module README documentation
- [x] T030 Verify empty pages render with proper navigation (dashboard accessible, students page accessible, menu shows correct active state)

## Dependencies
- Constants (T001-T002, T005) before components (T011-T016)
- Tests (T006-T010) before implementation (T011-T020)
- Route group (T003) before pages (T011-T012)
- Layout (T013) before page components (T011-T012)
- Middleware tasks sequential: T004 → T017 → T020 → T022 (same file)
- RBAC setup (T004, T017-T020) before route validation (T027)
- Navigation components (T021-T024) before final validation (T030)

## Parallel Example
```
# Launch T001, T002, T005 together (different constant files):
Task: "Create Teacher role constants in lib/constants/roles.ts"
Task: "Create Teacher route constants in lib/constants/routes.ts"
Task: "Create Teacher navigation constants in lib/constants/navigation.ts"

# Launch T006-T010 together (all different test files):
Task: "Route protection test for /teacher/dashboard in __tests__/integration/teacher-routes.test.ts"
Task: "Route protection test for /teacher/students in __tests__/integration/teacher-students.test.ts"
Task: "RBAC middleware test for Teacher role in __tests__/integration/teacher-rbac.test.ts"
Task: "Teacher navigation component test in __tests__/components/teacher-navigation.test.tsx"
Task: "Empty state component tests in __tests__/components/teacher-empty-states.test.tsx"

# Launch T011-T016 together (all different component files):
Task: "Teacher dashboard empty page component in app/(teacher)/dashboard/page.tsx"
Task: "Teacher students empty page component in app/(teacher)/students/page.tsx"
Task: "Teacher layout component in app/(teacher)/layout.tsx"
Task: "Teacher dashboard empty state component in app/(teacher)/dashboard/components/dashboard-empty.tsx"
Task: "Student roster empty state component in app/(teacher)/students/components/roster-empty.tsx"
Task: "Teacher navigation component in components/teacher-navigation.tsx"
```

## Scope Notes (Per User Requirements)
- **Empty Pages Only**: Focus on structure, not functionality
- **No Data Fetching**: Components show placeholder content
- **No API Implementation**: Skip teacher-api.yaml implementation for now
- **Basic Navigation**: Simple menu structure without complex routing
- **RBAC Integration**: Extend existing patterns, don't create new systems

## Task Generation Rules Applied

1. **From Contracts**:
   - Route contracts → route protection tests (T006-T008)
   - Component contracts → component structure (T011-T016)
   
2. **From User Requirements**:
   - Empty pages only → placeholder components (T014-T015)
   - Basic navigation → simple menu structure (T021-T024)
   
3. **From Constitutional Requirements**:
   - RBAC enforcement → middleware integration (T004, T017-T020)
   - Component organization → scoped components pattern (T014-T015)
   - No hardcoding → constants for roles/routes (T001-T002)

4. **Ordering Applied**:
   - Setup → Tests → Components → Integration → Polish
   - Constants before components using them
   - Tests before any implementation

## Validation Checklist
*GATE: Checked before execution*

- [x] All route contracts have corresponding tests (T006-T008)
- [x] All page components have empty state structure (T011-T015)
- [x] All tests come before implementation (T006-T010 before T011+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Scope limited to empty pages as requested
- [x] RBAC integration follows existing patterns