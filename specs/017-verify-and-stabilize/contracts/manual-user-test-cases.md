# Manual User Test Cases Contract

## Purpose
Defines the manual test scenarios for verifying Montessori-App stability after database migration. No automated or code-based tests are included in this phase. Includes constitutional compliance checks for audit logging, RBAC, and tenant isolation.

## Test Scenarios

### Admin
- Dashboard metrics load without errors (within 2 seconds)
- Applications list displays correctly
- Enrollments list displays correctly
- Payments/subscription/invoices pages load and reference correct school
- Actions are logged in `access_logs`
- Only school-specific data is visible
- RBAC enforcement prevents unauthorized access

### Teacher
- Dashboard loads without errors
- Students list displays correctly
- Actions are logged in `access_logs`
- Only school-specific data is visible
- RBAC enforcement prevents unauthorized access

### Parent
- Dashboard loads without errors
- Children list displays correctly
- Make a payment and verify it is tied to a single schoolId
- Actions are logged in `access_logs`
- Only school-specific data is visible
- RBAC enforcement prevents unauthorized access

## Edge Cases
- Attempt access with legacy references (teams/teamMembers); note any errors or failures
- Record any ambiguous or unclear flows for follow-up

## Reporting
- Document all test steps and outcomes
- Report issues for follow-up

---
