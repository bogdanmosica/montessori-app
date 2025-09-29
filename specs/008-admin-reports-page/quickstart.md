# Quickstart: Admin Reports Testing

## Overview
Quick validation steps for the admin reports feature implementation. This guide verifies all user stories and acceptance criteria from the specification.

## Prerequisites
- Admin user account with proper permissions
- Test data: applications, enrollments, payments, activity logs
- Different tenant contexts for multi-tenant testing
- Browser with developer tools for network inspection

## User Story Validation

### Story 1: Generate Application Reports
**Goal**: As an Admin, I can generate a report of applications over a selected date range.

**Steps**:
1. Navigate to `/admin/reports`
2. Select "Applications Report"  
3. Set date range filter (last 30 days)
4. Click "Generate Report"
5. Verify report displays application data
6. Check report includes: application date, parent info, child info, status

**Expected Results**:
- ✅ Report loads within 2 seconds
- ✅ Data is filtered by date range
- ✅ All required columns present
- ✅ Data is tenant-scoped (only current school)

### Story 2: Generate Enrollment Reports  
**Goal**: As an Admin, I can generate a report of enrollments, including linked children and parents.

**Steps**:
1. Select "Enrollments Report"
2. Apply no filters (show all)
3. Generate report
4. Verify parent-child relationships displayed
5. Check enrollment dates and status

**Expected Results**:
- ✅ All active enrollments shown
- ✅ Parent and child data properly linked
- ✅ Enrollment status clearly indicated
- ✅ Monthly fees and program types included

### Story 3: Generate Payment Reports
**Goal**: As an Admin, I can generate a report of payments, including failed charges and refunds.

**Steps**:  
1. Select "Payments Report"
2. Set date range for last 3 months
3. Generate report
4. Verify payment, refund, and failed charge records
5. Check transaction amounts and dates

**Expected Results**:
- ✅ All transaction types included
- ✅ Payment methods displayed
- ✅ Stripe transaction IDs present
- ✅ Failure/refund reasons shown when applicable

### Story 4: Filter Reports by Status
**Goal**: As an Admin, I can filter reports by status (e.g., application status, enrollment status).

**Steps**:
1. Generate Applications Report
2. Filter by "approved" status only  
3. Verify results
4. Change filter to "pending" status
5. Verify different results

**Expected Results**:
- ✅ Filter properly limits results
- ✅ Status values from predefined enums
- ✅ Multiple status selection works
- ✅ Clear filter option available

### Story 5: Export Reports as CSV
**Goal**: As an Admin, I can export any report as CSV for offline use.

**Steps**:
1. Generate any report type
2. Click "Export CSV" button
3. Verify file download initiated
4. Open CSV file and inspect format
5. Check data integrity and completeness

**Expected Results**:
- ✅ CSV file downloads correctly
- ✅ UTF-8 encoding with proper headers
- ✅ All report data included
- ✅ Proper escaping of special characters

### Story 6: Export Reports as PDF
**Goal**: As an Admin, I can export any report as PDF for offline use.

**Steps**:
1. Generate any report type
2. Click "Export PDF" button  
3. Verify PDF download initiated
4. Open PDF and inspect formatting
5. Check professional presentation

**Expected Results**:
- ✅ PDF file downloads correctly
- ✅ Professional layout and formatting
- ✅ All data properly displayed
- ✅ School branding included

### Story 7: View Summarized Metrics
**Goal**: As an Admin, I can view summarized metrics in chart or table format.

**Steps**:
1. Generate Applications Report
2. Check summary statistics at top
3. Verify counts by status
4. Check date range coverage
5. Validate calculation accuracy

**Expected Results**:
- ✅ Summary metrics displayed
- ✅ Accurate counts and calculations
- ✅ Clear visualization of key stats
- ✅ Metrics match detailed data

## Security Testing

### Access Control Validation
**Steps**:
1. Log in as Parent user
2. Attempt to navigate to `/admin/reports`
3. Verify unauthorized redirect
4. Log in as Admin user
5. Verify access granted

