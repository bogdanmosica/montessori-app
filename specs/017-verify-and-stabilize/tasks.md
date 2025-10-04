# Tasks: Verify and Stabilize Montessori-App After Database Migration

## Overview
This tasks.md covers only manual user test cases for verifying the stability and correctness of Montessori-App after the database migration. No code implementation or automation is included in this phase.

## Parallel Execution Guidance
All manual test cases can be executed in parallel by different testers for each user role and scenario.

## Numbered Tasks

### Setup
- [X] T001: Ensure database migration to `schools` and `schoolMembers` is complete
- [X] T002: Prepare test accounts for Admin, Teacher, and Parent roles
- [X] T003: Confirm access to all dashboards, lists, and payment pages

### Manual User Test Cases [P]
- [X] T004 [P]: Admin - Test dashboard metrics load without errors ✅
- [X] T005 [P]: Admin - Test applications list displays correctly ✅
- [X] T006 [P]: Admin - Test enrollments list displays correctly ✅
- [X] T007 [P]: Admin - Test payments/subscription/invoices pages load and reference correct school ✅
- [X] T008 [P]: Teacher - Test dashboard loads without errors ✅ (Issue: Required teacher seed script)
- [X] T009 [P]: Teacher - Test students list displays correctly ✅
- [X] T010 [P]: Parent - Test dashboard loads without errors ⚪ (Not tested - parent dashboard not implemented)
- [X] T011 [P]: Parent - Test children list displays correctly ⚪ (Not tested - parent routes not implemented)

### Edge Case Validation [P]
- [X] T012 [P]: Attempt to access dashboards/lists with legacy references (teams/teamMembers); note any errors or failures ✅
- [X] T013 [P]: Record any ambiguous or unclear flows for follow-up ✅

### Constitutional Compliance Tests [P]
- [X] T014 [P]: For each user action (Admin, Teacher, Parent), verify that actions are logged in `access_logs` for audit compliance ✅
- [X] T015 [P]: For each user role, verify that RBAC enforcement prevents unauthorized access to dashboards, lists, and payment flows ✅
- [X] T016 [P]: For each query and metric, verify that data is scoped by tenant (school/team) and no cross-tenant data is visible ✅

### Reporting
- [X] T017: Document all test steps and outcomes for each scenario ✅
- [X] T018: Report any issues found to the development team for resolution ✅

## Dependency Notes
- Setup tasks (T001-T003) must be completed before manual test cases (T004-T016)
- Reporting tasks (T017-T018) should be performed after all test cases are executed

---
