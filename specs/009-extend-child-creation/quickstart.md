# Quickstart: Child Fee Management

## Feature Overview
This guide walks through testing the child fee management feature from the Admin perspective. The feature allows Admins to set optional monthly fees in RON when creating children and enrollments, with a hybrid model supporting both child default fees and enrollment-specific overrides.

## Prerequisites
- Admin user account with valid session
- PostgreSQL database with updated schema (enrollments.monthly_fee_override column)
- Next.js development server running on localhost:3000

## Test Scenarios

### Scenario 1: Create Child with Monthly Fee
**Goal**: Verify Admin can set a monthly fee when creating a child

**Steps**:
1. Navigate to `/admin/enrollments/new`
2. Fill required child information:
   - First Name: "Maria"
   - Last Name: "Popescu"  
   - Date of Birth: "2018-06-15"
   - Start Date: "2025-09-01"
3. Set monthly fee: "1500" (RON)
4. Submit form
5. Navigate to child details page

**Expected Results**:
- Child is created successfully
- Monthly fee displays as "1,500 RON" in child details
- Database stores `monthlyFee` as `150000` (cents)
- Access log entry created for `CHILD_CREATED` action

**API Calls**:
```
POST /api/admin/children
{
  "firstName": "Maria",
  "lastName": "Popescu", 
  "dateOfBirth": "2018-06-15T00:00:00Z",
  "startDate": "2025-09-01T00:00:00Z",
  "monthlyFee": 1500
}

Response: 201 Created
{
  "id": "child-uuid",
  "monthlyFee": 150000,
  "monthlyFeeDisplay": "1,500 RON"
}
```

### Scenario 2: Create Child without Fee (Optional)
**Goal**: Verify fee field is optional during child creation

**Steps**:
1. Navigate to `/admin/enrollments/new`
2. Fill required child information (different child)
3. Leave monthly fee field empty
4. Submit form
5. Check child details

**Expected Results**:
- Child is created successfully
- Monthly fee displays as "No fee set" or "Free enrollment"
- Database stores `monthlyFee` as `0` (cents)

### Scenario 3: Create Enrollment with Fee Override
**Goal**: Verify enrollment can override child's default fee

**Steps**:
1. Use child from Scenario 1 (has 1500 RON default fee)
2. Navigate to enrollment creation for that child
3. Set enrollment fee override: "1200" (RON)
4. Submit enrollment
5. View enrollment details

**Expected Results**:
- Enrollment created with override fee
- Effective fee displays as "1,200 RON" (not "1,500 RON")
- Database stores `monthlyFeeOverride` as `120000` (cents)
- No mention of child default fee in display (per clarifications)

**API Calls**:
```
POST /api/admin/enrollments
{
  "childId": "child-uuid",
  "monthlyFeeOverride": 1200
}

Response: 201 Created  
{
  "id": "enrollment-uuid",
  "monthlyFeeOverride": 120000,
  "effectiveFee": 120000,
  "effectiveFeeDisplay": "1,200 RON"
}
```

### Scenario 4: Update Child Default Fee  
**Goal**: Verify Admin can modify child fee after creation

**Steps**:
1. Navigate to child edit page for Maria Popescu
2. Update monthly fee from "1500" to "1750" (RON)
3. Save changes
4. Verify updated fee in child details
5. Check that enrollments without override now show new default

**Expected Results**:
- Child fee updated successfully
- New fee displays as "1,750 RON"
- Existing enrollments without override use new default
- Enrollments with override remain unchanged
- Access log entry for `CHILD_FEE_UPDATED`

### Scenario 5: Fee Validation Testing
**Goal**: Verify proper validation of fee inputs

**Test Cases**:

**Negative Fee**:
1. Try to set child fee to "-100"
2. Expected: Validation error "Fee cannot be negative"

**Excessive Fee**:  
1. Try to set fee to "15000" (above 10K RON limit)
2. Expected: Validation error "Fee cannot exceed 10,000 RON"

**Non-numeric Input**:
1. Try to enter "abc" in fee field
2. Expected: Client-side validation prevents submission

**Zero Fee**:
1. Set fee to "0"
2. Expected: Accepts and displays as "Free enrollment" or "0 RON"

### Scenario 6: Multi-tenant Isolation
**Goal**: Verify fees are properly scoped to school

**Prerequisites**: Two different school Admin accounts

**Steps**:
1. Create child with fee in School A
2. Login as Admin for School B  
3. Attempt to view/modify School A child
4. Create child in School B with different fee

**Expected Results**:
- School A child not visible to School B Admin
- School B Admin can only see/modify their school's children
- Fee data isolated between schools
- All queries properly scoped by `schoolId`

### Scenario 7: Display Logic Validation
**Goal**: Test various fee display combinations

**Test Matrix**:
| Child Default | Enrollment Override | Expected Display |
|---------------|-------------------|------------------|
| 1500 RON | null | "1,500 RON" |
| 1500 RON | 1200 RON | "1,200 RON" |
| 0 RON | null | "Free enrollment" |
| 0 RON | 800 RON | "800 RON" |
| null/unset | 1000 RON | "1,000 RON" |

## Performance Testing

### Load Testing
1. Create 100 children with fees concurrently
2. Measure response times (target: <200ms)
3. Verify database connection pool handling
4. Test form submission under load

### Query Performance
1. Create 1000+ children/enrollments with fees
2. Test fee resolution queries
3. Verify index usage on `schoolId`
4. Monitor database query execution plans

## Error Handling Verification

### Network Errors
1. Simulate network failure during fee submission
2. Expected: Proper error message, form state preservation
3. Test retry mechanism

### Authorization Errors
1. Login as Teacher/Parent role
2. Try to access fee management pages
3. Expected: Redirect to unauthorized page

### Database Errors
1. Simulate database connection failure
2. Expected: Graceful error message, no data loss

## Browser Compatibility
Test fee input and display across:
- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Edge (latest)

Focus on:
- Currency formatting consistency
- Form validation behavior
- Responsive design on mobile

## Accessibility Testing
1. Navigate fee forms using keyboard only
2. Test screen reader compatibility with fee displays
3. Verify proper ARIA labels on fee inputs
4. Check color contrast for validation errors

## Final Validation Checklist
- [ ] Child creation with fee works correctly
- [ ] Child creation without fee works correctly
- [ ] Enrollment fee override functions properly
- [ ] Fee validation prevents invalid inputs
- [ ] Currency formatting displays consistently
- [ ] Multi-tenant isolation is enforced
- [ ] Access logging captures fee operations
- [ ] Performance meets targets (<200ms)
- [ ] Error handling is graceful
- [ ] Mobile responsiveness works
- [ ] Keyboard accessibility is functional

## Rollback Test
If issues are found:
1. Test database migration rollback
2. Verify existing functionality unaffected
3. Ensure graceful handling of missing fee data
4. Test backward compatibility with old forms

## Success Criteria
✅ All test scenarios pass without errors  
✅ Performance targets met (<200ms response times)  
✅ No security vulnerabilities in fee handling  
✅ Proper multi-tenant data isolation  
✅ Consistent currency display across all browsers  
✅ Accessibility standards met (WCAG 2.1 AA)  
✅ Database integrity maintained throughout testing