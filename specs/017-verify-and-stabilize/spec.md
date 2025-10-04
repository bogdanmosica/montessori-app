# Feature Specification: Verify and Stabilize Montessori-App After Database Migration

**Feature Branch**: `017-verify-and-stabilize`  
**Created**: October 4, 2025  
**Status**: Draft  
**Input**: User description: "Verify and stabilize montessori-app after the database migration (teams → schools, teamMembers → schoolMembers). Focus on testing existing functionality, reusing the metrics services, and fixing broken list and payment pages.\n\n### Core Purpose\n- Ensure that the app continues to function correctly after the schema migration.\n- Identify and fix broken routes, lists, and payment flows caused by reference changes.\n- Reuse and consolidate metrics services so dashboard and related pages work consistently.\n\n### User Stories\n1. As an Admin, I can load the dashboard and see metrics without errors.\n2. As an Admin, I can view application and enrollment lists without broken queries.\n3. As an Admin, I can use the payments flow (subscription management, invoices) across pages without errors.\n4. As a Teacher, I can log in and see my dashboard and students list without missing data.\n5. As a Parent, I can log in and see my children without errors.\n\n### Acceptance Criteria\n- Run Playwright or manual QA to validate critical flows:\n  - Admin dashboard metrics load successfully (within 2 seconds)\n  - Applications list displays correctly (no missing or broken entries)\n  - Enrollments list displays correctly (no missing or broken entries)\n  - Payments page loads subscription details and invoices (no errors, correct school references)\n  - Teacher dashboards and rosters load correctly (all students visible, no errors)\n  - Parent dashboards show children correctly (all children visible, no errors)\n- Fix broken references in metrics services (e.g., school vs team scope).\n- Consolidate metrics services to avoid duplication between admin dashboard and other lists.\n- Ensure all DB queries reference `schools` and `schoolMembers` consistently.\n- Ensure role-based scoping (Admin/Teacher/Parent) is preserved.\n- Respect montessori-app Constitution:\n  - Small fixes as micro functions.\n  - No hardcoded strings (use enums/consts).\n  - Reuse existing services where possible.\n  - Minimal `use client`.\n- All dashboards, lists, and payment pages must load within 2 seconds (performance goal).\n- System must recover gracefully from query errors (reliability goal).\n- All user actions must be logged in `access_logs` for audit compliance.\n- RBAC enforcement must prevent unauthorized access to dashboards, lists, and payment flows.\n- All queries and metrics must be scoped by tenant (school/team); no cross-tenant data exposure.\n\n### Edge Cases\n- Legacy references (teams/teamMembers) in code, tests, or comments must be fully removed or patched to use `schools` and `schoolMembers`.\n- Payments are made by parents and must be tied to a single schoolId per subscription; multi-school subscriptions are not supported.\n- Metrics services must be refactored to support the new school-based schema; patching existing queries is not sufficient."

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
After the database migration from teams/teamMembers to schools/schoolMembers, users (Admin, Teacher, Parent) can access their dashboards and related lists (applications, enrollments, payments, students, children) without errors or missing data. All metrics and payment flows work as expected, referencing the new schema.

### Acceptance Scenarios
1. **Given** the database has migrated to schools/schoolMembers, **When** an Admin loads the dashboard, **Then** metrics display without errors.
2. **Given** the new schema, **When** an Admin views application and enrollment lists, **Then** all data loads correctly and queries are not broken.
3. **Given** the new schema, **When** an Admin uses the payments flow, **Then** subscription management and invoices work across all relevant pages.
4. **Given** the new schema, **When** a Teacher logs in, **Then** their dashboard and students list load without missing data.
5. **Given** the new schema, **When** a Parent logs in, **Then** their children are displayed correctly.

### Edge Cases
- What happens if legacy references (teams/teamMembers) remain in code, tests, or comments? [NEEDS CLARIFICATION]
- Should payments be strictly tied to a single schoolId, or can a subscription cover multiple schools? [NEEDS CLARIFICATION]
- Do metrics require a full refactor for school-based schema, or can we patch existing queries? [NEEDS CLARIFICATION]

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST ensure all dashboards and lists (Admin, Teacher, Parent) load without errors after migration.
- **FR-002**: System MUST update all DB queries to reference `schools` and `schoolMembers` consistently.
- **FR-003**: System MUST fix broken routes, lists, and payment flows caused by reference changes.
- **FR-004**: System MUST reuse and consolidate metrics services for dashboard and related pages.
- **FR-005**: System MUST preserve role-based scoping for Admin, Teacher, and Parent users.
- **FR-006**: System MUST validate critical flows using Playwright or manual QA (dashboard, lists, payments, rosters, children).
- **FR-007**: System MUST respect montessori-app Constitution (micro functions, enums/consts, reuse services, minimal `use client`).
- **FR-008**: System MUST fully remove or patch all legacy references (teams/teamMembers) in code, tests, or comments.
- **FR-009**: System MUST ensure payments are made by parents and tied to a single schoolId per subscription.
- **FR-010**: System MUST refactor metrics services to support the new school-based schema (not just patch queries).
- **FR-011**: System MUST log all user actions in `access_logs` for audit compliance.
- **FR-012**: System MUST enforce RBAC for all user roles and prevent unauthorized access.
- **FR-013**: System MUST scope all queries and metrics by tenant (school/team).
- **FR-014**: All dashboards, lists, and payment pages MUST load within 2 seconds.
- **FR-015**: System MUST recover gracefully from query errors and display user-friendly error messages.

### Key Entities
- **School**: Represents an educational institution; replaces Team. Key attributes: id, name, address, etc.
- **SchoolMember**: Represents a user associated with a school; replaces TeamMember. Key attributes: id, userId, schoolId, role (Admin, Teacher, Parent).
- **MetricsService**: Provides metrics for dashboards and lists; must support school-based scoping.
- **PaymentFlow**: Manages subscriptions and invoices; must reference schoolId and support role-based access. Payments are made by parents.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---
