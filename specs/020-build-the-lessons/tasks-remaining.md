# Tasks: Lessons Management - Remaining Features

## Overview
Based on Playwright MCP testing completed on 2025-10-05, the following tasks remain to complete the Lessons Management feature per the specification requirements.

## Test Results Summary
✅ **Admin Features Complete**: Create, Read, Update, List, Filter
🐛 **Bug Fixed**: SelectItem empty value in lessons-filter.tsx
❌ **Missing**: Teacher lessons page and functionality
❌ **Not Tested**: Delete functionality, lesson detail view page, lesson edit page

## Constitution Gate Validation
- All constitutional gates validated in original tasks (T001-T018)
- Remaining tasks follow same patterns and reuse existing components

## Parallel Execution Guidance
- [P] = Can be executed in parallel with other [P] tasks
- Sequential tasks must be completed in order

## Numbered, Ordered Tasks

### Bug Fixes & Polish
- [X] T019 [P]. Fix SelectItem empty value bug in `app/admin/lessons/components/lessons-filter.tsx` (COMPLETED during testing)
  - Changed default category from `""` to `"all"`
  - Updated filter logic to exclude "all" from query params
  - File: `app/admin/lessons/components/lessons-filter.tsx:22,27,34,38,58`

### Teacher Lessons Pages (High Priority - Missing from Implementation)
- [ ] T020. Create teacher lessons list page at `app/teacher/lessons/page.tsx`
  - **Dependencies**: None (reuse existing components)
  - **Files to create**: `app/teacher/lessons/page.tsx`
  - **Files to reuse**:
    - `app/admin/lessons/components/lessons-table.tsx`
    - `app/admin/lessons/components/lessons-filter.tsx`
  - **Implementation notes**:
    - Copy structure from `app/admin/lessons/page.tsx`
    - Call `getLessons()` with teacher role
    - Filter shows teacher's private lessons + admin global lessons
    - "New Lesson" button links to `/teacher/lessons/new`
    - Teacher can only edit/delete their own lessons (RBAC in service layer)
  - **Acceptance criteria**:
    - Teachers see their private lessons
    - Teachers see admin global lessons
    - Teachers cannot edit/delete admin lessons
    - Search and category filtering works

- [ ] T021. Create teacher new lesson page at `app/teacher/lessons/new/page.tsx`
  - **Dependencies**: T020
  - **Files to create**: `app/teacher/lessons/new/page.tsx`
  - **Files to reuse**: `app/admin/lessons/components/lesson-form.tsx`
  - **Implementation notes**:
    - Copy structure from `app/admin/lessons/new/page.tsx`
    - Force visibility to `teacher_private` (no admin_global option)
    - Submit to same `/api/lessons` POST endpoint
    - RBAC enforced in API layer
  - **Acceptance criteria**:
    - Teachers can create private lessons only
    - Form validation works
    - Redirects to `/teacher/lessons` after creation

- [ ] T022. Create teacher lesson detail page at `app/teacher/lessons/[id]/page.tsx`
  - **Dependencies**: T020
  - **Files to create**: `app/teacher/lessons/[id]/page.tsx`
  - **Files to reuse**: Admin detail page components (if exists) or create shared component
  - **Implementation notes**:
    - Display lesson details (read-only)
    - "Edit" button only shown if teacher owns the lesson
    - "Back to Lessons" returns to `/teacher/lessons`
    - Fetch from `/api/lessons/[id]` GET endpoint
  - **Acceptance criteria**:
    - Teachers can view any visible lesson details
    - Edit button only for owned lessons
    - Admin global lessons show as read-only

- [ ] T023. Create teacher edit lesson page at `app/teacher/lessons/[id]/edit/page.tsx`
  - **Dependencies**: T020, T022
  - **Files to create**: `app/teacher/lessons/[id]/edit/page.tsx`
  - **Files to reuse**: `app/admin/lessons/components/lesson-form.tsx`
  - **Implementation notes**:
    - Copy structure from `app/admin/lessons/[id]/edit/page.tsx`
    - Load existing lesson data
    - Prevent editing if not owner (redirect or show error)
    - RBAC enforced in API layer
  - **Acceptance criteria**:
    - Teachers can edit only their own lessons
    - Form pre-populated with existing data
    - Redirects to lesson detail after update

