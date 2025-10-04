# Manual Test Execution Guide
## Montessori-App Database Migration Verification (teams → schools)

**Date**: 2025-10-04
**Feature**: 017-verify-and-stabilize
**Purpose**: Verify stability and correctness after database migration from `teams`/`teamMembers` to `schools`/`schoolMembers`

---

## Prerequisites ✅

### Setup Tasks Completed:
- ✅ **T001**: Database migration verified - Schema uses `schools` and `school_members` tables
- ✅ **T002**: Test accounts prepared and available
- ✅ **T003**: All dashboard routes confirmed to exist

### Test Accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Teacher | teacher@test.com | teacher123 |
| Parent | parent@test.com | parent123 |

### Test Environment:
- **Application URL**: http://localhost:3000 (or your configured port)
- **Database**: PostgreSQL with migrated `schools` and `school_members` tables
- **Sample Data**: Seeded with families, children, applications, and teacher activity

---

## Manual Test Cases (T004-T016)

### 🔴 ADMIN ROLE TEST CASES

#### T004: Admin Dashboard Metrics
**Login**: admin@test.com / admin123
**Navigate to**: `/admin/dashboard`

**Test Steps**:
1. Log in as Admin user
2. Navigate to admin dashboard
3. Verify page loads within 2 seconds
4. Check all metrics display correctly:
   - Total enrollments count
   - Capacity utilization percentage
   - Payment status metrics
   - Waitlist count
   - Age group distributions
5. Verify no console errors
6. Check that all metrics reference `schoolId` (not `teamId`)

**Expected Results**:
- ✅ Dashboard loads successfully
- ✅ All metrics display numerical values
- ✅ No errors in browser console
- ✅ Performance: Load time < 2 seconds

**Constitutional Compliance**:
- ✅ Action logged in `access_logs` table
- ✅ Only school-specific data visible
- ✅ RBAC prevents unauthorized access

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

#### T005: Admin Applications List
**Login**: admin@test.com / admin123
**Navigate to**: `/admin/applications`

**Test Steps**:
1. Log in as Admin user
2. Navigate to applications list
3. Verify all applications display correctly
4. Check search and filter functionality
5. Test pagination if applicable
6. Verify application details can be viewed
7. Check for broken queries or missing entries

**Expected Results**:
- ✅ Applications list loads successfully
- ✅ All applications are visible
- ✅ Search/filter works correctly
- ✅ Application details accessible

**Constitutional Compliance**:
- ✅ Actions logged in `access_logs`
- ✅ Only school-specific applications visible
- ✅ RBAC enforcement active

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

#### T006: Admin Enrollments List
**Login**: admin@test.com / admin123
**Navigate to**: `/admin/enrollments`

**Test Steps**:
1. Log in as Admin user
2. Navigate to enrollments list
3. Verify all enrollments display correctly
4. Check enrollment status filters (active, inactive, withdrawn)
5. Test enrollment details viewing
6. Verify enrollment creation/editing works
7. Check for missing data or broken queries

**Expected Results**:
- ✅ Enrollments list loads successfully
- ✅ All enrollments visible with correct status
- ✅ Filters work correctly
- ✅ CRUD operations functional

**Constitutional Compliance**:
- ✅ Actions logged in `access_logs`
- ✅ Data scoped by schoolId
- ✅ RBAC prevents unauthorized modifications

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

#### T007: Admin Payments/Subscription/Invoices
**Login**: admin@test.com / admin123
**Navigate to**: `/admin/payments`

**Test Steps**:
1. Log in as Admin user
2. Navigate to payments page
3. Verify subscription details load correctly
4. Check invoice list displays
5. Verify payment records show correct schoolId references
6. Test payment method management
7. Check for correct school associations in all payment data

**Expected Results**:
- ✅ Payments page loads successfully
- ✅ Subscription details correct
- ✅ Invoices display properly
- ✅ All payment data references correct schoolId

**Constitutional Compliance**:
- ✅ Payment actions logged in `access_logs`
- ✅ Only school-specific payment data visible
- ✅ RBAC enforced for payment operations

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

