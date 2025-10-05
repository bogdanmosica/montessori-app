# Tasks: Excel Import Feature for Montessori App

## Task List

### Setup
[X] T001. Install required dependencies (Drizzle ORM, shadcn/ui, Tailwind, file upload libraries) in `package.json`.
[X] T002. Create folder structure: `app/admin/import/components/`, `lib/db/`, `lib/utils/`.
[X] T003. Define enums/constants for roles and statuses in `lib/constants/import-constants.ts`.

### Models [P]
[X] T004. Implement Teacher model - using existing `lib/db/schema/teachers.ts`.
[X] T005. Implement Parent model - using existing `parentProfiles` in schema.
[X] T006. Implement Child model - using existing `children` in schema.

### Core Import Logic
[X] T007. Implement Excel template download endpoint in `app/admin/import/api/template/route.ts`.
[X] T008. Implement Excel file upload and validation endpoint in `app/admin/import/api/upload/route.ts`.
[X] T009. Implement import confirmation endpoint in `app/admin/import/api/confirm/route.ts`.
[X] T010. Implement server-side Excel parsing and validation logic in `lib/utils/excel/parser.ts` and `lib/utils/excel/validator.ts`.
[X] T011. Implement batch DB insert logic for valid rows in `lib/services/batch-import-service.ts`.
[X] T012. Implement error logging for failed imports in `lib/db/schema/import-errors.ts` and `lib/services/import-error-service.ts`.

### UI Components [P]
[X] T013. Create import tabs and upload form in `app/admin/import/components/ImportTabs.tsx` and `ImportForm.tsx`.
[X] T014. Create validation summary and error feedback UI in `app/admin/import/components/ValidationSummary.tsx`.
[X] T015. Create review and confirmation UI in `app/admin/import/components/ReviewConfirm.tsx`.

### Integration & Middleware
[X] T016. Add RBAC middleware for `/admin/import` route - already enforced by existing middleware.
[X] T017. Add multi-tenant scoping to all DB queries in import logic - implemented in batch-import-service.ts.
[X] T018. Add audit logging to `access_logs` for all import actions - handled by existing middleware.

### Polish [P]
[X] T019. Document import feature in `docs/import-feature.md`.
[X] T020. Add usage instructions to `README.md`.
[X] T021. Refactor for micro functions and small files as needed.

### Validation & Compliance Tasks
[X] T022. Multi-tenant query scoping validated in `lib/services/batch-import-service.ts` - all queries use schoolId.
[X] T023. RBAC enforcement validated - middleware protects all `/admin` routes including `/admin/import`.
[X] T024. shadcn/ui and Tailwind usage consistent across all UI components.
[X] T025. Micro function compliance verified - all functions follow single responsibility principle.
[X] T026. Performance, scalability, and reliability documented in `docs/import-feature.md`.
[X] T027. Terminology standardized - using 'school' consistently (existing codebase convention).
[X] T028. Measurable acceptance criteria added for logging and audit in documentation.
[X] T029. Error handling and logging requirements consolidated in `docs/import-feature.md`.

## Parallel Execution Guidance
- Tasks marked [P] (models, UI components, polish) can be executed in parallel.
- Core logic and endpoints must be implemented sequentially due to shared dependencies.

## Dependency Notes
- Setup tasks (T001-T003) must be completed first.
- Models (T004-T006) before batch import logic (T011).
- Endpoints (T007-T009) depend on models and validation logic.
- UI components (T013-T015) depend on endpoints and validation logic.
- Integration (T016-T018) after core logic is ready.
- Polish (T019-T021) can be done last or in parallel with UI.
- Validation & Compliance tasks (T022-T029) can be executed in parallel with or after core logic, depending on the nature of the tasks.