### Admin Lesson Pages (Complete the CRUD cycle)
- [ ] T024. Create admin lesson detail page at `app/admin/lessons/[id]/page.tsx`
  - **Dependencies**: None
  - **Files to create**: `app/admin/lessons/[id]/page.tsx`
  - **Implementation notes**:
    - Display all lesson details
    - Show creator information
    - "Edit" and "Delete" buttons
    - "Back to Lessons" returns to `/admin/lessons`
    - Fetch from `/api/lessons/[id]` GET endpoint
  - **Acceptance criteria**:
    - Shows all lesson fields
    - Edit button navigates to edit page
    - Delete button triggers confirmation dialog
    - Creator info displayed

- [ ] T025. Create admin edit lesson page at `app/admin/lessons/[id]/edit/page.tsx`
  - **Dependencies**: T024
  - **Files to create**: `app/admin/lessons/[id]/edit/page.tsx`
  - **Files to reuse**: `app/admin/lessons/components/lesson-form.tsx`
  - **Implementation notes**:
    - Load existing lesson data via `/api/lessons/[id]` GET
    - Pre-populate form with current values
    - Submit to `/api/lessons/[id]` PUT
    - Admin can edit any lesson
  - **Acceptance criteria**:
    - Form loads with existing data
    - All fields editable
    - Validation works
    - Redirects to detail page after update

### Delete Functionality
- [ ] T026 [P]. Implement delete confirmation dialog in `app/admin/lessons/components/lessons-table.tsx`
  - **Dependencies**: None
  - **Files to modify**: `app/admin/lessons/components/lessons-table.tsx`
  - **Implementation notes**:
    - Add AlertDialog component from shadcn/ui
    - Confirm before DELETE request to `/api/lessons/[id]`
    - Show success/error toast
    - Refresh table after deletion
  - **Acceptance criteria**:
    - Confirmation dialog appears on delete click
    - Lesson deleted on confirm
    - Table refreshes after deletion
    - Error handling for failed deletion

- [ ] T027 [P]. Implement delete confirmation dialog for teacher lessons
  - **Dependencies**: T020
  - **Files to create/modify**: Teacher lessons table or reuse admin component
  - **Implementation notes**:
    - Same as T026 but only for owned lessons
    - Disable delete button for admin global lessons
    - RBAC enforced in API layer
  - **Acceptance criteria**:
    - Teachers can delete only their own lessons
    - Confirmation dialog works
    - Table refreshes after deletion

### Navigation Updates
- [ ] T028. Add "Lessons" link to admin navigation
  - **Dependencies**: None
  - **Files to modify**: `components/admin/admin-navigation.tsx` (or wherever admin nav is)
  - **Implementation notes**:
    - Add lessons icon and link
    - Link to `/admin/lessons`
    - Position after Teachers or appropriate location
  - **Acceptance criteria**:
    - Lessons appears in admin nav
    - Highlights when on lessons pages
    - Responsive on mobile

- [ ] T029. Add "Lessons" link to teacher navigation
  - **Dependencies**: T020
  - **Files to modify**: `components/teacher/teacher-navigation.tsx`
  - **Implementation notes**:
    - Add lessons icon and link
    - Link to `/teacher/lessons`
    - Position appropriately in nav
  - **Acceptance criteria**:
    - Lessons appears in teacher nav
    - Highlights when on lessons pages
    - Responsive on mobile

### Advanced Features (Optional - Per Spec Edge Cases)
- [ ] T030 [P]. Implement lesson cloning functionality for teachers
  - **Dependencies**: T020, T022
  - **Files to modify**:
    - `app/teacher/lessons/[id]/page.tsx` (add clone button)
    - API already exists: `/api/lessons/[id]/clone`
  - **Implementation notes**:
    - "Clone Lesson" button on global lesson detail pages
    - POST to `/api/lessons/[id]/clone`
    - Creates private copy for teacher
    - Redirect to edit page of new lesson
  - **Acceptance criteria**:
    - Clone button only shown for global lessons
    - Creates editable private copy
    - Original lesson unchanged

