# Quickstart Guide: Admin Applications Management

**Feature**: `/admin/applications` page  
**Purpose**: Manual QA validation of application approval/rejection workflows  
**Duration**: ~15 minutes  

## Prerequisites

### Test Data Setup
1. **Admin User Account**: Ensure you have an admin account for testing
2. **Test School**: Admin must be associated with a school/tenant
3. **Sample Applications**: At least 3-5 test applications in different states:
   - 2-3 pending applications with complete data
   - 1 approved application (historical)
   - 1 rejected application (historical)

### Environment Requirements
- Local development environment running
- Database with proper schema and test data
- Email service configured (for welcome emails)
- Admin authentication working

## Test Scenario 1: View Applications Table (3 minutes)

### Step 1.1: Navigate to Applications Page
1. **Action**: Log in as admin user
2. **Navigate**: Go to `/admin/applications` 
3. **Expected**: Page loads within 500ms
4. **Verify**: Applications table displays with columns:
   - Parent Name
   - Child Name  
   - Application Date
   - Program Requested
   - Status
   - Actions

### Step 1.2: Test Filtering and Search
1. **Action**: Use status filter dropdown
2. **Filter**: Select "Pending" status
3. **Expected**: Table shows only pending applications
4. **Action**: Use search box
5. **Search**: Enter parent name from test data
6. **Expected**: Table filters to matching results
7. **Verify**: URL parameters update to preserve state

### Step 1.3: Test Pagination  
1. **Action**: Navigate through pagination if >10 applications
2. **Expected**: Page loads quickly with new data
3. **Verify**: Current page, total count displayed correctly

## Test Scenario 2: Approve Application (5 minutes)

### Step 2.1: Select Pending Application
1. **Action**: Click "Approve" button on pending application
2. **Expected**: Approval form/modal opens
3. **Verify**: Form pre-populated with application data

### Step 2.2: Fill Parent Account Data
1. **Complete**: Parent information form
   - Verify email is unique (not in system)
   - Set temporary password
   - Check "Send welcome email"
2. **Expected**: Form validates input correctly

### Step 2.3: Fill Child Information
1. **Complete**: Child information form
   - Verify child data from application
   - Select program/grade level
   - Set start date
2. **Expected**: Form accepts valid child data

### Step 2.4: Submit Approval
1. **Action**: Click "Approve Application" 
2. **Expected**: 
   - Success message appears
   - Application status changes to "Approved"
   - Parent account created in system
   - Child record created with parent link
   - Enrollment record created
   - Welcome email sent (check logs)

### Step 2.5: Verify Database Changes
1. **Check**: Applications table - status = 'approved'
2. **Check**: Users table - new parent account exists
3. **Check**: Children table - new child record with parentId
4. **Check**: Enrollments table - active enrollment record
5. **Check**: access_logs - approval action logged

## Test Scenario 3: Reject Application (3 minutes)

### Step 3.1: Select Pending Application
1. **Action**: Click "Reject" button on different pending application
2. **Expected**: Rejection form/modal opens

### Step 3.2: Provide Rejection Reason
1. **Enter**: Meaningful rejection reason
   - Example: "Missing immunization records"
2. **Check**: "Notify parent" option
3. **Expected**: Form accepts reason text

### Step 3.3: Submit Rejection
1. **Action**: Click "Reject Application"
2. **Expected**:
   - Success message appears  
   - Application status changes to "Rejected"
   - No parent/child records created
   - Rejection notification sent (if enabled)

### Step 3.4: Verify Rejection
1. **Check**: Applications table - status = 'rejected', reason stored
2. **Check**: No new users or children created
3. **Check**: access_logs - rejection action logged

## Test Scenario 4: Error Handling (2 minutes)

### Step 4.1: Test Duplicate Email Error
1. **Action**: Try to approve application with existing parent email
2. **Expected**: Clear error message about duplicate email
3. **Verify**: No partial records created

### Step 4.2: Test Invalid Data Handling
1. **Action**: Submit approval with invalid child birth date
2. **Expected**: Validation error prevents submission
3. **Verify**: Form highlights validation errors

### Step 4.3: Test Already Processed Application
1. **Action**: Try to approve/reject already processed application
2. **Expected**: Error message about application already processed
3. **Verify**: No status changes occur

## Test Scenario 5: Security and Access Control (2 minutes)

### Step 5.1: Test Admin-Only Access
1. **Action**: Log out, try to access `/admin/applications` as non-admin
2. **Expected**: Redirect to unauthorized page or login

### Step 5.2: Test Multi-Tenant Isolation
1. **Action**: Verify applications shown are only for current admin's school
2. **Expected**: No applications from other schools visible
3. **Verify**: Database queries include schoolId filter

## Performance Validation

### Page Load Performance
- **Target**: Initial page load < 500ms TTFB
- **Measure**: Use browser dev tools Network tab
- **Verify**: Server-side rendering works correctly

### Database Query Efficiency  
- **Check**: No N+1 query problems
- **Verify**: Pagination uses LIMIT/OFFSET efficiently
- **Monitor**: Search queries use appropriate indexes

## Expected Outcomes

### Successful Completion Indicators
- ✅ All applications display correctly with proper filtering
- ✅ Approval workflow creates parent + child + enrollment atomically  
- ✅ Rejection workflow updates status without creating records
- ✅ Error handling prevents partial/invalid states
- ✅ Multi-tenant security enforced throughout
- ✅ Performance targets met for typical usage

### Common Issues to Watch For
- ❌ Partial approvals (parent created but child creation failed)
- ❌ Cross-tenant data leakage in application lists
- ❌ Email failures preventing approval completion
- ❌ Slow pagination with large application sets
- ❌ Session timeouts during approval process

## Rollback Procedures

If issues are found during testing:

1. **Database Cleanup**: Remove any test parent/child records created
2. **Application Reset**: Reset test application statuses to 'pending'
3. **Cache Clear**: Clear any cached application data
4. **Log Review**: Check error logs for transaction failures

## Success Criteria

This quickstart passes if:
- All 5 test scenarios complete without errors
- Performance targets met (< 500ms page loads)
- Security controls properly enforced
- Database transactions work atomically
- Email notifications sent successfully
- No data corruption or partial states observed

## Next Steps After Successful Testing

1. Deploy to staging environment
2. Run full integration test suite
3. Performance testing with larger datasets
4. User acceptance testing with actual admin users
5. Production deployment planning