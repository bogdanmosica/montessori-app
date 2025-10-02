# Feature Specification: Extend Weekly Trends Widget with Real Data

**Feature Branch**: `011-extend-the-weekly`  
**Created**: October 1, 2025  
**Status**: Draft  
**Input**: User description: "Extend the Weekly Trends widget in /admin/dashboard for montessori-app. Currently, the widget displays dummy data. Replace it with real data sourced from the database."

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature: Replace dummy data in Weekly Trends widget with real database data
2. Extract key concepts from description
   → Actors: Admins
   → Actions: View weekly activity trends, see accurate metrics
   → Data: Applications, enrollments from database
   → Constraints: Admin-only access, tenant-scoped data, 7-day window
3. For each unclear aspect:
   → Marked with [NEEDS CLARIFICATION] where applicable
4. Fill User Scenarios & Testing section
   → Clear user flow: Admin views dashboard → sees accurate weekly trends
5. Generate Functional Requirements
   → Each requirement is testable and measurable
6. Identify Key Entities
   → Applications, Enrollments, WeeklyMetrics
7. Run Review Checklist
   → Some [NEEDS CLARIFICATION] items remain for business decisions
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-01
- Q: When no data exists for the past 7 days (no applications or enrollments), how should the Weekly Trends widget display this state? → A: Show zeros on the chart (0 applications, 0 enrollments for each day)
- Q: What additional metrics should the Weekly Trends widget support beyond applications and enrollments? → A: Add all school activity types (payments, staff, events)
- Q: Should the Weekly Trends widget allow configurable time windows or remain fixed at 7 days? → A: Allow custom date range selection
- Q: What should happen when a user's tenant/school context is unclear or missing during data retrieval? → A: Log error silently and show generic message
- Q: How should the widget behave during data loading or when the database is temporarily unavailable? → A: Show skeleton placeholder matching chart structure
- Q: What additional metrics should the Weekly Trends widget support beyond applications and enrollments? → A: Add all school activity types (payments, staff, events)

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a school administrator, I need to see accurate weekly activity trends on my dashboard to understand recent school activity patterns, track application volumes, and monitor enrollment progress. This helps me make informed decisions about staffing, capacity planning, and follow-up actions.

### Acceptance Scenarios
1. **Given** I am an authenticated Admin user, **When** I navigate to the admin dashboard, **Then** I see the Weekly Trends widget displaying real data for applications and enrollments from the past 7 days
2. **Given** I am viewing the Weekly Trends widget, **When** the data loads, **Then** I see only data scoped to my school/tenant (not other schools' data)
3. **Given** I am on the admin dashboard, **When** I look at the Weekly Trends widget, **Then** I see a clear visual representation (chart) showing daily counts for the past 7 calendar days
4. **Given** I am a non-Admin user, **When** I try to access the admin dashboard, **Then** I cannot see the Weekly Trends widget due to role restrictions

### Edge Cases
- When no applications or enrollments exist for the selected date range, the chart displays zero values for each day
- When user's tenant/school context is unclear or missing, system logs error silently and displays generic "Unable to load data" message
- During data loading or database unavailability, widget displays skeleton placeholder matching the chart structure

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST display real application data from the database instead of dummy/hardcoded values
- **FR-002**: System MUST display real enrollment data from the database instead of dummy/hardcoded values  
- **FR-003**: System MUST scope all data queries to the authenticated Admin's school/tenant
- **FR-004**: System MUST show data for the user-selected date range, defaulting to the past 7 calendar days
- **FR-005**: System MUST restrict widget visibility to users with Admin role only
- **FR-006**: System MUST aggregate daily counts for both applications received and new enrollments
- **FR-007**: System MUST maintain the existing visual chart format and design consistency
- **FR-008**: System MUST display zero values on the chart for days with no applications or enrollments within the 7-day window
- **FR-009**: System MUST support comprehensive school activity metrics including applications, enrollments, payments, staff activities, and events
- **FR-009a**: System MUST allow users to select which activity types to display on the chart
- **FR-010**: System MUST allow users to select custom date ranges for trend analysis (not limited to 7 days)
- **FR-011**: System MUST handle missing tenant context by logging errors silently and displaying a generic "Unable to load data" message
- **FR-012**: System MUST display skeleton placeholder UI during data loading that matches the chart structure

### Key Entities *(include if feature involves data)*
- **Application**: Represents school applications with creation timestamps, status, and tenant association
- **Enrollment**: Represents student enrollments with enrollment dates, status, and tenant association  
- **WeeklyMetrics**: Aggregated daily counts of applications and enrollments for trend analysis
- **Tenant/School**: Organizational boundary for data scoping and access control

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain - **All clarifications resolved**
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed - **All clarifications completed**

---
