# Tasks: Extend Weekly Trends Widget with Real Data

**Input**: Design documents from `/specs/011-extend-the-weekly/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Schema Extensions
- [X] T001 [P] Create activity type enum constants in `lib/constants/activity-types.ts`
- [X] T002 [P] Create staff activities schema in `lib/db/schema/staff-activities.ts`
- [X] T003 [P] Create events schema in `lib/db/schema/events.ts`
- [X] T004 [P] Create payment activities schema extensions in `lib/db/schema/payment-activities.ts`
- [X] T005 Create database migration for new activity tables in `drizzle/0007_add_activity_tracking.sql`
- [X] T006 Update main schema exports in `lib/db/schema.ts` to include new activity tables

## Phase 3.2: Core Data Services
- [X] T007 [P] Create activity aggregation service in `lib/services/activity-aggregation.ts`
- [X] T008 [P] Create date range utilities in `lib/utils/date-range.ts`
- [X] T009 [P] Create tenant-scoped query helpers in `lib/db/tenant-activity-queries.ts`
- [X] T010 Update trends service to use real data in `lib/services/trends-service.ts`
- [X] T011 Create caching service for activity metrics in `lib/services/activity-cache.ts`

## Phase 3.3: API Extensions
- [X] T012 Extend metrics API route to support trend parameters in `app/api/admin/metrics/route.ts`
- [X] T013 [P] Create trends data validation schemas in `lib/validations/trends-validation.ts`
- [X] T014 [P] Add error handling constants for trends in `lib/constants/error-messages.ts`
- [X] T015 Update API response types in `lib/types/dashboard.ts` for comprehensive activity data

## Phase 3.4: Widget Enhancement
- [X] T016 [P] Create activity type selector component in `app/admin/dashboard/components/ActivityTypeSelector.tsx`
- [X] T017 [P] Create date range picker component in `app/admin/dashboard/components/DateRangePicker.tsx`
- [X] T018 [P] Create skeleton loading component for trends in `app/admin/dashboard/components/TrendsSkeleton.tsx`
- [X] T019 Update TrendsChart component to support real data and new features in `app/admin/dashboard/components/TrendsChartEnhanced.client.tsx`
- [X] T020 Update EmptyState component for comprehensive activity types (reused existing)

## Phase 3.5: Integration & Optimization
- [X] T021 Update dashboard page to handle new trend parameters in `app/admin/dashboard/page.tsx`
- [X] T022 [P] Add database indexes for activity queries in migration `drizzle/0008_add_activity_indexes.sql`
- [X] T023 [P] Update dashboard constants for new activity types in `app/admin/dashboard/constants.ts`
- [X] T024 Create comprehensive error boundary for trends widget in `app/admin/dashboard/components/TrendsErrorBoundary.tsx`
- [X] T025 Update RBAC middleware to log trend data access in `lib/auth/dashboard-context.ts`

## Dependencies
- Schema tasks (T002-T004) before migration (T005) before main schema update (T006)
- Schema completion before service tasks (T007-T011)
- Service tasks before API extensions (T012-T015)
- API completion before widget enhancement (T016-T020)
- Widget completion before integration (T021-T025)

## Parallel Example
```
# Launch T001-T004 together (all different schema files):
Task: "Create activity type enum constants in lib/constants/activity-types.ts"
Task: "Create staff activities schema in lib/db/schema/staff-activities.ts"
Task: "Create events schema in lib/db/schema/events.ts"
Task: "Create payment activities schema extensions in lib/db/schema/payment-activities.ts"

# Launch T007-T009 together (all different service files):
Task: "Create activity aggregation service in lib/services/activity-aggregation.ts"
Task: "Create date range utilities in lib/utils/date-range.ts"
Task: "Create tenant-scoped query helpers in lib/db/tenant-activity-queries.ts"

# Launch T016-T018 together (all different component files):
Task: "Create activity type selector component in app/admin/dashboard/components/ActivityTypeSelector.tsx"
Task: "Create date range picker component in app/admin/dashboard/components/DateRangePicker.tsx"
Task: "Create skeleton loading component for trends in app/admin/dashboard/components/TrendsSkeleton.tsx"
```

## Task Details

### T001: Activity Type Constants
Create centralized enum and type definitions for all activity types (applications, enrollments, payments, staff_activities, events) to eliminate hardcoding throughout the application.

### T002-T004: Database Schema Extensions
Add new database tables for staff activities, events, and payment activity tracking with proper tenant isolation, foreign key relationships, and validation constraints.

### T005-T006: Database Migration
Create and apply database migration to add new activity tracking tables and update the main schema to export new table definitions.

### T007-T011: Data Services
Implement server-side data aggregation services with optimized queries, caching mechanisms, and proper tenant scoping for activity metrics.

### T012-T015: API Extensions
Extend existing `/api/admin/metrics` endpoint to support new trend parameters while maintaining backward compatibility and adding comprehensive error handling.

### T016-T020: Widget Components
Create new interactive components for activity type selection, date range picking, and skeleton loading states while updating the main trends chart to display comprehensive activity data.

### T021-T025: Integration & Polish
Integrate all components into the dashboard page, add performance optimizations through database indexing, and ensure proper audit logging for security compliance.

## Validation Checklist
- [X] All new database tables include tenant_id for multi-tenant isolation
- [X] All database queries use tenant-scoped helpers
- [X] All API endpoints enforce RBAC and log access attempts
- [X] All UI components follow server-first architecture with minimal client-side JavaScript
- [X] All constants and enums are externalized (no hardcoding)
- [X] All error states provide user-friendly messages while logging detailed errors
- [X] All date calculations handle time zones consistently
- [X] All performance targets (<200ms widget load) are met

## Notes
- [P] tasks = different files, no dependencies
- Maintain backward compatibility with existing trends API
- Preserve existing dashboard design consistency
- Focus on server-side performance optimization
- Ensure multi-tenant security throughout implementation