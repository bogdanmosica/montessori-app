# Tasks: Lessons Management Feature

## Constitution Gate Validation
- All constitutional gates (micro function, client directive, component reuse, multi-tenant security, database efficiency, no hardcoding, specification-first) are validated by manual review tasks (T016-T018, T014-T015, T002, T001).
- Dedicated test tasks for RBAC and multi-tenant security are omitted for initial rollout per user instruction. Manual review and proven module reuse are relied on for compliance.

## Parallel Execution Guidance
- [P] = Can be executed in parallel with other [P] tasks
- Sequential tasks must be completed in order

## Numbered, Ordered Tasks

### Setup
- [X] T001. Audit existing lessons module and components in `components/`, `app/[role]/lessons/components/`, and `ui/` for reuse opportunities
- [X] T002. Add/extend lesson category and visibility enums/constants in shared config (if needed)
- [X] T003. Ensure Drizzle ORM and Auth.js are configured for lessons endpoints

### Models & Data
- [X] T004 [P]. Create/extend `Lesson` model in Drizzle ORM per data-model.md
- [X] T005 [P]. Create/extend `User` and `School` models if new fields required

### API Endpoints
- [X] T006. Implement/extend `/api/lessons` GET endpoint with role-based filtering and category/search support
- [X] T007. Implement/extend `/api/lessons` POST endpoint for lesson creation (Admin/Teacher)
- [X] T008. Implement/extend `/api/lessons/{id}` GET endpoint for lesson details
- [X] T009. Implement/extend `/api/lessons/{id}` PUT endpoint for lesson editing (Admin/Teacher, RBAC enforced)
- [X] T010. Implement/extend `/api/lessons/{id}` DELETE endpoint for lesson deletion (Admin/Teacher, RBAC enforced)

### UI Components
- [X] T011 [P]. Reuse/extend `LessonsTable.tsx` for list view in `app/[role]/lessons/components/`
- [X] T012 [P]. Reuse/extend `LessonForm.tsx` for add/edit in `app/[role]/lessons/components/`
- [X] T013 [P]. Reuse/extend `LessonsFilter.tsx` for search/filter in `app/[role]/lessons/components/`

### Integration & Security
- [X] T014. Enforce RBAC and multi-tenant scoping in all backend logic and endpoints
- [X] T015. Log all lesson actions to `access_logs` for audit compliance

### Polish
- [X] T016 [P]. Review for micro function and small file compliance
- [X] T017 [P]. Review for no hardcoded strings; all enums/constants used
- [X] T018 [P]. Review UI for consistent use of shadcn/ui and Tailwind

## Dependency Notes
- Setup tasks (T001-T003) must be completed before model, API, and UI work
- Model tasks (T004-T005) can run in parallel
- API endpoint tasks (T006-T010) depend on models
- UI component tasks (T011-T013) can run in parallel after models
- Integration/security (T014-T015) depend on API and UI
- Polish tasks (T016-T018) can run in parallel at the end

## Skipped
- Dedicated testing phase and test tasks (per user instruction)
