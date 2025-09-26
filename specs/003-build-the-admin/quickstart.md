# Quickstart: Admin Applications Management

## Overview
This quickstart guide validates the admin applications management feature through key user scenarios. Each scenario includes setup, execution steps, and expected outcomes.

## Prerequisites
- Admin user authenticated with valid JWT token
- Test database with multi-tenant data structure
- Sample application data for testing scenarios
- Next.js development server running (`npm run dev`)

## Test Scenarios

### Scenario 1: View Applications List
**User Story**: Admin can see a list of all applications with status and key details

**Setup**:
1. Seed database with sample applications across different statuses
2. Ensure applications belong to admin's school/tenant
3. Include applications with various submission dates for sorting validation

**Execution Steps**:
1. Navigate to `/admin/applications`
2. Verify page loads with applications list
3. Confirm pagination controls appear if >20 applications
4. Check status indicators (pending, approved, rejected) display correctly

**Expected Outcomes**:
- [ ] Applications list displays with correct tenant scoping
- [ ] Application cards show: child name, parent name, submission date, status
- [ ] Pagination works correctly (if applicable)
- [ ] Loading states handle gracefully
- [ ] No cross-tenant data leakage

### Scenario 2: Filter Applications by Status
**User Story**: Admin can filter applications by status to focus on pending reviews

**Setup**:
1. Ensure database has applications in all three statuses (pending, approved, rejected)
2. Minimum 3 applications per status for meaningful testing

**Execution Steps**:
1. Access `/admin/applications`
2. Select "Pending" filter
3. Verify only pending applications display
4. Select "Approved" filter
5. Verify only approved applications display
6. Reset to "All" status

**Expected Outcomes**:
- [ ] Filter controls work correctly
- [ ] Results update immediately without page refresh
- [ ] Count indicators match filtered results
- [ ] URL updates to reflect filter state
- [ ] Filter state persists on page refresh

### Scenario 3: Search Applications
**User Story**: Admin can search applications by applicant name

**Setup**:
1. Create applications with distinctive child and parent names
2. Include partial name matches for search validation

**Execution Steps**:
1. Enter partial child name in search box
2. Verify matching applications appear
3. Clear search and enter parent name
4. Verify applications with matching parent names appear
5. Test empty search returns all results

**Expected Outcomes**:
- [ ] Search results update in real-time
- [ ] Both child and parent names searchable
- [ ] Partial matches work correctly
- [ ] Search combined with filters works correctly
- [ ] Case-insensitive search functioning

### Scenario 4: View Application Details
**User Story**: Admin can view complete application details

**Setup**:
1. Create application with complete child and parent information
2. Include optional fields (medical conditions, special needs)

**Execution Steps**:
1. Click on application from list
2. Verify detailed view shows all submitted information
3. Confirm all parent information displayed (both parents if applicable)
4. Check read-only nature of all application data

**Expected Outcomes**:
- [ ] All application fields displayed correctly
- [ ] Parent information shows relationship types
- [ ] Optional fields handle null values gracefully
- [ ] No edit controls present (read-only requirement)
- [ ] Back navigation returns to filtered list state

### Scenario 5: Approve Application
**User Story**: Admin can approve application and create child/parent profiles

**Setup**:
1. Create pending application with complete information
2. Prepare test scenario with existing parent (same email)
3. Prepare test scenario with new parents (unique emails)

**Execution Steps**:
1. Navigate to pending application details
2. Click "Approve" button
3. Confirm approval action in modal/dialog
4. Verify success message displays
5. Check application status updates to "Approved"
6. Verify child profile creation
7. Verify parent profile creation/linking

**Expected Outcomes**:
- [ ] Application status changes to "Approved"
- [ ] Child profile created with correct data mapping
- [ ] Parent profiles created or linked based on email matching
- [ ] Parent-child relationships established (max 2 parents)
- [ ] Access log entry created for audit trail
- [ ] Approval action cannot be undone (idempotency)

### Scenario 6: Reject Application
**User Story**: Admin can reject application with optional reason

**Setup**:
1. Create pending application for rejection testing

