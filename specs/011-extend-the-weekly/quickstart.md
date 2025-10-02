# Quickstart: Weekly Trends Widget Testing

## Prerequisites
- Admin user account with valid tenant context
- Test data in applications, enrollments, payments, staff_activities, and events tables
- Development environment running with database connection

## Test Scenario 1: Basic Widget Display

### Setup
1. Navigate to `/admin/dashboard` as authenticated Admin user
2. Locate the Weekly Trends widget on the dashboard

### Expected Behavior
- Widget displays within 1 second of page load
- Shows skeleton placeholder during data loading
- Transitions to chart view with real data
- Displays last 7 days of activity by default

### Validation Steps
```typescript
// Visual validation
- [ ] Widget container is visible and properly sized
- [ ] Chart displays with appropriate axes labels
- [ ] Data points are visible for available activity types
- [ ] Color scheme matches dashboard theme

// Data validation  
- [ ] Chart shows exactly 7 days of data
- [ ] Daily counts match database records
- [ ] Zero values displayed for days with no activity
- [ ] Only tenant-scoped data is shown
```

## Test Scenario 2: Activity Type Selection

### Setup
1. On Weekly Trends widget, locate activity type selector controls
2. Toggle different activity types on/off

### Expected Behavior
- Checkboxes/toggles for each activity type (applications, enrollments, payments, staff activities, events)
- Chart updates immediately when selections change
- Legend updates to reflect active metrics

### Validation Steps
```typescript
// Interaction validation
- [ ] All activity type toggles are functional
- [ ] Chart redraws smoothly when selections change
- [ ] Performance remains acceptable with all types selected
- [ ] State persists during widget interaction

// Data validation
- [ ] Toggling off a type removes its data from chart
- [ ] Toggling on a type adds its data to chart
- [ ] Colors remain consistent for each activity type
- [ ] Tooltip shows correct information for each data point
```

## Test Scenario 3: Custom Date Range Selection

### Setup
1. Locate date range picker controls on widget
2. Select custom start and end dates

### Expected Behavior
- Date picker allows selection of any valid date range
- Chart updates to show selected date range
- Performance remains acceptable for ranges up to 30 days

### Validation Steps
```typescript
// Date range validation
- [ ] Date picker enforces valid date selections
- [ ] Start date cannot be after end date
- [ ] Future dates are disabled
- [ ] Maximum range (365 days) is enforced

// Chart validation
- [ ] Chart updates to show selected date range
- [ ] X-axis labels adjust to selected range
- [ ] Data aggregation is correct for selected period
- [ ] Loading state shown during date range changes
```

## Test Scenario 4: Error Handling

### Setup
1. Test various error conditions:
   - Database unavailable
   - Invalid tenant context
   - Network timeout
   - No data available

### Expected Behavior
- Graceful error handling without crashes
- User-friendly error messages
- Fallback UI states
- Silent error logging

### Validation Steps
```typescript
// Error state validation
- [ ] Database errors show "Unable to load data" message
- [ ] Network errors show appropriate loading states
- [ ] Invalid tenant context handled gracefully
- [ ] No sensitive error information exposed to user

// Recovery validation
- [ ] Widget recovers when connection restored
- [ ] Retry mechanisms work appropriately
- [ ] User can manually refresh data
- [ ] Error states don't persist incorrectly
```

## Test Scenario 5: Multi-Tenant Security

### Setup
1. Create test data for multiple tenants
2. Login as Admin from different tenants
3. Verify data isolation

### Expected Behavior
- Each Admin only sees their tenant's data
- No cross-tenant data leakage
- Proper tenant context enforcement

### Validation Steps
```typescript
// Security validation
- [ ] Tenant A admin cannot see Tenant B data
- [ ] API responses include correct tenant_id
- [ ] All database queries include tenant filter
- [ ] Session management handles tenant context properly

// Audit validation
- [ ] All data access is logged to access_logs
- [ ] Logs include correct tenant_id and user_id
- [ ] Failed access attempts are recorded
- [ ] Log entries include timestamp and action details
```

## Performance Benchmarks

### Loading Performance
- Initial widget load: <1 second
- Date range change: <500ms
- Activity type toggle: <200ms
- Chart rendering: <300ms

### Data Accuracy
- Daily counts must match database queries
- Aggregations must be mathematically correct
- Time zone handling must be consistent
- Zero values must be explicitly displayed

### User Experience
- Smooth animations and transitions
- Responsive design on mobile devices
- Accessible keyboard navigation
- Screen reader compatibility

## Automated Test Commands

### Unit Tests
```bash
npm test -- --testPathPattern=weekly-trends
```

### Integration Tests
```bash
npm run test:integration -- --grep "Weekly Trends"
```

### E2E Tests
```bash
npm run test:e2e -- --spec="**/weekly-trends.spec.ts"
```

### Performance Tests
```bash
npm run test:performance -- --scenario=dashboard-widgets
```

## Debugging Checklist

### Common Issues
- [ ] Verify database connection and table existence
- [ ] Check tenant_id filtering in all queries
- [ ] Validate date range calculations and time zones
- [ ] Confirm proper RBAC enforcement
- [ ] Test chart library compatibility and version

### Monitoring Points
- [ ] API response times for trends endpoint
- [ ] Database query performance for aggregations
- [ ] Widget render times in browser
- [ ] Error rates and failure patterns
- [ ] Cache hit rates for performance optimization