- [ ] T031 [P]. Add lesson usage indicators (optional future enhancement)
  - **Dependencies**: T020, T024
  - **Implementation notes**:
    - Show count of times lesson used in observations
    - Show which teachers use the lesson
    - Read-only stats on detail pages
  - **Acceptance criteria**:
    - Shows usage count
    - Lists teachers using lesson
    - No performance impact

### Testing & Validation
- [ ] T032 [P]. Manual testing: Admin complete CRUD cycle
  - **Dependencies**: T024, T025, T026
  - **Test scenarios**:
    1. Create global lesson
    2. Create private lesson
    3. View lesson details
    4. Edit both lesson types
    5. Delete both lesson types
    6. Test search and filters
  - **Acceptance criteria**: All scenarios pass

- [ ] T033 [P]. Manual testing: Teacher RBAC enforcement
  - **Dependencies**: T020-T023, T027
  - **Test scenarios**:
    1. Teacher creates private lesson
    2. Teacher views global admin lesson
    3. Teacher edits own lesson
    4. Teacher attempts to edit admin lesson (should fail)
    5. Teacher deletes own lesson
    6. Teacher attempts to delete admin lesson (should fail)
    7. Test search and filters
  - **Acceptance criteria**: All scenarios pass

- [ ] T034 [P]. Manual testing: Multi-tenant isolation
  - **Dependencies**: T020-T023, T024-T025
  - **Test scenarios**:
    1. Create lessons in School A
    2. Login as user from School B
    3. Verify School A lessons not visible
    4. Create lesson in School B
    5. Verify School B user sees only School B lessons
  - **Acceptance criteria**: Complete isolation between schools

## Dependency Notes
- Setup and bug fixes (T019) completed
- Teacher pages (T020-T023) can be developed in parallel after T020 foundation
- Admin detail/edit pages (T024-T025) independent of teacher pages
- Delete functionality (T026-T027) depends on respective list pages
- Navigation updates (T028-T029) depend on respective page sets
- Advanced features (T030-T031) optional and can be parallel
- Testing (T032-T034) requires all implementation complete

## Parallel Execution Examples

### Example 1: After completing T020 (teacher lessons list)
```bash
# Run these tasks in parallel:
- T021 (teacher new lesson page)
- T022 (teacher lesson detail page)
- T024 (admin lesson detail page)
- T026 (admin delete confirmation)
- T028 (admin navigation update)
```

### Example 2: After completing T020-T023 (all teacher pages)
```bash
# Run these tasks in parallel:
- T027 (teacher delete confirmation)
- T029 (teacher navigation update)
- T030 (lesson cloning)
```

### Example 3: Final testing phase
```bash
# Run these tasks in parallel:
- T032 (admin CRUD testing)
- T033 (teacher RBAC testing)
- T034 (multi-tenant testing)
```

## Implementation Priority

### High Priority (Core Features)
1. T020-T023: Teacher lessons pages (missing from spec)
2. T024-T025: Admin detail/edit pages (complete CRUD)
3. T026-T027: Delete functionality (complete CRUD)
4. T028-T029: Navigation updates (discoverability)

### Medium Priority (Enhancements)
5. T030: Lesson cloning (spec requirement)

### Low Priority (Future)
6. T031: Usage indicators (nice-to-have)

### Always Required
7. T032-T034: Testing (validation)

## Success Criteria
- All CRUD operations work for both Admin and Teacher
- RBAC properly enforced (teachers can't edit admin lessons)
- Multi-tenant isolation verified
- Search and filtering functional
- Navigation intuitive and complete
- All edge cases from spec handled (cloning, deletion, etc.)

---
**Created**: 2025-10-05
**Based on**: Playwright MCP testing results
**Feature**: Lessons Management (020-build-the-lessons)
**Status**: Ready for implementation
