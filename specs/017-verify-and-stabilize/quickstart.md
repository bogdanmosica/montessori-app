# Quickstart: Manual User Test Cases

## Overview
This quickstart provides step-by-step manual test cases for verifying the stability and correctness of Montessori-App after the database migration (teams → schools, teamMembers → schoolMembers). It includes constitutional compliance checks for audit logging, RBAC, and tenant isolation.

## Prerequisites
- Database migration to `schools` and `schoolMembers` completed
- Test accounts for Admin, Teacher, Parent roles
- Access to all relevant dashboards and list/payment pages

## Test Cases

### 1. Admin Dashboard Metrics
- Log in as Admin
- Navigate to dashboard
- Verify metrics load without errors (within 2 seconds)
- Check for missing or incorrect data
- Confirm actions are logged in `access_logs`
- Confirm only school-specific data is visible
- Attempt unauthorized access and verify RBAC enforcement

### 2. Applications List
- Log in as Admin
- Navigate to applications list
- Confirm all applications display correctly
- Check for broken queries or missing entries
- Confirm actions are logged in `access_logs`
- Confirm only school-specific data is visible
- Attempt unauthorized access and verify RBAC enforcement

### 3. Enrollments List
- Log in as Admin
- Navigate to enrollments list
- Confirm all enrollments display correctly
- Check for broken queries or missing entries
- Confirm actions are logged in `access_logs`
- Confirm only school-specific data is visible
- Attempt unauthorized access and verify RBAC enforcement

### 4. Payments Flow
- Log in as Admin
- Navigate to payments/subscription/invoices pages
- Verify subscription details and invoices load without errors
- Check for correct school references
- Confirm actions are logged in `access_logs`
- Confirm only school-specific data is visible
- Attempt unauthorized access and verify RBAC enforcement

### 5. Teacher Dashboard & Students List
- Log in as Teacher
- Navigate to dashboard and students list
- Confirm all students display correctly
- Check for missing data or errors
- Confirm actions are logged in `access_logs`
- Confirm only school-specific data is visible
- Attempt unauthorized access and verify RBAC enforcement

### 6. Parent Dashboard & Children List
- Log in as Parent
- Navigate to dashboard and children list
- Confirm all children display correctly
- Check for missing data or errors
- Confirm actions are logged in `access_logs`
- Confirm only school-specific data is visible
- Attempt unauthorized access and verify RBAC enforcement
- Make a payment and verify it is tied to a single schoolId

## Edge Case Validation
- Attempt to access dashboards/lists with legacy references (teams/teamMembers)
- Note any errors or failures
- Record any ambiguous or unclear flows for follow-up

## Reporting
- Document all test steps and outcomes
- Report any issues to development team for resolution

---
