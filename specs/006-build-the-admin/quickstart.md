# Quickstart Guide: Admin Enrollments Management

**Date**: September 27, 2025  
**Feature**: Admin Enrollments Management  
**Audience**: School Administrators

## Prerequisites

**Access Requirements**:
- Valid admin account with login credentials
- Admin role permissions for your school
- Browser with JavaScript enabled

**Test Data**: 
- At least one existing child record in the system (or ability to create one)
- Admin user authenticated and logged in

## Quick Test Scenarios

### Scenario 1: View Existing Enrollments

**Objective**: Verify admin can view all current enrollments

**Steps**:
1. Navigate to `/admin/enrollments`
2. Verify admin-only access (redirects if not admin)
3. View enrollments list with child details

**Expected Results**:
- Page loads without errors
- Enrollments table displays with columns: Child Name, Status, Enrollment Date, Parent Name
- Filter options available: Status (Active, Inactive, Withdrawn, Archived)
- Search box functional for child/parent names
- Pagination controls if >20 enrollments

**Success Criteria**: 
- ✅ Admin can access the page
- ✅ Enrollment data displays correctly
- ✅ Filtering and search work as expected

---

### Scenario 2: Create New Enrollment (New Child)

**Objective**: Admin can enroll a new child not previously in the system

**Steps**:
1. From `/admin/enrollments`, click "Add New Enrollment"
2. Select "Create New Child" option
3. Fill child information:
   - First Name: "Emma"
   - Last Name: "Johnson"  
   - Date of Birth: "2019-03-15"
   - Parent Name: "Sarah Johnson"
   - Parent Email: "sarah.johnson@email.com"
   - Parent Phone: "+1-555-0123"
4. Fill enrollment details:
   - Enrollment Date: Today's date
   - Notes: "New student enrollment"
5. Submit form

**Expected Results**:
- Form validates all required fields
- Child record created successfully
- Enrollment record created with 'active' status
- Success message displayed
- Redirected to enrollments list with new enrollment visible

**Success Criteria**:
- ✅ Child and enrollment created atomically
- ✅ New enrollment appears in list with correct status
- ✅ Child details are complete and accurate

---

### Scenario 3: Create New Enrollment (Existing Child)  

**Objective**: Admin can enroll an existing child (e.g., returning student)

**Prerequisites**: Existing child record with no active enrollment

**Steps**:
1. From `/admin/enrollments`, click "Add New Enrollment"
2. Select "Link Existing Child" option
3. Search for existing child by name
4. Select child from results
5. Fill enrollment details:
   - Enrollment Date: Today's date  
   - Notes: "Returning student"
6. Submit form

**Expected Results**:
- Child search returns accurate results
- Child selection populates form correctly
- Enrollment created successfully
- Existing child record remains unchanged

**Success Criteria**:
- ✅ Can find and select existing children
- ✅ Enrollment links correctly to existing child
- ✅ No duplicate child records created

---

### Scenario 4: Edit Enrollment Details

**Objective**: Admin can modify enrollment information and child details

**Prerequisites**: At least one active enrollment exists

**Steps**:
1. From enrollments list, click "Edit" on an active enrollment
2. Modify enrollment details:
   - Update notes: "Updated enrollment information"
   - Optionally change status to "Inactive"
3. Modify child details (if needed):
   - Update parent email or phone
4. Submit changes

**Expected Results**:
- Form pre-populated with current data
- Changes save successfully
- Updated information reflected in enrollments list
- Both enrollment and child records updated

**Success Criteria**:
- ✅ Form displays current data correctly
- ✅ Changes persist after submission
- ✅ Child and enrollment updates synchronized

---

### Scenario 5: Withdraw Enrollment (Soft Delete)

**Objective**: Admin can withdraw a student enrollment (status change to "withdrawn")

**Prerequisites**: At least one active enrollment exists

**Steps**:
1. From enrollments list, click "Remove" on an active enrollment
2. Confirm withdrawal action in dialog
3. Optionally add withdrawal notes: "Student moved to different school"
4. Confirm withdrawal

**Expected Results**:
- Confirmation dialog appears with clear warning
- Enrollment status changes to "withdrawn"
- Withdrawal date automatically set to today
- Related educational records automatically archived
- Child record remains in system unchanged
- Enrollment still visible in list with "withdrawn" status

**Success Criteria**:
- ✅ Enrollment marked as withdrawn, not deleted
- ✅ Child record preserved
- ✅ Related records archived per business rules
- ✅ Audit trail maintained