### 👨‍🏫 TEACHER ROLE TEST CASES

#### T008: Teacher Dashboard
**Login**: teacher@test.com / teacher123
**Navigate to**: `/teacher/dashboard`

**Test Steps**:
1. Log in as Teacher user
2. Navigate to teacher dashboard
3. Verify dashboard loads without errors
4. Check student metrics display correctly
5. Verify activity logs show recent activities
6. Check for any broken queries or missing data

**Expected Results**:
- ✅ Dashboard loads successfully
- ✅ Student metrics display correctly
- ✅ Activity data shows recent entries
- ✅ No console errors

**Constitutional Compliance**:
- ✅ Dashboard access logged in `access_logs`
- ✅ Only assigned students visible
- ✅ RBAC prevents access to admin features

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

#### T009: Teacher Students List
**Login**: teacher@test.com / teacher123
**Navigate to**: `/teacher/students`

**Test Steps**:
1. Log in as Teacher user
2. Navigate to students list
3. Verify all assigned students display correctly
4. Check observation counts for each student
5. Test student profile navigation
6. Verify student details are accessible
7. Check for missing data or broken queries

**Expected Results**:
- ✅ Students list loads successfully
- ✅ All assigned students visible
- ✅ Observation counts accurate
- ✅ Student profiles accessible

**Constitutional Compliance**:
- ✅ Student access logged in `access_logs`
- ✅ Only assigned students visible (multi-tenant isolation)
- ✅ RBAC prevents unauthorized student access

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

### 👪 PARENT ROLE TEST CASES

#### T010: Parent Dashboard
**Login**: parent@test.com / parent123
**Navigate to**: `/parent/dashboard` (or default parent route)

**Test Steps**:
1. Log in as Parent user
2. Navigate to parent dashboard
3. Verify dashboard loads without errors
4. Check children information displays correctly
5. Verify payment information is accessible
6. Check for any broken queries or missing data

**Expected Results**:
- ✅ Dashboard loads successfully (or redirects appropriately)
- ✅ Children information displays
- ✅ Payment information accessible
- ✅ No console errors

**Constitutional Compliance**:
- ✅ Dashboard access logged in `access_logs`
- ✅ Only parent's own children visible
- ✅ RBAC prevents access to other families' data

**Known Limitation**: Parent dashboard may not be fully implemented yet.

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

#### T011: Parent Children List
**Login**: parent@test.com / parent123
**Navigate to**: `/parent/children` (or equivalent route)

**Test Steps**:
1. Log in as Parent user
2. Navigate to children list
3. Verify all parent's children display correctly
4. Check child details are accessible
5. Verify enrollment status visible
6. Test payment history viewing
7. Check for missing data or broken queries

**Expected Results**:
- ✅ Children list loads successfully
- ✅ All children visible
- ✅ Enrollment status correct
- ✅ Payment history accessible

**Constitutional Compliance**:
- ✅ Child access logged in `access_logs`
- ✅ Only parent's own children visible
- ✅ RBAC prevents access to other children

**Known Limitation**: Parent routes may not be fully implemented yet.

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

### 🔍 EDGE CASE VALIDATION

#### T012: Legacy References (teams/teamMembers)
**All Roles**

**Test Steps**:
1. Search codebase for any remaining references to `teams` or `teamMembers`
2. Check if `extended_access_logs` table still uses `team_id` field
3. Attempt to access any legacy endpoints or queries
4. Note any errors or failures caused by legacy references
5. Verify all queries use `schools` and `schoolMembers` correctly

**Expected Results**:
- ✅ All references updated to `schools`/`schoolMembers`
- ✅ Legacy references flagged or removed
- ✅ No runtime errors from legacy code

**Known Issue**: `extended_access_logs.team_id` still exists but references `schools.id`

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

#### T013: Ambiguous or Unclear Flows
**All Roles**

**Test Steps**:
1. Navigate through all user flows
2. Note any confusing UI/UX elements
3. Record any unclear error messages
4. Document any missing feedback or confirmations
5. Identify any incomplete features

