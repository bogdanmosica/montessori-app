# Quickstart: Admin Dashboard Testing

## Prerequisites
- Next.js development server running (`pnpm dev`)
- PostgreSQL database with test data seeded
- Admin user account with proper role permissions
- Super Admin account for cross-school testing (if applicable)

## Test Scenarios

### Scenario 1: Admin Dashboard Load Performance with Cashflow
**Given**: Admin user is authenticated with school that has families and children  
**When**: Navigate to `/admin/dashboard`  
**Then**: Dashboard should load with TTFB < 500ms and display all metrics including cashflow

**Test Steps**:
1. Sign in as admin: `admin@testschool.edu` / `admin123`
2. Navigate to `http://localhost:3000/admin/dashboard` 
3. Open browser DevTools Network tab
4. Verify TTFB (Time to First Byte) < 500ms
5. Confirm all metric cards display without loading spinners
6. Check cashflow metrics show current revenue, sibling discounts
7. Verify capacity utilization displays as percentage
8. Check trends chart renders with revenue and capacity data

### Scenario 2: Security Alerts Display
**Given**: There are active security alerts for the school  
**When**: Admin loads dashboard  
**Then**: Alerts banner should prominently display with proper severity styling

**Test Steps**:
1. Create test security alert: Failed login attempt
2. Refresh dashboard page
3. Verify alert banner appears at top of dashboard
4. Check severity color coding (red for high, yellow for medium)
5. Confirm alert message is clear and actionable
6. Test alert dismissal functionality

### Scenario 3: Empty State Handling
**Given**: New school with no historical data  
**When**: Admin views dashboard  
**Then**: Empty states should show helpful guidance instead of blank areas

**Test Steps**:
1. Create new test school with minimal data
2. Sign in as admin of new school
3. Navigate to dashboard
4. Verify empty states for trends chart show "No data yet" message
5. Check that metric cards show "0" values with proper styling
6. Confirm empty states include actionable guidance text

### Scenario 4: Super Admin Aggregated View
**Given**: Super Admin user is authenticated  
**When**: Access dashboard  
**Then**: Should display system-wide metrics across all schools

**Test Steps**:
1. Sign in as Super Admin: `superadmin@montesms.com` / `super123`
2. Navigate to dashboard
3. Verify metrics show totals across multiple schools
4. Check that individual school names are not exposed
5. Confirm aggregated security summary displays
6. Test system health indicators

### Scenario 5: Real-time Alert Updates
**Given**: Admin dashboard is loaded  
**When**: New security alert is triggered  
**Then**: Alert should appear without page refresh

**Test Steps**:
1. Keep dashboard open in browser
2. Trigger failed login attempts (3+ in 10 minutes)
3. Wait for alert processing (< 1 minute)
4. Verify new alert appears in banner
5. Check timestamp accuracy
6. Confirm alert metadata is populated correctly

### Scenario 7: Cashflow and Sibling Discount Validation
**Given**: School has families with multiple children and configured sibling discounts  
**When**: Admin views cashflow metrics on dashboard  
**Then**: Should display accurate revenue calculations with sibling discounts applied

**Test Steps**:
1. Create test data: Family with 3 children, 20% discount on 2nd child, 30% on 3rd
2. Base fee: $650 per child
3. Expected family fee: $650 + ($650 * 0.8) + ($650 * 0.7) = $1625
4. Sign in as admin and view dashboard
5. Verify cashflow metrics show correct total revenue
6. Check that discount savings are properly calculated
7. Confirm family count and average revenue per family are accurate

### Scenario 8: Capacity Management Display
**Given**: School has defined capacity limits by age group  
**When**: Admin views enrollment capacity metrics  
**Then**: Should show current utilization and available spots by age group

**Test Steps**:
1. Set test capacity: Toddler (40), Primary (120), Elementary (40)
2. Enroll children across different age groups
3. View dashboard capacity metrics
4. Verify total capacity utilization percentage is correct
5. Check age group breakdown shows available spots
6. Confirm capacity alerts appear when nearing limits
**Given**: Dashboard is displaying metrics  
**When**: Click on metric cards  
**Then**: Should navigate to detailed pages

**Test Steps**:
1. Click on "Pending Applications" card
2. Verify navigation to `/admin/applications` page
3. Return to dashboard, click "Active Enrollments" 
4. Verify navigation to `/admin/enrollments` page
5. Test all clickable metric cards
6. Confirm back navigation maintains dashboard state

