# Quickstart: Admin Dashboard Controls & Settings

**Feature**: Admin Dashboard Refresh & Settings  
**Date**: September 30, 2025  
**Estimated Time**: 15 minutes  
**Prerequisites**: Admin user account, existing montessori-app installation

## Overview
This quickstart validates the Admin Dashboard Controls & Settings feature by testing both the refresh functionality and settings management through a realistic admin workflow.

## Test Scenarios

### Scenario 1: Dashboard Refresh Functionality
**User Story**: As an Admin, I can click a Refresh button to reload dashboard metrics without page reload

#### Steps
1. **Setup**: Login as Admin user and navigate to `/admin/dashboard`
2. **Verify Initial State**: 
   - Dashboard displays current metrics (student counts, financial data, alerts)
   - Refresh button is visible and accessible
3. **Test Refresh**: 
   - Click the Refresh button
   - Observe loading indicator appears
   - Verify metrics update without full page reload
   - Confirm timestamp/last updated indicator changes
4. **Test Error Handling**:
   - Simulate network failure (disconnect internet)
   - Click Refresh button
   - Verify error message displays with retry option
   - Reconnect and verify retry works

**Expected Results**:
- ✅ Refresh button triggers `/api/admin/metrics` request
- ✅ Dashboard updates without page navigation
- ✅ Loading states provide user feedback
- ✅ Error states handled gracefully with recovery options

### Scenario 2: Settings Page Navigation
**User Story**: As an Admin, I can navigate to settings from dashboard

#### Steps
1. **Setup**: From `/admin/dashboard` logged in as Admin
2. **Navigate to Settings**:
   - Locate Settings button on dashboard
   - Click Settings button
   - Verify navigation to `/admin/dashboard/settings`
3. **Verify Access Control**:
   - Confirm settings page loads for Admin users
   - Test direct URL access without Admin role (should redirect/error)

**Expected Results**:
- ✅ Settings button visible only to Admin users
- ✅ Navigation works without errors
- ✅ Settings page loads correctly
- ✅ Non-admin users blocked from settings access

### Scenario 3: Settings Configuration
**User Story**: As an Admin, I can configure default monthly fee and free enrollment count

#### Steps
1. **Setup**: Navigate to `/admin/dashboard/settings` as Admin
2. **View Current Settings**:
   - Page loads with current values (or defaults if unset)
   - Form fields display properly with validation messages
3. **Update Settings**:
   - Set default monthly fee to 200.50 RON
   - Set free enrollment count to 10
   - Submit form
   - Verify success message displays
4. **Verify Persistence**:
   - Refresh page or navigate away and back
   - Confirm saved values persist correctly
5. **Test Validation**:
   - Try negative fee amount (should show error)
   - Try non-integer enrollment count (should show error)
   - Try extremely large values (should show limits)

**Expected Results**:
- ✅ Settings form loads current values
- ✅ Valid updates save successfully
- ✅ Settings persist across sessions
- ✅ Validation prevents invalid inputs
- ✅ User feedback for all operations

### Scenario 4: Multi-Tenant Isolation
**User Story**: Settings are isolated between different schools

#### Steps
1. **Setup**: Two Admin users from different schools
2. **Admin A Actions**:
   - Login as Admin from School A
   - Set monthly fee to 150.00 RON, enrollment count to 5
   - Save settings
3. **Admin B Actions**:
   - Login as Admin from School B
   - Verify settings page shows different/default values
   - Set monthly fee to 300.00 RON, enrollment count to 15
   - Save settings
4. **Verify Isolation**:
   - Switch back to Admin A
   - Verify settings still show 150.00 RON and 5 enrollments
   - Switch to Admin B
   - Verify settings show 300.00 RON and 15 enrollments

**Expected Results**:
- ✅ Each school's settings stored independently
- ✅ No cross-contamination between schools
- ✅ Admin users only see their school's settings

### Scenario 5: Settings Application in Workflows
**User Story**: Saved settings apply to child enrollment creation

