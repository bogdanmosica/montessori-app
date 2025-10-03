# Tasks: Teacher Progress Board

**Input**: Design documents from `/specs/013-teacher-progress-board/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: Next.js 15, React 19, TypeScript, Drizzle ORM, shadcn/ui
   → Structure: Next.js app router with server/client components
2. Load optional design documents:
   → data-model.md: LessonProgress, ProgressColumn entities
   → contracts/: 7 API endpoints for progress board management
   → research.md: React DnD, optimistic updates, database locking
3. Generate tasks by category:
   → Setup: dependencies, database schema, types
   → Core: models, services, API routes
   → UI: server components, drag-and-drop client components
   → Integration: middleware, RBAC, multi-tenant scoping
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Database schema before services before UI
   → API routes after service layer
5. Number tasks sequentially (T001, T002...)
6. Skip testing tasks per user request
7. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Dependencies
- [x] T001 Install React DnD dependencies: `pnpm add react-dnd react-dnd-html5-backend @types/react-dnd`
- [x] T002 [P] Create lesson progress status enum in `lib/constants/lesson-progress.ts`
- [x] T003 [P] Create drag and drop types in `lib/types/progress-board.ts`

## Phase 3.2: Database Schema & Models
- [x] T004 [P] Create LessonProgress schema in `lib/db/schema/lesson-progress.ts`
- [x] T005 [P] Create ProgressColumn schema in `lib/db/schema/progress-columns.ts`
- [x] T006 [P] Extend existing Lesson schema with progress tracking fields in `lib/db/schema/lessons.ts`
- [x] T007 Generate and run database migration for lesson progress tables
- [x] T008 [P] Create seed data script for default progress columns in `scripts/seed/progress-columns.ts`

## Phase 3.3: Service Layer
- [x] T009 [P] Progress board query service in `lib/services/progress-board-service.ts`
- [x] T010 [P] Card locking service with TTL management in `lib/services/card-lock-service.ts`
- [x] T011 [P] Progress card CRUD operations in `lib/services/progress-card-service.ts`
- [x] T012 [P] Batch move operations service in `lib/services/batch-move-service.ts`
- [x] T013 Multi-tenant query helpers for progress data in `lib/db/progress-queries.ts`

## Phase 3.4: API Routes Implementation
- [x] T014 GET /api/teacher/progress-board route in `app/api/teacher/progress-board/route.ts`
- [x] T015 POST /api/teacher/progress-board/cards route in `app/api/teacher/progress-board/cards/route.ts`
- [x] T016 PATCH /api/teacher/progress-board/cards/[id]/move route in `app/api/teacher/progress-board/cards/[id]/move/route.ts`
- [x] T017 POST /api/teacher/progress-board/cards/[id]/lock route in `app/api/teacher/progress-board/cards/[id]/lock/route.ts`
- [x] T018 DELETE /api/teacher/progress-board/cards/[id]/lock route in `app/api/teacher/progress-board/cards/[id]/lock/route.ts`
- [x] T019 POST /api/teacher/progress-board/batch-move route in `app/api/teacher/progress-board/batch-move/route.ts`
- [x] T020 DELETE /api/teacher/progress-board/cards/[id] route in `app/api/teacher/progress-board/cards/[id]/route.ts`

## Phase 3.5: Server Components (Data Loading)
- [x] T021 [P] Progress board server component in `app/teacher/progress-board/components/progress-board-server.tsx`
- [x] T022 [P] Column server component in `app/teacher/progress-board/components/progress-column-server.tsx`
- [x] T023 [P] Card data server component in `app/teacher/progress-board/components/progress-card-server.tsx`
- [x] T024 [P] Filter options server component in `app/teacher/progress-board/components/filter-options-server.tsx`

## Phase 3.6: Client Components (Drag & Drop)
- [x] T025 [P] Draggable progress card client component in `app/teacher/progress-board/components/draggable-card.tsx`
- [x] T026 [P] Droppable column client component in `app/teacher/progress-board/components/droppable-column.tsx`
- [x] T027 [P] Drag and drop context provider in `app/teacher/progress-board/components/dnd-provider.tsx`
- [x] T028 [P] Card lock indicator component in `app/teacher/progress-board/components/card-lock-indicator.tsx`
- [x] T029 [P] Filter controls client component in `app/teacher/progress-board/components/filter-controls.tsx`

## Phase 3.7: Page & Layout Integration
- [x] T030 Teacher progress board main page in `app/teacher/progress-board/page.tsx`
- [x] T031 [P] Empty state component in `app/teacher/progress-board/components/empty-state.tsx`
- [x] T032 [P] Create lesson assignment modal in `app/teacher/progress-board/components/create-assignment-modal.tsx`
- [x] T033a Progress board client component integrating columns and filters in `app/teacher/progress-board/components/progress-board-client.tsx`
- [x] T033b [P] Header controls with filter toggles and create assignment button (integrated in progress-board-client.tsx)

## Phase 3.8: Middleware & Security Integration
- [x] T034 RBAC middleware updates for teacher progress board routes in `middleware.ts`
- [x] T034b [P] Unauthorized access error handling already implemented in middleware
- [x] T035 Multi-tenant data scoping enforcement in progress board services
- [x] T036 Access logging for all progress board operations (via middleware)
- [x] T037 Card lock cleanup job in `lib/jobs/cleanup-expired-locks.ts`
- [x] T037b [P] Timestamp tracking for lesson progress status changes in `lib/services/progress-audit-service.ts`

## Phase 3.9: Performance & Polish
- [x] T038 [P] Optimistic updates implemented in progress-board-client.tsx
- [x] T039 [P] State management with React hooks in progress-board-client.tsx
- [x] T040 Database query optimization and indexing verification (indexes in schema)
- [x] T041 [P] Loading states (loading.tsx) and error boundaries (error.tsx)
- [x] T042 Batch operation support via batch-move API endpoint

## Dependencies
- Setup (T001-T003) before everything else
- Database schema (T004-T008) before services (T009-T013)
- Services before API routes (T014-T020)
- Server components (T021-T024) before client components (T025-T029)
- Core functionality before page integration (T030-T033b)
- Implementation before security integration (T034b-T037b)
- All core features before performance polish (T038-T042)

## Parallel Execution Examples
```
# Phase 3.1: Setup tasks (all independent)
Task: "Create lesson progress status enum in lib/constants/lesson-progress.ts"
Task: "Create drag and drop types in lib/types/progress-board.ts"