## API Testing

### Test Cashflow Calculations
```bash
# Test revenue metrics with sibling discounts
curl -w "@curl-format.txt" \
  "http://localhost:3000/api/admin/metrics?includeCashflow=true" \
  -H "Cookie: [admin-session-cookie]"

# Verify revenue calculations are correct
# Check sibling discount savings match expected amounts
# Confirm family count and average revenue calculations
```

### Test Capacity Metrics
```bash
# Test capacity utilization by age group
curl -w "@curl-format.txt" \
  "http://localhost:3000/api/admin/metrics?includeCapacity=true" \
  -H "Cookie: [admin-session-cookie]"

# Verify capacity percentages are accurate
# Check age group breakdowns sum to total
# Confirm available spots calculations
```
```bash
# Test single school metrics
curl -w "@curl-format.txt" \
  http://localhost:3000/api/admin/metrics \
  -H "Cookie: [admin-session-cookie]"

# Verify response time < 300ms
# Check all required fields present
```

### Test Super Admin Aggregation
```bash
# Test system-wide metrics  
curl -w "@curl-format.txt" \
  http://localhost:3000/api/admin/metrics \
  -H "Cookie: [superadmin-session-cookie]"

# Verify aggregated data structure
# Confirm no individual school PII
```

### Test Rate Limiting
```bash
# Send 65 requests rapidly to test rate limit
for i in {1..65}; do
  curl http://localhost:3000/api/admin/metrics \
    -H "Cookie: [admin-session-cookie]" &
done
wait

# Verify 429 response after 60 requests
```

## Database Verification

### Check Tenant Scoping
```sql
-- Verify metrics queries are tenant-scoped
EXPLAIN ANALYZE 
SELECT COUNT(*) as pending_applications
FROM applications 
WHERE school_id = 'test-school-uuid'
  AND status = 'pending';

-- Confirm index usage and execution time < 50ms
```

### Verify Security Alert Creation
```sql
-- Check recent security alerts
SELECT * FROM security_alerts 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY severity DESC, created_at DESC;

-- Verify tenant isolation
```

### Test Data Aggregation
```sql
-- Super Admin aggregation query
SELECT 
  COUNT(DISTINCT school_id) as total_schools,
  SUM(student_count) as total_students,
  AVG(uptime_percentage) as avg_uptime
FROM school_metrics
WHERE created_at > NOW() - INTERVAL '1 day';
```

## Performance Validation

### Component Render Times
- Main dashboard page: < 100ms hydration
- Individual metric cards: < 50ms render
- Trends chart (client): < 200ms initial render
- Empty states: < 30ms render

### Network Performance
- Initial page load: < 500ms TTFB
- API metrics call: < 300ms response
- Subsequent navigation: < 100ms (cached)

### Memory Usage
- Dashboard page: < 50MB heap size
- Chart components: < 20MB additional
- No memory leaks on navigation

## Success Criteria Checklist

**Performance Requirements**:
- [ ] Dashboard TTFB < 500ms
- [ ] API response time < 300ms  
- [ ] Chart rendering < 200ms
- [ ] No JavaScript errors in console

**Functional Requirements**:
- [ ] All metric cards display correct data
- [ ] Security alerts show with proper severity
- [ ] Empty states provide helpful guidance
- [ ] Super Admin sees aggregated data only
- [ ] Metric cards navigate to detail pages

**Security Requirements**:
- [ ] Data scoped to user's school/tenant
- [ ] No cross-tenant data leakage
- [ ] Security alerts trigger appropriately
- [ ] Rate limiting enforced
- [ ] Audit logging captures access

**Design Requirements**:
- [ ] Consistent with existing montessori-app styling
- [ ] Responsive layout on desktop and tablet
- [ ] Accessible color contrast for alerts
- [ ] Empty states maintain visual hierarchy
- [ ] Charts integrate well with design system

**Constitutional Compliance**:
- [ ] Page components are thin, composing children only
- [ ] Server components used by default
- [ ] Client components minimal (`use client` only on charts)
- [ ] No hardcoded strings (all constants/enums used)
- [ ] Components organized in scoped folder structure
- [ ] Database queries are efficient and tenant-scoped