**Expected Results**:
- ✅ Non-Admin users blocked from access
- ✅ Admin users have full access
- ✅ Proper redirect to unauthorized page

### Multi-Tenant Isolation
**Steps**:
1. Log in as Admin for School A
2. Generate reports and note data
3. Switch to Admin for School B  
4. Generate same reports
5. Verify different data sets

**Expected Results**:
- ✅ Data properly scoped by tenant
- ✅ No cross-tenant data leakage
- ✅ Each school sees only their data

### Audit Logging
**Steps**:
1. Generate various reports
2. Check access_logs table
3. Verify report generation logged
4. Check proper user attribution

**Expected Results**:
- ✅ All report access logged
- ✅ Proper user and timestamp recording
- ✅ Activity type correctly captured

## Edge Case Testing

### Empty Results
**Steps**:
1. Set date range with no data
2. Generate report
3. Verify graceful handling
4. Check empty state message

**Expected Results**:
- ✅ "No data found" message displayed
- ✅ No errors or crashes
- ✅ Export still available (empty file)

### Large Data Sets
**Steps**:
1. Generate report with >1000 records
2. Monitor response time
3. Test export functionality
4. Check memory usage

**Expected Results**:
- ✅ Report generation under 5 seconds
- ✅ Exports complete successfully  
- ✅ No browser memory issues
- ✅ Proper pagination if needed

### Invalid Filters
**Steps**:
1. Enter invalid date range (end before start)
2. Submit form
3. Verify validation message
4. Test with extreme dates

**Expected Results**:
- ✅ Form validation prevents submission
- ✅ Clear error messages shown
- ✅ User guidance provided

## Performance Benchmarks

### Response Times
- Report generation: <2 seconds
- CSV export: <3 seconds  
- PDF export: <5 seconds
- Page load: <1 second

### Data Volume Limits
- Maximum records per report: 10,000
- Date range limit: 2 years
- Concurrent user support: 50 admins

### Browser Compatibility
- Chrome 90+: Full support
- Firefox 88+: Full support
- Safari 14+: Full support  
- Mobile responsive: All features

## Acceptance Criteria Verification

### Functional Requirements Check
- [x] FR-001: Admin-only access enforced
- [x] FR-002: Tenant-scoped data confirmed
- [x] FR-003: All report types available
- [x] FR-004: Date filtering works
- [x] FR-005: Status filtering works
- [x] FR-006: CSV export functions
- [x] FR-007: Tabular display correct
- [x] FR-008: Summary metrics shown
- [x] FR-009: Enum values used consistently
- [x] FR-010: Empty states handled
- [x] FR-011-013: Report data complete
- [x] FR-014: PDF export functions
- [x] FR-015: Synchronous generation
- [x] FR-016: Full PII included
- [x] FR-017: On-demand generation
- [x] FR-018: No scheduling features

### Constitutional Compliance
- [x] Micro functions used throughout
- [x] Client components minimal
- [x] shadcn/ui components consistent  
- [x] Multi-tenant security enforced
- [x] Database queries optimized
- [x] No hardcoded values
- [x] Specification-driven implementation

## Troubleshooting Common Issues

### Report Generation Fails
1. Check database connection
2. Verify tenant ID in session
3. Validate filter parameters
4. Check server logs for errors

### Export Not Working
1. Verify file permissions
2. Check browser download settings
3. Test with different browsers
4. Monitor network requests

### Performance Issues  
1. Check database indexes
2. Analyze query performance
3. Monitor memory usage
4. Consider data volume limits

### Access Denied Errors
1. Verify user role in database
2. Check session validity
3. Test middleware configuration
4. Review RBAC implementation

## Success Criteria
✅ All user stories validated successfully
✅ Security requirements met
✅ Performance benchmarks achieved  
✅ Edge cases handled properly
✅ Constitutional compliance confirmed

The admin reports feature is ready for production use when all items above are verified and passing.