**Execution Steps**:
1. Navigate to pending application details
2. Click "Reject" button
3. Optionally enter rejection reason
4. Confirm rejection action
5. Verify application status updates to "Rejected"
6. Confirm no child/parent profiles created

**Expected Outcomes**:
- [ ] Application status changes to "Rejected"
- [ ] No child or parent profiles created
- [ ] Rejection reason captured (if provided)
- [ ] Access log entry created for audit trail
- [ ] Rejected application remains permanently in list
- [ ] Rejection action cannot be undone

### Scenario 7: Direct Child Creation
**User Story**: Admin can directly create child profile with parents

**Setup**:
1. Prepare child and parent information
2. Test with existing parent email (link scenario)
3. Test with new parent emails (create scenario)

**Execution Steps**:
1. Click "Add Child" button on applications page
2. Fill child information form
3. Add parent information (1-2 parents)
4. Submit form
5. Verify child profile creation
6. Verify parent linking/creation

**Expected Outcomes**:
- [ ] Child profile created without associated application
- [ ] Parent profiles created or linked correctly
- [ ] Same parent linking rules apply (email matching)
- [ ] Maximum 2 parents enforced
- [ ] Access log entry for direct child creation
- [ ] Form validation works correctly

### Scenario 8: Multi-Tenant Security
**User Story**: Admin can only access applications for their school

**Setup**:
1. Create applications for multiple schools/tenants
2. Use admin user from specific school

**Execution Steps**:
1. Access applications list
2. Verify only applications from admin's school visible
3. Attempt to access application from different school (via URL manipulation)
4. Confirm access denied appropriately

**Expected Outcomes**:
- [ ] Only tenant-scoped applications visible
- [ ] Direct URL access to other tenant data blocked
- [ ] Error handling for unauthorized access
- [ ] Session validation includes tenant checking
- [ ] Database queries properly scoped

### Scenario 9: Audit Trail Validation
**User Story**: All admin actions are logged for audit purposes

**Setup**:
1. Prepare applications for various actions
2. Access to audit log viewing (if available)

**Execution Steps**:
1. Perform approval action
2. Perform rejection action
3. Perform direct child creation
4. View application details
5. Check audit logs for all actions

**Expected Outcomes**:
- [ ] All actions logged with timestamp
- [ ] Admin user ID captured in logs
- [ ] Action details include relevant context
- [ ] Log entries cannot be modified
- [ ] Audit trail supports compliance requirements

## Performance Validation

### Load Testing
**Scenario**: Handle realistic application volumes

**Setup**:
- 1000+ applications in database
- Various filter and search combinations

**Expected Performance**:
- [ ] Page load <200ms for application list
- [ ] Search results <100ms response time
- [ ] Pagination responsive with large datasets
- [ ] Database queries optimized with proper indexing

### Responsive Design
**Scenario**: Admin interface works on different screen sizes

**Testing**:
- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024) 
- [ ] Mobile view (375x667)
- [ ] All interactions remain functional
- [ ] Information hierarchy maintained

## Rollback & Error Handling

### Network Failures
**Scenario**: Handle network interruptions gracefully

**Testing**:
- [ ] Approval/rejection actions handle network failures
- [ ] Optimistic updates rollback on error
- [ ] User feedback for error conditions
- [ ] Data consistency maintained

### Data Integrity
**Scenario**: Ensure data consistency across all operations

**Testing**:
- [ ] Concurrent admin actions handled correctly
- [ ] Database transactions maintain consistency
- [ ] Foreign key constraints enforced
- [ ] Duplicate prevention working

## Sign-off Criteria

**Feature Complete When**:
- [ ] All 9 test scenarios pass consistently
- [ ] Performance benchmarks met
- [ ] Security validations pass
- [ ] Multi-tenant isolation confirmed
- [ ] Audit trail compliance verified
- [ ] Constitutional gates passed
- [ ] Integration tests passing
- [ ] Documentation complete

**Ready for Production When**:
- [ ] Load testing completed (1000+ applications)
- [ ] Security review completed
- [ ] Accessibility compliance verified
- [ ] Admin user training documentation available
- [ ] Backup and recovery procedures tested