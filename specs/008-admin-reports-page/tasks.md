# Tasks: Admin Reports Page

**Input**: Design documents from `/specs/008-admin-reports-page/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Found: Next.js 15.4 App Router with TypeScript, Drizzle ORM, PostgreSQL
   → Extract: tech stack includes shadcn/ui, Tailwind CSS, Auth.js
2. Load optional design documents:
   → data-model.md: Extract entities for report structures
   → contracts/: reports-api.yaml → 4 API endpoints for report generation
   → research.md: Extract decisions about synchronous generation, PDF/CSV export
3. Generate tasks by category:
   → Setup: dependencies for PDF generation, report utilities
   → Core: report data models, service functions, API endpoints
   → UI: admin reports page, filter forms, export functionality
   → Integration: RBAC enforcement, tenant scoping, audit logging
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Implementation tasks only (no tests per user request)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have implementations
   → All entities have models
   → All UI components covered
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js app**: `app/`, `components/`, `lib/` at repository root
- **Admin routes**: `app/admin/reports/` for admin reports feature
- **Shared UI**: `components/ui/` for shadcn/ui components
- **Backend logic**: `lib/` for database, services, and business logic
- **API routes**: `app/api/admin/reports/` for report generation endpoints

## Phase 3.1: Setup & Dependencies
- [X] T001 [P] Install PDF generation dependencies (jspdf, html2canvas) and update package.json
- [X] T002 [P] Create report constants and enums in lib/constants/report-constants.ts
- [X] T003 [P] Create report type definitions in lib/types/report-types.ts

## Phase 3.2: Data Models & Services
- [X] T004 [P] Create application status enum in lib/constants/application-status.ts (supports FR-005, FR-009)
- [X] T005 [P] Create enrollment status enum in lib/constants/enrollment-status.ts (supports FR-005, FR-009)
- [X] T006 [P] Create payment status enum in lib/constants/payment-status.ts (supports FR-005, FR-009)
- [X] T007 [P] Create activity type enum in lib/constants/activity-types.ts (supports FR-005, FR-009)
- [X] T008 [P] Report filter validation schemas in lib/validations/report-filters.ts (supports FR-004, FR-005 date/status filtering)
- [X] T009 [P] Applications report service in lib/services/reports/applications-report-service.ts
- [X] T010 [P] Enrollments report service in lib/services/reports/enrollments-report-service.ts
- [X] T011 [P] Payments report service in lib/services/reports/payments-report-service.ts
- [X] T012 [P] Activity report service in lib/services/reports/activity-report-service.ts
- [X] T013 [P] CSV export utility service in lib/services/export/csv-export-service.ts
- [X] T014 [P] PDF export utility service in lib/services/export/pdf-export-service.ts

## Phase 3.3: API Route Handlers
- [X] T015 Applications report API route in app/api/admin/reports/applications/route.ts (implement 400/401/500 error handling per contracts)
- [X] T016 Enrollments report API route in app/api/admin/reports/enrollments/route.ts (implement 400/401/500 error handling per contracts)
- [X] T017 Payments report API route in app/api/admin/reports/payments/route.ts (implement 400/401/500 error handling per contracts)
- [X] T018 Activity report API route in app/api/admin/reports/activity/route.ts (implement 400/401/500 error handling per contracts)

## Phase 3.4: UI Components (Server-first)
- [X] T019 [P] Report type selector component in app/admin/reports/components/report-type-selector.tsx
- [X] T020 [P] Date range filter component in app/admin/reports/components/date-range-filter.tsx
- [X] T021 [P] Status filter component in app/admin/reports/components/status-filter.tsx
- [X] T022 [P] Export buttons component in app/admin/reports/components/export-buttons.tsx
- [X] T023 [P] Applications report table in app/admin/reports/components/applications-report-table.tsx
- [X] T024 [P] Enrollments report table in app/admin/reports/components/enrollments-report-table.tsx
- [X] T025 [P] Payments report table in app/admin/reports/components/payments-report-table.tsx
- [ ] T026 [P] Activity report table in app/admin/reports/components/activity-report-table.tsx
- [ ] T027 [P] Report summary metrics component in app/admin/reports/components/report-summary-metrics.tsx
- [X] T028 [P] Loading state component in app/admin/reports/components/report-loading-state.tsx
- [X] T029 [P] Empty state component in app/admin/reports/components/report-empty-state.tsx

## Phase 3.5: Main Page Implementation
- [X] T030 Admin reports main page in app/admin/reports/page.tsx
- [ ] T031 Admin reports layout with navigation in app/admin/reports/layout.tsx

## Phase 3.6: Security & Integration
- [ ] T032 [P] RBAC middleware for admin reports in lib/auth/admin-reports-middleware.ts
- [ ] T033 [P] Tenant scoping utilities for report queries in lib/db/tenant-scoped-reports.ts
- [ ] T034 [P] Audit logging for report generation in lib/services/audit/report-audit-service.ts
- [ ] T035 Update main admin navigation to include reports link in app/admin/layout.tsx

## Phase 3.7: Polish & Optimization
- [ ] T036 [P] Report error boundary component in app/admin/reports/components/report-error-boundary.tsx
- [ ] T037 [P] Performance optimization for large report queries in lib/services/reports/report-performance-optimizations.ts
- [ ] T038 [P] Report generation rate limiting in lib/auth/report-rate-limiter.ts

## Dependencies

**Sequential Dependencies**:
- Setup (T001-T003) must complete before services (T009-T014)
- Services (T009-T014) must complete before API routes (T015-T018)  
- API routes (T015-T018) must complete before main page (T030)
- Security middleware (T032) must complete before page integration (T030-T031)

**Parallel Groups**:
- Constants and enums (T004-T007) can run in parallel
- Report services (T009-T012) can run in parallel after T008
- Export services (T013-T014) can run in parallel with report services
- UI components (T019-T029) can run in parallel after API routes complete
- Security tasks (T032-T034) can run in parallel
- Polish tasks (T036-T038) can run in parallel

## Parallel Execution Examples

### Phase 3.2 - Service Layer (After T008 completes)
```
Task: "Applications report service in lib/services/reports/applications-report-service.ts"
Task: "Enrollments report service in lib/services/reports/enrollments-report-service.ts"
Task: "Payments report service in lib/services/reports/payments-report-service.ts"
Task: "Activity report service in lib/services/reports/activity-report-service.ts"
Task: "CSV export utility service in lib/services/export/csv-export-service.ts"
Task: "PDF export utility service in lib/services/export/pdf-export-service.ts"
```

### Phase 3.4 - UI Components (After T018 completes)
```
Task: "Report type selector component in app/admin/reports/components/report-type-selector.tsx"
Task: "Date range filter component in app/admin/reports/components/date-range-filter.tsx"
Task: "Status filter component in app/admin/reports/components/status-filter.tsx"
Task: "Export buttons component in app/admin/reports/components/export-buttons.tsx"
Task: "Applications report table in app/admin/reports/components/applications-report-table.tsx"
Task: "Enrollments report table in app/admin/reports/components/enrollments-report-table.tsx"
Task: "Payments report table in app/admin/reports/components/payments-report-table.tsx"
Task: "Activity report table in app/admin/reports/components/activity-report-table.tsx"
```

### Phase 3.6 - Security Integration (After T031 completes)
```
Task: "RBAC middleware for admin reports in lib/auth/admin-reports-middleware.ts"
Task: "Tenant scoping utilities for report queries in lib/db/tenant-scoped-reports.ts"
Task: "Audit logging for report generation in lib/services/audit/report-audit-service.ts"
```

## Key Implementation Notes

### Report Generation Strategy
- All reports generated synchronously with loading indicators
- No report persistence - fresh data on each request
- Full PII included per clarification decisions
- Multi-tenant scoped queries for data security

### Export Functionality  
- Both CSV and PDF formats required per specifications
- Server-side generation using jspdf for PDFs
- Proper file naming with timestamps
- UTF-8 encoding for CSV with Excel compatibility

### Security Requirements
- Admin-only access enforced at multiple layers
- All database queries must be tenant-scoped
- Report generation activity logged for audit trails
- Input validation on all filter parameters

### Performance Considerations
- Synchronous generation with 2-second target response time
- Database query optimization with proper indexes
- Memory management for large result sets
- Rate limiting to prevent abuse

### UI/UX Requirements
- Server components for data fetching where possible
- Client components only for interactive elements (filters, exports)
- shadcn/ui components for consistent styling
- Responsive design for mobile access
- Loading states and error boundaries throughout

## Constitutional Compliance
- ✅ Micro functions: Each service handles single responsibility
- ✅ Client directive: Used only on interactive components
- ✅ Component reuse: Leverages existing shadcn/ui components
- ✅ Multi-tenant security: All queries tenant-scoped
- ✅ Database efficiency: Drizzle ORM with optimized queries
- ✅ No hardcoding: All values use constants and enums
- ✅ Specification-first: Implementation follows approved design

## Task Validation Checklist
*GATE: All items must be checked before execution*

- [x] All API endpoints from contracts have implementation tasks
- [x] All report types have dedicated service tasks  
- [x] All UI components have specific file path tasks
- [x] Security requirements addressed in dedicated tasks
- [x] Export functionality covered for both CSV and PDF
- [x] Performance optimization tasks included
- [x] No test tasks included per user request
- [x] Parallel tasks operate on different files
- [x] Dependencies properly sequenced
- [x] Each task includes exact file path
- [x] Constitutional compliance addressed throughout