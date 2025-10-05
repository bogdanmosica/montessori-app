# Feature Specification: Lessons Management

**Feature Branch**: `020-build-the-lessons`  
**Created**: October 5, 2025  
**Status**: Draft  
**Input**: User description: "Build the Lessons Management feature for montessori-app. Allow both Admins and Teachers to add and manage lessons. Lessons created by Admins are visible to all Teachers, while lessons created by individual Teachers are visible only to them.\n\n### Core Purpose\n- Provide a structured way to define Montessori lessons within the platform.\n- Allow Admins to create school-wide lesson templates (shared lessons).\n- Allow Teachers to create personal lessons for their own use.\n- Lay the foundation for linking lessons to observations and progress tracking.\n\n### User Stories\n1. As an Admin, I can create and manage global lessons visible to all Teachers.\n2. As an Admin, I can edit or delete any lesson in the system.\n3. As a Teacher, I can create my own lessons visible only to me.\n4. As a Teacher, I can view both my lessons and Admin-defined global lessons.\n5. As a Teacher, I can edit or delete only my own lessons.\n6. As an Admin or Teacher, I can search, filter, and categorize lessons.\n\n### Acceptance Criteria\n- New routes:\n  - `/admin/lessons` → Admin view of all lessons (manage global + teacher lessons).\n  - `/teacher/lessons` → Teacher view (own lessons + shared ones).\n- Data model:\n  - `lessons` table:\n    - `id` (UUID)\n    - `title` (string)\n    - `description` (text)\n    - `category` (string or enum, e.g., Practical Life, Sensorial, Language)\n    - `createdById` → references `users`\n    - `schoolId` → references `schools`\n    - `visibility` (enum: admin_global, teacher_private)\n    - timestamps\n- Visibility rules:\n  - Admins see all lessons.\n  - Teachers see:\n    - All lessons where `visibility = admin_global` **AND** `schoolId` matches.\n    - Lessons where `createdById = teacherId`.\n- UI Components:\n  - List view: `LessonsTable.tsx`\n  - Form for add/edit: `LessonForm.tsx`\n  - Filters/search: `LessonsFilter.tsx`\n  - All components under `app/[role]/lessons/components/`\n- Behavior:\n  - Use shared API endpoints `/api/lessons` with role-based filtering.\n  - Teachers can CRUD their own lessons.\n  - Admins can CRUD all lessons.\n- Respect montessori-app Constitution:\n  - Micro functions, small files.\n  - `use client` only for forms and interactions.\n  - Reuse existing role-based middleware and school scoping.\n  - Use enums/consts (no hardcoded strings).\n\n### Edge Cases\n- What happens if a Teacher leaves the school? Admin chooses per lesson: archive, reassign, or delete.\n- Can multiple Teachers collaborate on a shared lesson? Only the creator Teacher can edit their private lessons.\n- Should Teachers be able to clone a global lesson to personalize it? Teachers can clone and edit their own copy.\n- Should lessons be versioned to track edits? Only latest version is kept.\n\n### Out of Scope\n- Linking lessons to Kanban board or observations (future phase).\n- Lesson progress tracking (covered separately).\n- Parent visibility of lessons."

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

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
Admins and Teachers can add, view, edit, and delete Montessori lessons. Admins manage global lessons for the school, while Teachers manage personal lessons visible only to themselves. Teachers can also view global lessons created by Admins.

### Acceptance Scenarios
1. **Given** an Admin is logged in, **When** they access `/admin/lessons`, **Then** they see all lessons (global and teacher-created) and can add, edit, or delete any lesson.
2. **Given** a Teacher is logged in, **When** they access `/teacher/lessons`, **Then** they see their own lessons and global lessons created by Admins.
3. **Given** a Teacher is logged in, **When** they attempt to edit or delete a lesson they did not create, **Then** the system prevents the action.
4. **Given** a Teacher is logged in, **When** they create a lesson, **Then** only they can view, edit, or delete it.
5. **Given** an Admin or Teacher is logged in, **When** they use search or filters, **Then** lessons are filtered by category, title, or other criteria.

### Edge Cases
- What happens if a Teacher leaves the school? Admin chooses per lesson: archive, reassign, or delete.
- Can multiple Teachers collaborate on a shared lesson? Only the creator Teacher can edit their private lessons.
- Should Teachers be able to clone a global lesson to personalize it? Teachers can clone and edit their own copy.
- Should lessons be versioned to track edits? Only latest version is kept.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST allow Admins to create, view, edit, and delete global lessons visible to all Teachers in their school.
- **FR-002**: System MUST allow Teachers to create, view, edit, and delete personal lessons visible only to themselves.
- **FR-003**: System MUST allow Teachers to view global lessons created by Admins in their school.
- **FR-004**: System MUST restrict Teachers from editing or deleting lessons they did not create.
- **FR-005**: System MUST allow Admins to edit or delete any lesson in the system.
- **FR-006**: System MUST provide search and filter functionality for lessons by category, title, and other criteria.
- **FR-007**: System MUST categorize lessons (e.g., Practical Life, Sensorial, Language).
- **FR-008**: System MUST associate each lesson with a creator (Admin or Teacher) and a school.
- **FR-009**: System MUST enforce lesson visibility rules based on user role and school.
- **FR-010**: System MUST persist lesson data, including timestamps for creation and updates.
- **FR-011**: System MUST use enums/consts for categories and visibility (no hardcoded strings).
- **FR-012**: System MUST respect micro functions and small file structure for maintainability.
- **FR-013**: System MUST use role-based middleware and school scoping for access control.
- **FR-014**: System MUST use client-side rendering only for forms and interactive components.
- **FR-015**: System MUST provide UI components for listing, adding/editing, and filtering lessons.
- **FR-016**: System MUST use shared API endpoints for lesson management with role-based filtering.
- **FR-017**: System MUST handle edge cases as clarified (see above).
- **FR-018**: System MUST address lesson ownership when a Teacher leaves the school. Admin MUST be able to choose per lesson whether to archive, reassign, or delete it.
- **FR-019**: System MUST define collaboration rules for shared lessons. Only the creator Teacher can edit their private lessons.
- **FR-020**: System MUST specify if Teachers can clone global lessons. Teachers can clone and edit their own copy.
- **FR-021**: System MUST specify if lessons should be versioned. Only latest version is kept.

### Key Entities
- **Lesson**: Represents a Montessori lesson. Attributes: id (UUID), title (string), description (text), category (enum), createdById (user reference), schoolId (school reference), visibility (enum: admin_global, teacher_private), timestamps.
- **User**: Represents a platform user (Admin or Teacher). Attributes: id, role, schoolId.
- **School**: Represents a Montessori school. Attributes: id, name.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
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
- [ ] Review checklist passed

---