---

### Scenario 6: Search and Filter Enrollments

**Objective**: Admin can efficiently find specific enrollments

**Test Data**: Multiple enrollments with different statuses and names

**Steps**:
1. **Test Status Filtering**:
   - Select "Active" filter → verify only active enrollments shown
   - Select "Withdrawn" filter → verify only withdrawn enrollments shown
   - Select "All" → verify all enrollments shown

2. **Test Search Function**:
   - Search by child first name → verify matching results
   - Search by child last name → verify matching results  
   - Search by parent name → verify matching results
   - Search with partial names → verify partial matches work

3. **Test Combined Filtering**:
   - Set status filter + search term → verify both criteria applied
   - Clear filters → verify all enrollments return

**Expected Results**:
- Filtering works independently and in combination
- Search is case-insensitive and supports partial matches
- Results update immediately when filters change
- Clear indicators when no results found

**Success Criteria**:
- ✅ All filter combinations work correctly
- ✅ Search performance is acceptable (<2 seconds)
- ✅ Results accurately match filter criteria

---

### Scenario 7: Prevent Duplicate Active Enrollments

**Objective**: System prevents enrolling a child who already has an active enrollment

**Prerequisites**: One child with an existing active enrollment

**Steps**:
1. Attempt to create new enrollment for child with active enrollment
2. Select the child with existing active enrollment
3. Try to submit enrollment form

**Expected Results**:
- Error message appears: "Child already has an active enrollment"
- Form does not submit
- Clear guidance on how to resolve (withdraw existing enrollment first)
- No duplicate enrollment records created

**Success Criteria**:
- ✅ System blocks duplicate active enrollments
- ✅ Clear error messaging provided
- ✅ Data integrity maintained

---

### Scenario 8: Access Control Verification  

**Objective**: Verify admin-only access and tenant isolation

**Test Cases**:

**8a. Non-Admin Access**:
1. Log in with Teacher or Parent account
2. Attempt to navigate to `/admin/enrollments`
3. Expected: Redirected to unauthorized page

**8b. Cross-Tenant Isolation**:
1. Log in as Admin from School A
2. View enrollments list
3. Expected: Only see enrollments for School A, never School B

**Success Criteria**:
- ✅ Non-admins cannot access enrollment management
- ✅ Admins only see their school's data
- ✅ No cross-tenant data leakage

---

## Performance Verification

### Load Testing Scenarios

**Scenario 9: Large Dataset Performance**

**Setup**: 1000+ enrollments in system

**Tests**:
- List page loads in <3 seconds
- Search returns results in <2 seconds  
- Filter changes apply in <1 second
- Pagination navigation is responsive

**Success Criteria**:
- ✅ Acceptable performance with realistic data volumes
- ✅ No timeout errors under normal load

---

## Troubleshooting Common Issues

### Issue 1: "Child already has an active enrollment"
**Cause**: Attempting to enroll child with existing active enrollment
**Solution**: First withdraw existing enrollment, then create new one

### Issue 2: "Access denied" when viewing enrollments
**Cause**: User does not have admin role
**Solution**: Verify admin role assignment with system administrator

### Issue 3: Child not found during enrollment creation
**Cause**: Child record may not exist or be in different school
**Solution**: Create new child record or verify correct school context

### Issue 4: Form validation errors
**Cause**: Required fields missing or invalid data formats
**Solution**: Check all required fields and date formats (YYYY-MM-DD)

---

## Success Validation Checklist

After completing all scenarios, verify:

**Functionality**:
- [ ] Can view all enrollments with proper filtering
- [ ] Can create enrollments with new children
- [ ] Can create enrollments with existing children  
- [ ] Can edit enrollment and child details
- [ ] Can withdraw enrollments (soft delete)
- [ ] Search and filtering work correctly
- [ ] Duplicate enrollment prevention works

**Security**:
- [ ] Admin-only access enforced
- [ ] Tenant isolation working (only see own school's data)
- [ ] Session management handles role changes

**Performance**:
- [ ] Page loads are acceptable (<3 seconds)
- [ ] Search performs well with realistic data
- [ ] No timeout errors during normal usage

**Data Integrity**:
- [ ] Child records preserved during enrollment withdrawal
- [ ] Foreign key relationships maintained
- [ ] Audit trail captures all changes
- [ ] Status transitions follow business rules

This quickstart guide validates all core functionality and ensures the enrollment management system meets business requirements and technical standards.