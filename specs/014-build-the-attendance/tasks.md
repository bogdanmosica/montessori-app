# Tasks: Attendance & Daily Logs for Teachers

**Input**: Design documents from `/specs/014-build-the-attendance/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/api-attendance.md, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Found: Next.js 15, TypeScript, Drizzle ORM, shadcn/ui
   → Extract: tech stack, libraries, Teacher module integration
2. Load design documents:
   → data-model.md: Attendance entity with co-teaching consensus workflow
   → contracts/api-attendance.md: 4 REST endpoints for CRUD operations
   → quickstart.md: Manual QA scenarios (automated tests skipped per user request)
3. Generate tasks by category:
   → Setup: Database schema, types, enums
   → Core: API endpoints, services, business logic
   → UI: Server components, client components, forms
   → Integration: Navigation, middleware, routing
   → Polish: Manual validation scenarios
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Constitutional compliance markers included
5. Number tasks sequentially (T001, T002...)
6. Manual QA validation approach (no automated tests per user request)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Constitutional compliance markers: 🔒 Security, 🔧 Micro Functions, 🎨 UI Consistency

## Phase 3.1: Database & Schema Setup
- [X] T001 [P] 🔒 Create attendance table migration in `drizzle/0009_add_attendance_table.sql`
- [X] T002 [P] Create attendance status enum in `lib/constants/attendance-status.ts`
- [X] T003 [P] Add attendance schema to Drizzle in `lib/db/schema/attendance.ts`
- [X] T004 [P] Create attendance TypeScript types in `lib/types/attendance.ts`

## Phase 3.2: API Layer (Backend Services)
- [X] T005 [P] 🔧 Attendance service functions in `lib/services/attendance-service.ts`
- [X] T006 [P] 🔒 Co-teaching consensus logic in `lib/services/consensus-service.ts`
- [X] T007 [P] 🔧 Student roster service integration in `lib/services/roster-service.ts`
- [X] T008 [P] Attendance validation schemas in `lib/validations/attendance-validation.ts`

## Phase 3.3: API Routes (REST Endpoints)
- [X] T009 GET /api/teacher/attendance route in `app/api/teacher/attendance/route.ts`
- [X] T010 POST /api/teacher/attendance route in `app/api/teacher/attendance/route.ts`
- [X] T011 PUT /api/teacher/attendance/[id] route in `app/api/teacher/attendance/[id]/route.ts`
- [X] T012 DELETE /api/teacher/attendance/[id] route in `app/api/teacher/attendance/[id]/route.ts`
- [X] T013 🔒 RBAC middleware integration for attendance routes
- [X] T014 🔒 Tenant scoping validation in attendance API handlers

## Phase 3.4: UI Components (Server-First Architecture)
- [X] T015 [P] 🎨 Attendance page layout in `app/teacher/attendance/page.tsx` (server component)
- [X] T016 [P] 🎨 Student roster table in `app/teacher/attendance/components/AttendanceTable.tsx` (server component)
- [X] T017 [P] 🎨 Attendance toggle component in `app/teacher/attendance/components/AttendanceToggle.tsx` (client component)
- [X] T018 [P] 🎨 Daily notes form in `app/teacher/attendance/components/NotesForm.tsx` (client component)
- [X] T019 [P] 🎨 Empty state component in `app/teacher/attendance/components/EmptyState.tsx` (server component)
- [X] T020 [P] Date picker component in `app/teacher/attendance/components/DatePicker.tsx` (client component)

## Phase 3.5: Business Logic & Utilities
- [X] T021 [P] 🔧 Attendance status utilities in `lib/utils/attendance-utils.ts`
- [X] T022 [P] 🔧 Date formatting utilities in `lib/utils/date-utils.ts`
- [X] T023 [P] 🔒 Access logging for attendance actions in `lib/services/audit-service.ts`
- [X] T024 [P] Error handling utilities in `lib/utils/error-handlers.ts`

## Phase 3.6: Integration & Navigation
- [X] T025 🎨 Add attendance link to teacher navigation in `app/teacher/layout.tsx`
- [X] T026 🔒 Update middleware for attendance route protection in `middleware.ts`
- [X] T027 🔧 Integrate with existing student enrollment service
- [X] T028 🔒 Add tenant scoping to all attendance queries

## Phase 3.7: Manual QA Validation (Per User Request)
**NOTE**: These are manual test scenarios to be executed by the user. Implementation is complete.
See `quickstart.md` for detailed test procedures.

- [ ] T029 Execute Scenario 1: Daily Attendance Flow per quickstart.md
- [ ] T030 Execute Scenario 2: Historical Attendance Entry per quickstart.md
- [ ] T031 Execute Scenario 3: Co-Teaching Consensus per quickstart.md
- [ ] T032 Execute Scenario 4: Empty State Handling per quickstart.md
- [ ] T033 Execute Scenario 5: Error Handling per quickstart.md
- [ ] T034 Performance validation: Large class sizes (30+ students)
- [ ] T035 Security validation: Multi-tenant isolation testing
- [ ] T036 Browser compatibility testing per quickstart.md

## Dependencies
- Database schema (T001-T004) before services (T005-T008)
- Services (T005-T008) before API routes (T009-T014)
- API routes (T009-T014) before UI components (T015-T020)
- Core components before integration (T025-T028)
- Implementation complete before manual validation (T029-T036)

## Parallel Execution Examples

### Phase 3.1 - Database Setup (Launch T001-T004 together):
```bash
# All different files, can run in parallel
Task: "Create attendance table migration in drizzle/0009_add_attendance_table.sql"
Task: "Create attendance status enum in lib/constants/attendance-status.ts"
Task: "Add attendance schema to Drizzle in lib/db/schema/attendance.ts"
Task: "Create attendance TypeScript types in lib/types/attendance.ts"
```

### Phase 3.2 - Services (Launch T005-T008 together):
```bash
# All different service files, can run in parallel
Task: "Attendance service functions in lib/services/attendance-service.ts"
Task: "Co-teaching consensus logic in lib/services/consensus-service.ts"
Task: "Student roster service integration in lib/services/roster-service.ts"
Task: "Attendance validation schemas in lib/validations/attendance-validation.ts"
```

### Phase 3.4 - UI Components (Launch T015-T020 together):
```bash
# All different component files, can run in parallel
Task: "Attendance page layout in app/teacher/attendance/page.tsx"
Task: "Student roster table in app/teacher/attendance/components/AttendanceTable.tsx"
Task: "Attendance toggle component in app/teacher/attendance/components/AttendanceToggle.tsx"
Task: "Daily notes form in app/teacher/attendance/components/NotesForm.tsx"
Task: "Empty state component in app/teacher/attendance/components/EmptyState.tsx"
Task: "Date picker component in app/teacher/attendance/components/DatePicker.tsx"
```

## Constitutional Compliance Markers

### 🔧 Micro Functions & Simplicity
- T002, T005, T006, T007, T021, T022, T024, T027: Small, focused functions
- Each service file contains single-responsibility functions
- Route handlers kept minimal with logic extracted to services

### 🔒 Multi-Tenant Security & RBAC
- T001: Database schema includes tenant_id for multi-tenant scoping
- T013, T014: RBAC enforcement at API level
- T023: Access logging for compliance
- T026, T028: Middleware and query-level tenant scoping
- T035: Security validation testing

### 🎨 Component Reusability & UI Consistency
- T015-T020: shadcn/ui components with consistent styling
- T016, T019: Server components by default
- T017, T018, T020: Client components only where interactivity needed
- T025: Integration with existing navigation patterns

## Task-Specific Implementation Notes

### Database Tasks (T001-T004)
- **T001**: Include indexes for (teacher_id, date) and (student_id, date)
- **T002**: Export const enum, not hardcoded strings
- **T003**: Include proper foreign key relationships and constraints
- **T004**: Type definitions for API contracts and component props

### API Tasks (T009-T014)
- **T009**: GET endpoint with date query parameter, returns roster + attendance
- **T010**: POST endpoint for creating new attendance records
- **T011**: PUT endpoint for updating status and notes
- **T012**: DELETE endpoint for corrections (optional per contract)
- **T013**: Leverage existing teacher RBAC middleware patterns
- **T014**: All queries must include tenant_id filter

### UI Tasks (T015-T020)
- **T015**: Server component for initial data fetching and SEO
- **T016**: Server component displaying student roster with attendance status
- **T017**: Client component for presence/absence toggles with optimistic updates
- **T018**: Client component modal/form for adding daily notes
- **T019**: Server component for when no students assigned
- **T020**: Client component for date selection with URL state management

### Manual QA Tasks (T029-T036)
- Follow quickstart.md scenarios exactly as specified
- Document results and any issues found
- Validate constitutional compliance during testing
- No automated test creation (per user request)

## Validation Checklist
- [x] All contracts have corresponding implementation tasks
- [x] Attendance entity has complete model implementation
- [x] Manual QA scenarios replace automated tests (per user request)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] Constitutional compliance markers included
- [x] Dependencies clearly defined
- [x] Integration with existing Teacher module planned

## Notes
- Manual QA validation approach used instead of automated tests per user specification
- Tasks ordered by dependencies: database → services → API → UI → integration → validation
- All [P] marked tasks can run simultaneously (different files, no shared dependencies) 
- Constitutional compliance built into task design from the start
- Integration tasks ensure seamless fit with existing montessori-app architecture