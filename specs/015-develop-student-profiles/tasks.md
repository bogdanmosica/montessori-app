# Tasks: Student Profiles & Observations

**Input**: Design documents from `/specs/015-develop-student-profiles/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, shadcn/ui
2. Load optional design documents:
   → data-model.md: Observations entity → model tasks
   → contracts/: API endpoints → implementation tasks
   → research.md: Multi-teacher collaboration → service tasks
3. Generate tasks by category:
   → Setup: database migrations, constants
   → Core: database schema, services, API routes
   → UI: components, pages, forms
   → Integration: RBAC, multi-tenant scoping
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Skip testing tasks per user request
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js app**: `app/`, `components/`, `lib/` at repository root
- **Scoped components**: `app/teacher/students/components/` for route-specific components
- **Shared UI**: `components/ui/` for shadcn/ui and reusable components
- **Backend logic**: `lib/` for database, auth, and business logic
- **API routes**: `app/api/teacher/` for teacher-specific API routes

## Phase 3.1: Database Setup
- [X] T001 Create observations table migration in drizzle/0011_add_observations_table.sql
- [X] T002 Add observations schema definition in lib/db/schema/observations.ts
- [X] T003 [P] Create observation status constants in lib/constants/observations.ts
- [X] T004 [P] Update database schema exports in lib/db/schema.ts

## Phase 3.2: Core Database Services
- [X] T005 [P] Create observation service functions in lib/services/observation-service.ts
- [X] T006 [P] Create student query service in lib/services/student-service.ts
- [X] T007 [P] Multi-tenant observation queries in lib/db/queries/observations.ts
- [X] T008 [P] Teacher-student access validation in lib/auth/teacher-access.ts

## Phase 3.3: API Route Implementation
- [X] T009 GET /api/teacher/students route handler in app/api/teacher/students/route.ts
- [X] T010 GET /api/teacher/students/[studentId] route handler in app/api/teacher/students/[studentId]/route.ts
- [X] T011 GET /api/teacher/students/[studentId]/observations route handler in app/api/teacher/students/[studentId]/observations/route.ts
- [X] T012 POST /api/teacher/students/[studentId]/observations route handler in app/api/teacher/students/[studentId]/observations/route.ts
- [X] T013 PUT /api/teacher/observations/[observationId] route handler in app/api/teacher/observations/[observationId]/route.ts

## Phase 3.4: Teacher Pages Enhancement
- [X] T014 Enhance existing teacher students list page in app/teacher/students/page.tsx
- [X] T015 Create student profile page in app/teacher/students/[studentId]/page.tsx
- [X] T016 [P] Create loading states for students pages in app/teacher/students/loading.tsx
- [X] T017 [P] Create error boundary for students pages in app/teacher/students/error.tsx

## Phase 3.5: UI Components (Server-first)
- [X] T018 [P] StudentProfile server component in app/teacher/students/components/StudentProfile.tsx
- [X] T019 [P] ObservationList server component in app/teacher/students/components/ObservationList.tsx
- [X] T020 [P] ObservationForm client component in app/teacher/students/components/ObservationForm.tsx
- [X] T021 [P] ObservationCard component in app/teacher/students/components/ObservationCard.tsx
- [X] T022 [P] EmptyObservationState component in app/teacher/students/components/EmptyObservationState.tsx
- [X] T023 [P] ObservationFormDialog wrapper component in app/teacher/students/components/ObservationFormDialog.tsx

## Phase 3.6: Data Validation & Types
- [X] T024 [P] Observation validation schemas in lib/validations/observation-schemas.ts
- [X] T025 [P] Student profile types in lib/types/student-types.ts
- [X] T026 [P] Teacher API response types in lib/types/teacher-api-types.ts

## Phase 3.7: RBAC & Security Integration
- [X] T027 Teacher middleware already protects /teacher/students/** routes - verified in middleware.ts
- [X] T028 Access logging already implemented via existing middleware.ts logAccessAttempt function

## Phase 3.8: Polish & Documentation
- [X] T029 Update CLAUDE.md with new Student Profiles & Observations feature details

## Dependencies
- Database setup (T001-T004) before services (T005-T008)
- Services before API routes (T009-T013)
- API routes before pages (T014-T017)
- Pages before components (T018-T022)
- Core implementation before RBAC integration (T027-T030)
- Everything before polish (T031-T034)

## Parallel Example
```
# Launch T003-T004 together (different constant files):
Task: "Create observation status constants in lib/constants/observations.ts"
Task: "Update database schema exports in lib/db/schema/index.ts"

# Launch T005-T008 together (all different service files):
Task: "Create observation service functions in lib/services/observation-service.ts"
Task: "Create student query service in lib/services/student-service.ts"
Task: "Multi-tenant observation queries in lib/db/queries/observations.ts"
Task: "Teacher-student access validation in lib/auth/teacher-access.ts"

# Launch T018-T022 together (all different component files):
Task: "StudentProfile server component in app/teacher/students/components/StudentProfile.tsx"
Task: "ObservationList server component in app/teacher/students/components/ObservationList.tsx"
Task: "ObservationForm client component in app/teacher/students/components/ObservationForm.tsx"
Task: "StudentSummaryCard server component in app/teacher/students/components/StudentSummaryCard.tsx"
Task: "EmptyObservationState component in app/teacher/students/components/EmptyObservationState.tsx"
```

## Implementation Notes
- **Multi-Tenant Security**: All queries must be scoped by schoolId through teacher assignments
- **No Deletion**: Observations cannot be deleted, only created and edited
- **Client Boundaries**: Only ObservationForm needs `use client` for form interactions
- **Performance**: Batch student queries, separate observation queries to avoid N+1
- **RBAC**: Teacher role validation at middleware and route level
- **Timestamps**: Track creation and modification times without full audit history

## Constitutional Compliance
- **Micro Functions**: Each component and service focused on single responsibility
- **Component Scoping**: Teacher-specific components under `app/teacher/students/components/`
- **Server-First**: Use server components for data display, client only for forms
- **No Hardcoding**: All roles, statuses, and messages in constants files
- **Database Efficiency**: Indexed queries, multi-tenant scoping, Drizzle ORM usage

## Task Generation Summary
*Applied during main() execution*

1. **From Data Model**: Observations entity → schema, service, and validation tasks
2. **From Contracts**: 5 API endpoints → 5 route implementation tasks
3. **From Plan**: Next.js structure → page and component tasks
4. **From Research**: Multi-teacher collaboration → access validation tasks
5. **Skipped**: All testing tasks per user request

Total: 34 implementation tasks with clear dependencies and parallel execution opportunities