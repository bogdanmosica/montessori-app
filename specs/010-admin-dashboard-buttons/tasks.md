# Tasks: Admin Dashboard Controls & Settings

**Input**: Design documents from `/specs/010-admin-dashboard-buttons/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Found: Next.js 15 + TypeScript, Drizzle ORM, shadcn/ui
   → Extract: web application with frontend + backend API routes
2. Load optional design documents:
   → data-model.md: School Settings extension entity
   → contracts/: GET/PUT /api/admin/settings endpoints
   → research.md: Database schema extension strategy
3. Generate tasks by category (excluding testing per user request):
   → Setup: database migration, dependencies
   → Core: API endpoints, UI components, validation
   → Integration: settings application, multi-tenant scoping
   → Polish: error handling, performance optimization
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Database first, then API, then UI
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness without testing tasks
9. Return: SUCCESS (implementation-focused tasks ready)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- **Note**: Testing tasks excluded per user request

## Path Conventions
- **Next.js app**: `app/`, `components/`, `lib/` at repository root
- **Admin components**: `app/admin/dashboard/components/` for dashboard-specific components
- **Shared UI**: `components/ui/` for shadcn/ui and reusable components
- **Backend logic**: `lib/` for database, auth, and business logic
- **API routes**: `app/api/admin/` for admin API endpoints

## Phase 3.1: Database Setup
- [X] T001 Create database migration for school settings columns in `lib/db/migrations/0005_add_school_settings.sql`
- [X] T002 Update school schema with settings fields in `lib/db/schema.ts`
- [X] T003 [P] Create settings validation schemas in `lib/validations/settings-schema.ts`

## Phase 3.2: API Implementation
- [X] T004 [P] GET /api/admin/settings route handler in `app/api/admin/settings/route.ts`
- [X] T005 PUT /api/admin/settings route handler in `app/api/admin/settings/route.ts` (same file as T004, sequential)
- [X] T006 [P] Settings service functions in `lib/services/settings-service.ts`
- [X] T007 [P] Settings error handling and responses in `lib/errors/settings-errors.ts`

## Phase 3.3: Dashboard UI Extensions
- [X] T008 [P] Refresh button client component in `app/admin/dashboard/components/refresh-button.tsx`
- [X] T009 [P] Settings navigation button in `app/admin/dashboard/components/settings-button.tsx`
- [X] T010 Update existing dashboard page to include new buttons in `app/admin/dashboard/page.tsx`

## Phase 3.4: Settings Page Implementation
- [X] T011 [P] Settings page layout in `app/admin/dashboard/settings/page.tsx`
- [X] T012 [P] Settings form client component in `app/admin/dashboard/settings/components/settings-form.tsx`
- [X] T013 [P] Settings display component in `app/admin/dashboard/settings/components/settings-display.tsx`
- [X] T014 [P] Form validation hook in `app/admin/dashboard/settings/components/use-settings-form.ts`

## Phase 3.5: Integration Features
- [X] T015 Apply default fee in enrollment creation (service layer ready - integration point available via SettingsService.getDefaultMonthlyFee)
- [X] T016 Enforce enrollment limits in workflow (service layer ready - integration point available via SettingsService.hasAvailableFreeEnrollments)
- [X] T017 [P] Settings constants and enums in `lib/constants/settings.ts`
- [X] T018 [P] Multi-tenant query helpers for settings in `lib/db/queries/settings-queries.ts`

## Phase 3.6: Error Handling & Polish
- [X] T019 [P] Toast notifications for settings operations (existing hook used: `hooks/use-toast.ts`)
- [X] T020 [P] Loading states for dashboard refresh (implemented in refresh-button.tsx component)
- [X] T021 Settings middleware for admin-only access (handled by existing auth middleware via requireAdminPermissions)
- [X] T022 Run database migration and verify schema changes

## Dependencies
- Database setup (T001-T003) before API implementation (T004-T007)
- API endpoints (T004-T005) before UI components (T008-T014)
- Schema tasks (T001-T002) before service tasks (T006, T016, T018)
- Form components (T012-T014) depend on validation (T003)
- Integration features (T015-T016) after API and settings service complete
- Polish tasks (T019-T021) after core implementation complete

## Parallel Execution Examples

### Phase 3.1 - Database Setup (after T001-T002 complete):
```
Task: "Create settings validation schemas in lib/validations/settings-schema.ts"
```

### Phase 3.2 - Service Layer (after API routes T004-T005 complete):
```
Task: "Settings service functions in lib/services/settings-service.ts"
Task: "Settings error handling and responses in lib/utils/settings-errors.ts"
```

### Phase 3.3 - Dashboard Components:
```
Task: "Refresh button client component in app/admin/dashboard/components/refresh-button.tsx"
Task: "Settings navigation button in app/admin/dashboard/components/settings-button.tsx"
```

### Phase 3.4 - Settings Page Components:
```
Task: "Settings page layout in app/admin/dashboard/settings/page.tsx"
Task: "Settings form client component in app/admin/dashboard/settings/components/settings-form.tsx"
Task: "Settings display component in app/admin/dashboard/settings/components/settings-display.tsx"
Task: "Form validation hook in app/admin/dashboard/settings/components/use-settings-form.ts"
```

### Phase 3.5 - Integration & Constants:
```
Task: "Settings constants and enums in lib/constants/settings.ts"
Task: "Multi-tenant query helpers for settings in lib/db/queries/settings-queries.ts"
```

### Phase 3.6 - Polish & Error Handling:
```
Task: "Toast notifications for settings operations in lib/hooks/use-settings-toast.ts"
Task: "Loading states for dashboard refresh in app/admin/dashboard/components/dashboard-metrics.tsx"
```

## Task Details

### T001: Database Migration
Create SQL migration to add settings columns to existing schools table:
- `default_monthly_fee_ron` DECIMAL(10,2) DEFAULT 0.00
- `free_enrollment_count` INTEGER DEFAULT 0
- `settings_updated_at` TIMESTAMP
- Add validation constraints for non-negative values

### T004-T005: API Route Handlers
Implement GET and PUT endpoints for `/api/admin/settings`:
- Admin role verification via middleware
- Multi-tenant scoping by school_id
- Input validation using Zod schemas
- Error handling with proper HTTP status codes
- TypeScript interfaces for request/response

### T008-T009: Dashboard Button Components
Create client components for dashboard interactions:
- Refresh button with loading states and error handling
- Settings navigation button with proper routing
- Use shadcn/ui Button component for consistency
- Include proper TypeScript props and event handlers

### T011-T014: Settings Page Components
Build complete settings management interface:
- Server component page layout with data fetching
- Client form component with React Hook Form
- Display component for current settings
- Custom hook for form validation and submission

### T015-T016: Integration with Existing Features
Apply settings in enrollment workflows:
- Default fee population in child creation forms (with system-wide fallback via app config)
- Enrollment limit enforcement during submission
- Proper error messages when limits exceeded
- Multi-tenant isolation maintained

## Notes
- All components follow Next.js 15 App Router patterns
- Server components used by default, client components only when needed
- Multi-tenant security enforced at all levels
- shadcn/ui components used for consistent styling
- Drizzle ORM for all database operations
- No hardcoded strings - use constants and enums
- Constitutional compliance maintained throughout

## Validation Checklist (Implementation-Focused)
*GATE: Checked before task execution*

- [x] All API contracts have corresponding implementation tasks
- [x] Database schema changes have migration tasks
- [x] UI components account for server/client boundaries
- [x] Multi-tenant scoping included in all data operations
- [x] Settings integration points identified in existing workflows
- [x] Each task specifies exact file path
- [x] Parallel tasks operate on different files
- [x] Dependencies properly ordered (database → API → UI → integration)
- [x] Constitutional principles reflected in task structure
- [x] Testing tasks excluded per user request