**Expected Results**:
- Document all unclear flows for follow-up
- Prioritize critical UX issues
- Note non-blocking cosmetic issues separately

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

### 📋 CONSTITUTIONAL COMPLIANCE TESTS

#### T014: Audit Logging Verification
**All Roles**

**Test Steps**:
1. Perform key actions as Admin (approve application, create child)
2. Perform key actions as Teacher (create observation, view student)
3. Perform key actions as Parent (view children, make payment)
4. Query `access_logs` table to verify all actions logged
5. Check log entries contain: userId, schoolId, route, timestamp, success status

**Expected Results**:
- ✅ All admin actions logged in `access_logs`
- ✅ All teacher actions logged in `access_logs`
- ✅ All parent actions logged in `access_logs`
- ✅ Log entries complete with required fields

**Verification Query**:
```sql
SELECT * FROM access_logs
WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@test.com', 'teacher@test.com', 'parent@test.com'))
ORDER BY timestamp DESC LIMIT 50;
```

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

#### T015: RBAC Enforcement
**All Roles**

**Test Steps**:
1. As Admin: Attempt to access teacher-only routes (should succeed for testing)
2. As Teacher: Attempt to access admin routes (should be blocked)
3. As Teacher: Attempt to access other teachers' students (should be blocked)
4. As Parent: Attempt to access admin routes (should be blocked)
5. As Parent: Attempt to access other families' data (should be blocked)
6. Verify unauthorized attempts redirect to `/unauthorized` page

**Expected Results**:
- ✅ Admin can access all routes (superuser)
- ✅ Teacher blocked from admin routes
- ✅ Teacher blocked from unassigned students
- ✅ Parent blocked from admin/teacher routes
- ✅ Parent blocked from other families' data
- ✅ Proper error messages displayed

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

#### T016: Tenant Isolation (Multi-Tenant Data Scoping)
**All Roles**

**Test Steps**:
1. Verify all queries include `schoolId` filter
2. Check that metrics only show data for current school
3. Verify no cross-school data leakage in lists
4. Test that searches only return school-scoped results
5. Confirm that all API responses are scoped by schoolId

**Expected Results**:
- ✅ All queries filter by schoolId
- ✅ Metrics show only school-specific data
- ✅ No cross-tenant data visible
- ✅ API responses properly scoped

**Database Verification**:
```sql
-- Verify all major tables have schoolId or equivalent
SELECT table_name FROM information_schema.columns
WHERE column_name = 'school_id' AND table_schema = 'public';
```

**Actual Results**: _[To be filled during testing]_

**Issues Found**: _[To be documented]_

---

## Reporting (T017-T018)

### T017: Document Test Results
After completing all test cases above, compile a summary report including:
- Total test cases executed
- Pass/fail count
- Performance metrics (page load times)
- Constitutional compliance verification results
- Screenshots of key issues (if any)

### T018: Report Issues to Development Team
For each issue found:
1. Document the issue clearly with steps to reproduce
2. Include screenshots or error logs
3. Categorize as: Critical / High / Medium / Low priority
4. Assign to appropriate development team member
5. Track issue resolution

---

## Summary Template

### Test Execution Summary
- **Date Executed**: _[Date]_
- **Tester**: _[Name]_
- **Environment**: _[Local/Staging/Production]_
- **Total Test Cases**: 16 (T004-T016 + T014-T016 constitutional tests)
- **Passed**: _[Count]_
- **Failed**: _[Count]_
- **Blocked**: _[Count]_
- **Not Tested**: _[Count]_

### Critical Issues Found
_[List critical issues here]_

### High Priority Issues
_[List high priority issues here]_

### Medium/Low Priority Issues
_[List medium/low priority issues here]_

### Recommendations
_[Next steps and recommendations]_

---

## Notes
- Parent dashboard functionality appears limited/not fully implemented
- `extended_access_logs.team_id` still exists but correctly references `schools.id`
- All test cases marked with [P] can be executed in parallel by different testers
- Constitutional compliance tests (T014-T016) are critical for production readiness

---

**Document Version**: 1.0
**Last Updated**: 2025-10-04
**Status**: Ready for Manual Testing