# Phase 3.2: Database schema tasks (all different files)
Task: "Create LessonProgress schema in lib/db/schema/lesson-progress.ts"
Task: "Create ProgressColumn schema in lib/db/schema/progress-columns.ts"
Task: "Extend existing Lesson schema in lib/db/schema/lessons.ts"
Task: "Create seed data script in scripts/seed/progress-columns.ts"

# Phase 3.3: Service layer tasks (all different files)
Task: "Progress board query service in lib/services/progress-board-service.ts"
Task: "Card locking service in lib/services/card-lock-service.ts"
Task: "Progress card CRUD operations in lib/services/progress-card-service.ts"
Task: "Batch move operations service in lib/services/batch-move-service.ts"

# Phase 3.5: Server components (all different files)
Task: "Progress board server component in app/teacher/progress-board/components/progress-board-server.tsx"
Task: "Column server component in app/teacher/progress-board/components/progress-column-server.tsx"
Task: "Card data server component in app/teacher/progress-board/components/progress-card-server.tsx"
Task: "Filter options server component in app/teacher/progress-board/components/filter-options-server.tsx"

# Phase 3.6: Client components (all different files)
Task: "Draggable progress card client component in app/teacher/progress-board/components/draggable-card.tsx"
Task: "Droppable column client component in app/teacher/progress-board/components/droppable-column.tsx"
Task: "Drag and drop context provider in app/teacher/progress-board/components/dnd-provider.tsx"
Task: "Card lock indicator component in app/teacher/progress-board/components/card-lock-indicator.tsx"
Task: "Filter controls client component in app/teacher/progress-board/components/filter-controls.tsx"
```

## Notes
- [P] tasks target different files with no shared dependencies
- Skip testing tasks per user request
- Drag & drop components require `use client` directive
- Server components handle data loading and initial rendering
- Multi-tenant security enforced at service and API levels
- Card locking prevents concurrent modification conflicts
- Optimistic updates provide responsive drag-and-drop UX

## Task Generation Summary
*Applied during execution*

**From Data Model**: 
- LessonProgress entity → schema + service tasks
- ProgressColumn entity → schema + service tasks  
- Lesson extensions → schema updates

**From Contracts**:
- 7 API endpoints → 7 route implementation tasks
- Batch operations → specialized service tasks

**From Architecture**:
- React DnD → client component tasks
- Server-first approach → separate server/client components
- Multi-tenant security → middleware and query scoping tasks

**Ordering Logic**:
- Database schema → Services → API routes → Components → Pages
- Server components → Client components → Integration
- Core functionality → Security → Performance optimization

## Validation Checklist
- [x] All entities have schema tasks
- [x] All API endpoints have implementation tasks
- [x] Server components separate from client components
- [x] Parallel tasks target different files
- [x] Dependencies properly ordered
- [x] Each task specifies exact file path
- [x] No testing tasks included per user request

## Implementation Status: ✅ COMPLETE

**Total Tasks**: 42
**Completed**: 42 (100%)
**Status**: Production Ready

All phases successfully implemented:
- ✅ Setup & Dependencies (T001-T003)
- ✅ Database Schema & Models (T004-T008)
- ✅ Service Layer (T009-T013)
- ✅ API Routes (T014-T020)
- ✅ Server Components (T021-T024)
- ✅ Client Components (T025-T029)
- ✅ Page & Layout Integration (T030-T033b)
- ✅ Middleware & Security (T034-T037b)
- ✅ Performance & Polish (T038-T042)

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for complete details.