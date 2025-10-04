# Tasks: Teacher Management Page

**Input**: Design documents from `/specs/016-build-the-teacher/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Found: TypeScript with Next.js 15, shadcn/ui, Drizzle ORM
   → Structure: Next.js application with admin module
2. Load optional design documents:
   → data-model.md: Teachers and teacher_students entities
   → contracts/: 8 API endpoints for teacher management
   → research.md: Database schema and component architecture decisions
3. Generate tasks by category:
   → Setup: database migrations, schema validation
   → Core: models, services, API routes
   → UI: components and pages
   → Integration: connect all layers
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Skip test tasks per user request
5. Number tasks sequentially (T001, T002...)
6. Focus on implementation compliance with existing codebase
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- **Note**: Testing tasks skipped per user request

## Phase 3.1: Database Setup
- [X] T001 Create database migration for teachers table in drizzle/0012_add_teachers_table.sql
- [X] T002 Create database migration for teacher_students table in drizzle/0013_add_teacher_students_table.sql
- [X] T003 [P] Add teachers schema definition in lib/db/schema/teachers.ts
- [X] T004 [P] Add teacher_students schema definition in lib/db/schema/teacher-students.ts
- [X] T005 Update database index exports in lib/db/schema/index.ts

## Phase 3.2: Core Data Layer
- [X] T006 [P] Create teacher service functions in lib/services/teacher-service.ts
- [X] T007 [P] Create teacher-student assignment service in lib/services/teacher-assignment-service.ts
- [X] T008 [P] Create teacher validation schemas with Zod in lib/validations/teacher-schemas.ts
- [X] T009 [P] Add teacher-related constants and enums in lib/constants/teacher-constants.ts

## Phase 3.3: API Routes Implementation
- [X] T010 GET /api/admin/teachers route handler in app/api/admin/teachers/route.ts
- [X] T011 POST /api/admin/teachers route handler (same file as T010, not parallel)
- [X] T012 [P] GET /api/admin/teachers/[id] route handler in app/api/admin/teachers/[id]/route.ts
- [X] T013 PUT /api/admin/teachers/[id] route handler (same file as T012, not parallel)
- [X] T014 DELETE /api/admin/teachers/[id] route handler (same file as T012, not parallel)
- [X] T015 [P] GET /api/admin/students/available route handler in app/api/admin/students/available/route.ts
- [X] T016 [P] POST /api/admin/teachers/[id]/assignments route handler in app/api/admin/teachers/[id]/assignments/route.ts
- [X] T017 DELETE assignment route handler in app/api/admin/teachers/[teacherId]/assignments/[studentId]/route.ts

## Phase 3.4: UI Components (Server-first)
- [X] T018 [P] Teachers list server component in app/admin/teachers/components/TeacherList.tsx
- [X] T019 [P] Teacher form client component in app/admin/teachers/components/TeacherForm.tsx
- [X] T020 [P] Student assignment client component in app/admin/teachers/components/StudentAssignmentForm.tsx
- [X] T021 [P] Teacher actions client component in app/admin/teachers/components/TeacherActions.tsx
- [X] T022 [P] Teacher status indicator component in app/admin/teachers/components/TeacherStatusBadge.tsx

## Phase 3.5: Pages and Layout
- [X] T023 Teachers main page in app/admin/teachers/page.tsx
- [X] T024 [P] Teacher detail page in app/admin/teachers/[id]/page.tsx
- [X] T025 [P] Teacher edit page in app/admin/teachers/[id]/edit/page.tsx
- [X] T026 [P] Add teacher page in app/admin/teachers/add/page.tsx

## Phase 3.6: Server Actions and Client Integration
- [X] T027 [P] Teacher server actions in app/admin/teachers/actions.ts (handled via API routes)
- [X] T028 [P] Student assignment server actions in app/admin/teachers/assignment-actions.ts (handled via API routes)
- [X] T029 Add teacher management navigation links in app/admin/layout.tsx or navigation component

## Phase 3.7: Integration and Polish
- [X] T030 Verify multi-tenant scoping in all teacher queries
- [X] T031 Implement access logging for teacher management actions
- [X] T032 [P] Add teacher-related error handling and validation
- [X] T033 [P] Update TypeScript types and interfaces in lib/types/teacher-types.ts
- [X] T034 [P] Add teacher management to RBAC middleware configuration
- [X] T035 Verify soft delete functionality preserves student assignments

## Dependencies
- Database setup (T001-T005) before service layer (T006-T009)
- Service layer before API routes (T010-T017)
- API routes before UI components (T018-T022)
- Components before pages (T023-T026)
- Server actions (T027-T028) can be parallel with pages
- Integration tasks (T030-T035) after core implementation

## Parallel Example
```
# Launch T003-T004 together (different schema files):
Task: "Add teachers schema definition in lib/db/schema/teachers.ts"
Task: "Add teacher_students schema definition in lib/db/schema/teacher-students.ts"

# Launch T006-T009 together (different service/validation files):
Task: "Create teacher service functions in lib/services/teacher-service.ts"
Task: "Create teacher-student assignment service in lib/services/teacher-assignment-service.ts"
Task: "Create teacher validation schemas with Zod in lib/validations/teacher-schemas.ts"
Task: "Add teacher-related constants and enums in lib/constants/teacher-constants.ts"

# Launch T018-T022 together (different component files):
Task: "Teachers list server component in app/admin/teachers/components/TeacherList.tsx"
Task: "Teacher form client component in app/admin/teachers/components/TeacherForm.tsx"
Task: "Student assignment client component in app/admin/teachers/components/StudentAssignmentForm.tsx"
Task: "Teacher actions client component in app/admin/teachers/components/TeacherActions.tsx"
Task: "Teacher status indicator component in app/admin/teachers/components/TeacherStatusBadge.tsx"
```

## Key Implementation Notes
- **Multi-tenant Security**: All queries must include school/tenant scoping
- **Soft Deletion**: Use isActive flag, preserve student assignments
- **Co-teaching Support**: Many-to-many teacher-student relationships
- **Silent Account Creation**: No invitation emails sent
- **Status Indicators**: Clear visual distinction for inactive teachers
- **Constitutional Compliance**: Micro functions, server-first components, no hardcoding

## Task Generation Rules Applied
*Based on available design documents*

1. **From Data Model**:
   - Teachers entity → schema and service tasks
   - Teacher_students entity → assignment service tasks
   
2. **From Contracts**:
   - 8 API endpoints → 8 route implementation tasks
   - CRUD operations → separate tasks for each HTTP method
   
3. **From Research Decisions**:
   - Component architecture → scoped component tasks
   - Database strategy → migration and schema tasks

4. **User Context**:
   - Page already implemented → focus on specification compliance
   - Skip testing tasks → no test generation
   - Implementation-focused → practical development tasks

## Validation Checklist
*Implementation compliance verification*

- [ ] All database entities have corresponding schema files
- [ ] All API endpoints have route handlers
- [ ] All components follow server-first architecture
- [ ] Multi-tenant security implemented in all queries
- [ ] Soft deletion preserves data relationships
- [ ] RBAC enforcement at multiple levels
- [ ] Constitutional compliance in all tasks