#### Steps
1. **Setup**: Admin has configured default fee (175.00 RON) and enrollment count (8)
2. **Create New Child Enrollment**:
   - Navigate to child creation workflow
   - Start new enrollment process
   - Verify default monthly fee pre-populated with 175.00 RON
3. **Test Enrollment Limits**:
   - Attempt to create more than 8 free enrollments
   - Verify system enforces the limit appropriately
4. **Verify Overrides Work**:
   - Create enrollment with different fee amount
   - Confirm override works while default remains unchanged

**Expected Results**:
- ✅ Default fee appears in enrollment forms
- ✅ Free enrollment limits enforced
- ✅ Manual overrides function correctly
- ✅ Defaults don't change when overridden

## Performance Validation

### Dashboard Refresh Performance
**Target**: <200ms refresh time

#### Test Steps
1. Open browser developer tools
2. Navigate to Network tab
3. Click dashboard Refresh button
4. Measure time from request start to UI update

**Success Criteria**: 
- API response time <150ms
- Total UI update time <200ms

### Settings Page Performance  
**Target**: <100ms initial load, <200ms save operation

#### Test Steps
1. Navigate to settings page with dev tools open
2. Measure initial page load time
3. Make settings changes and measure save operation time

**Success Criteria**:
- Initial load <100ms
- Save operation <200ms

## Security Validation

### Access Control Tests
1. **Non-Admin Access**: Verify non-admin users cannot access settings
2. **Cross-Tenant Access**: Verify admins cannot access other schools' settings
3. **Session Validation**: Verify expired sessions redirect to login

### Audit Trail Validation
1. **Settings Changes**: Verify changes logged to access_logs table
2. **Refresh Actions**: Verify refresh actions logged (if configured)
3. **Failed Attempts**: Verify unauthorized access attempts logged

## Troubleshooting

### Common Issues

#### Refresh Button Not Working
- **Check**: Network connectivity
- **Check**: Admin role in session
- **Check**: `/api/admin/metrics` endpoint availability
- **Solution**: Verify middleware and role checking

#### Settings Not Saving
- **Check**: Form validation errors
- **Check**: Database connectivity  
- **Check**: School ID in session
- **Solution**: Check browser console and server logs

#### Multi-Tenant Issues
- **Check**: Session school_id value
- **Check**: Database query filtering
- **Solution**: Verify middleware tenant scoping

#### Performance Issues
- **Check**: Database query optimization
- **Check**: Network latency
- **Solution**: Add query indexes, optimize frontend bundle

### Validation Checklist

#### Functional Requirements
- [ ] FR-001: Refresh button displays and functions
- [ ] FR-002: Settings button displays and navigates  
- [ ] FR-003: Admin-only access enforced
- [ ] FR-004: Settings page accessible at correct URL
- [ ] FR-005: Monthly fee setting works
- [ ] FR-006: Enrollment count setting works
- [ ] FR-007: Multi-tenant scoping works
- [ ] FR-008: Settings persist correctly
- [ ] FR-009: Default fee applies to enrollments
- [ ] FR-010: Enrollment limits enforced
- [ ] FR-011: Fee validation prevents negatives
- [ ] FR-012: Count validation prevents negatives
- [ ] FR-013: Refresh errors handled gracefully

#### Performance Requirements
- [ ] Dashboard refresh <200ms
- [ ] Settings load <100ms
- [ ] Settings save <200ms

#### Security Requirements
- [ ] Admin role enforcement
- [ ] Multi-tenant isolation
- [ ] Audit trail creation
- [ ] Input validation
- [ ] Error message sanitization

## Success Criteria

### Functional Success
- All user scenarios complete without errors
- All validation rules enforced correctly
- Multi-tenant isolation verified
- Performance targets met

### Technical Success
- Constitution compliance verified
- API contracts followed
- Database schema properly extended
- Security controls functioning

### User Experience Success
- Intuitive navigation between dashboard and settings
- Clear feedback for all user actions
- Graceful error handling and recovery
- Consistent UI patterns with existing application

## Next Steps
After successful quickstart validation:
1. Feature ready for production deployment
2. Monitor performance metrics in production
3. Gather admin user feedback for UX improvements
4. Plan additional settings features based on usage patterns