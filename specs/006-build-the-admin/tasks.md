# Tasks: Admin Enrollments Management

**Input**: Design documents from `/specs/006-build-the-admin/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 15 + React 19 + TypeScript + Drizzle ORM + PostgreSQL
   → Structure: Next.js web application with API routes and scoped components
2. Load design documents:
   → data-model.md: Enrollment and Child entities with status lifecycle
   → contracts/: REST API endpoints for CRUD operations
   → research.md: Status-based soft deletion and multi-tenant scoping decisions
3. Generate tasks by category:
   → Setup: constants, types, database schema
   → Core: models, services, API routes
   → UI: components with server-first architecture
   → Integration: admin access, tenant scoping, data synchronization
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Database before services before API routes before UI
   → Constants before everything else
5. Number tasks sequentially (T001, T002...)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Constants

- [X] T001 [P] Create enrollment status enum in `app/admin/enrollments/constants.ts`
- [X] T002 [P] Create TypeScript interfaces for Enrollment and Child in `app/admin/enrollments/types.ts`
- [X] T003 [P] Add enrollment table schema to Drizzle ORM in `lib/db/schema/enrollments.ts`
- [X] T004 [P] Create database migration for enrollment table with indexes and constraints

## Phase 3.2: Core Data Layer

- [X] T005 [P] Create enrollment service functions in `lib/services/enrollment-service.ts`
- [X] T006 [P] Create child service functions for enrollment integration in `lib/services/child-service.ts`
- [X] T007 [P] Create tenant-scoped enrollment queries in `lib/db/queries/enrollment-queries.ts`
- [X] T008 [P] Create validation schemas with Zod in `lib/validations/enrollment-validation.ts`

## Phase 3.3: API Implementation

- [X] T009 GET /api/enrollments route handler in `app/api/enrollments/route.ts`
- [X] T010 POST /api/enrollments route handler in `app/api/enrollments/route.ts`
- [X] T011 PUT /api/enrollments/[id] route handler in `app/api/enrollments/[id]/route.ts`
- [X] T012 DELETE /api/enrollments/[id] route handler in `app/api/enrollments/[id]/route.ts`

## Phase 3.4: UI Components (Server-First Architecture)

- [X] T013 [P] Empty state component in `app/admin/enrollments/components/EmptyState.tsx`
- [X] T014 [P] Enrollment row actions component in `app/admin/enrollments/components/EnrollmentActions.tsx`
- [X] T015 [P] Search and filter controls in `app/admin/enrollments/components/EnrollmentFilters.tsx`
- [X] T016 Enrollment table server component in `app/admin/enrollments/components/EnrollmentsTable.tsx`
- [X] T017 Enrollment form component in `app/admin/enrollments/components/EnrollmentForm.tsx`
- [X] T018 Child form section component in `app/admin/enrollments/components/ChildFormSection.tsx`

## Phase 3.5: Page Implementation

- [X] T019 Admin enrollments main page in `app/admin/enrollments/page.tsx`
- [X] T020 New enrollment page in `app/admin/enrollments/new/page.tsx`
- [X] T021 Edit enrollment page in `app/admin/enrollments/[id]/edit/page.tsx`

## Phase 3.6: Integration & Security

- [ ] T022 Add admin-only middleware for enrollment routes in `middleware.ts`
- [ ] T023 Implement tenant scoping for all enrollment queries
- [ ] T024 Add access logging for enrollment actions in `lib/services/access-log-service.ts`
- [ ] T025 Connect enrollment form to API with error handling
- [ ] T026 Implement automatic archiving of related records on withdrawal

## Phase 3.7: Polish & Optimization

- [ ] T027 [P] Add loading states and error boundaries to components
- [ ] T028 [P] Implement pagination for enrollment list
- [ ] T029 [P] Add confirmation dialogs for destructive actions
- [ ] T030 [P] Optimize database queries with proper joins and indexes
- [ ] T031 [P] Add form validation and user feedback messages

## Dependencies

**Critical Dependencies**:
- Constants (T001-T002) before all other tasks
- Database schema (T003-T004) before services (T005-T008)
- Services before API routes (T009-T012)
- API routes before UI components that use them (T016-T017)
- Server components (T013-T016) before client form components (T017-T018)
- Components before pages (T019-T021)
- Core implementation before security integration (T022-T026)

**No Dependencies (Can Run in Parallel)**:
- All tasks marked [P] within same phase
- Setup tasks (T001-T004) can run together
- Service layer tasks (T005-T008) can run together  
- UI component tasks (T013-T015) can run together
- Polish tasks (T027-T031) can run together

## Parallel Execution Examples

### Phase 3.1 - Setup (All Parallel)
```bash
# Launch T001-T004 together (different files):
Task: "Create enrollment status enum in app/admin/enrollments/constants.ts"
Task: "Create TypeScript interfaces in app/admin/enrollments/types.ts"
Task: "Add enrollment table schema in lib/db/schema/enrollments.ts"
Task: "Create database migration for enrollment table"
```

### Phase 3.2 - Services (All Parallel)
```bash
# Launch T005-T008 together (different files):
Task: "Create enrollment service functions in lib/services/enrollment-service.ts"
Task: "Create child service functions in lib/services/child-service.ts"
Task: "Create tenant-scoped queries in lib/db/queries/enrollment-queries.ts"
Task: "Create validation schemas in lib/validations/enrollment-validation.ts"
```

### Phase 3.4 - UI Components (Selected Parallel)
```bash
# Launch T013-T015 together (independent components):
Task: "Empty state component in app/admin/enrollments/components/EmptyState.tsx"
Task: "Enrollment actions component in app/admin/enrollments/components/EnrollmentActions.tsx"  
Task: "Search and filter controls in app/admin/enrollments/components/EnrollmentFilters.tsx"
```

## Implementation Notes

**Constitutional Compliance**:
- All functions kept small and focused (Micro Function Gate)
- `use client` only on interactive components requiring it (Client Directive Gate)
- Reuse existing shadcn/ui components from `components/ui/` (Component Reuse Gate)
- All queries include school_id scoping (Multi-Tenant Security Gate)
- Use joins to prevent N+1 queries (Database Efficiency Gate)
- All strings/statuses use constants from T001 (No Hardcoding Gate)

**File Organization**:
- Components scoped under `app/admin/enrollments/components/`
- Services in `lib/services/` for business logic
- Database queries in `lib/db/queries/` for data access
- API routes follow Next.js App Router structure
- Types and constants co-located with feature

**Security Implementation**:
- Admin role verification in middleware and API routes
- Tenant scoping applied to all database operations
- Access logging for audit trail compliance
- Input validation with Zod schemas

**Performance Considerations**:
- Database joins to fetch enrollment + child data together
- Proper indexing on school_id + status + enrollment_date
- Pagination for large datasets
- Server-first rendering for better performance

## Task Details

### T001: Create enrollment status enum
**File**: `app/admin/enrollments/constants.ts`
**Content**: Define EnrollmentStatus enum ('active', 'inactive', 'withdrawn', 'archived') and any other constants

### T003: Add enrollment table schema  
**File**: `lib/db/schema/enrollments.ts`
**Content**: Drizzle schema with all fields, foreign keys, indexes, and unique constraints per data model

### T009: GET /api/enrollments route
**Features**: List with filtering (status), search (child/parent name), pagination, tenant scoping

### T016: Enrollment table component
**Features**: Server component with enrollment list, integrated search/filter, actions column

### T017: Enrollment form component
**Features**: Create/edit form with child section, validation, status management

All tasks should be implementable independently within their phase dependencies.