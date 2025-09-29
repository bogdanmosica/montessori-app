# Quickstart Guide: Admin Payments Management

## Overview
This guide provides step-by-step instructions for testing and validating the admin payments management feature. It covers the primary user scenarios from the specification and serves as both documentation and integration test guidance.

## Prerequisites

### Environment Setup
- Next.js 15 development server running
- PostgreSQL database with multi-tenant schema
- Stripe test account configured with webhook endpoint
- Auth.js authentication working with Admin role
- Test data: school, admin user, parents, and children with active enrollment

### Test Accounts Required
- **Admin User**: `admin@testschool.edu` with Admin role
- **Test School**: "Test Montessori School" with Stripe account linked
- **Test Parent**: "John Parent" with child "Jane Student" (active enrollment)
- **Test Parent 2**: "Sarah Parent" with child "Tom Student" (active enrollment)

### Stripe Test Data
- Test payment methods (card: 4242424242424242, bank: account/routing)
- Test payment intents for successful and failed scenarios
- Webhook events for payment status updates

## Core User Scenarios

### Scenario 1: Dashboard Overview Access
**User Story**: As an Admin, I can see my school's payment overview

**Steps**:
1. Navigate to `/admin/payments` in browser
2. Verify admin authentication required (redirect to login if not authenticated)
3. Confirm page loads with dashboard overview showing:
   - Total revenue this month
   - Count of pending payments
   - Count of failed payments  
   - Active alerts count
   - List of recent payments

**Expected Results**:
- Dashboard loads within 2 seconds
- All metrics display current data scoped to admin's school
- Recent payments list shows most recent 5-10 transactions
- Data is properly formatted (currency, dates, names)

**API Validation**:
```bash
# Test dashboard endpoint
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/admin/payments/dashboard?school_id=$SCHOOL_ID"
```

### Scenario 2: Payment History Viewing
**User Story**: As an Admin, I can see payment history with filtering options

**Steps**:
1. From dashboard, navigate to payment history section
2. Verify default view shows paginated list of all payments
3. Test filtering by:
   - Payment status (pending, completed, failed)
   - Payment method (Stripe card, bank transfer)
   - Date range (last month, last quarter)
   - Parent name (search/filter)
   - Child name (search/filter)
4. Test pagination controls (next/previous, page numbers)
5. Verify payment details modal/page for individual payments

**Expected Results**:
- Payment list loads with proper pagination (50 items per page)
- Filters work correctly and maintain state during navigation
- Individual payment details show complete information
- Multi-tenant scoping prevents seeing other schools' data

**API Validation**:
```bash
# Test payments list with filters
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/admin/payments/payments?school_id=$SCHOOL_ID&status=completed&page=1&limit=20"
```

### Scenario 3: Payment Alert Management
**User Story**: As an Admin, I am notified of payment issues and can resolve them

**Steps**:
1. Create test scenario with failed payment (using Stripe test card decline)
2. Verify alert appears prominently on dashboard
3. Click on alert to view details including:
   - Parent and child information
   - Failure reason
   - Suggested resolution actions
4. Test alert resolution workflow:
   - Mark alert as acknowledged
   - Add resolution notes
   - Mark as resolved
5. Verify resolved alerts are archived but accessible

**Expected Results**:
- Failed payments generate alerts within 1 minute (webhook processing)
- Alert severity is properly categorized (high for failed payments)
- Resolution workflow updates alert status correctly
- Audit trail tracks who resolved alerts and when

**API Validation**:
```bash
# Test alerts retrieval
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/admin/payments/alerts?school_id=$SCHOOL_ID&is_resolved=false"
```

### Scenario 4: Payment Refund Processing
**User Story**: As an Admin, I can process refunds for completed payments

**Steps**:
1. Navigate to completed payment details
2. Click "Process Refund" button
3. Fill refund form:
   - Refund amount (partial or full)
   - Reason for refund
   - Admin approval confirmation
4. Submit refund request
5. Verify refund processing status updates
6. Check Stripe dashboard for refund confirmation
7. Verify payment status changes to "refunded" in system

**Expected Results**:
- Refund form validates amount doesn't exceed original payment
- Stripe refund processes successfully (test mode)
- Payment record updates with refund information
- Parent receives refund notification (if implemented)
- Audit log records refund action with admin details

**API Validation**:
```bash
# Test refund processing
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"school_id":"'$SCHOOL_ID'","amount":5000,"reason":"Test refund"}' \
     "http://localhost:3000/api/admin/payments/payments/$PAYMENT_ID/refund"
```

### Scenario 5: Invoice Management
**User Story**: As an Admin, I can view and download invoices

**Steps**:
1. Navigate to invoices section from payments dashboard
2. Browse invoice list with filters:
   - Invoice status (paid, overdue, pending)
   - Parent name
   - Due date range
3. Click on individual invoice to view details:
   - Line items breakdown
   - Payment status
   - Due dates and payment history
4. Test invoice PDF download:
   - Click "Download PDF" button
   - Verify PDF generates and downloads correctly
   - Check PDF content matches invoice data

**Expected Results**:
- Invoice list loads with proper pagination and filtering
- Invoice details show complete breakdown of charges
- PDF generation works reliably (within 5 seconds)
- Downloaded PDF contains all required billing information
- Invoice numbers are unique and sequential per school

**API Validation**:
```bash
# Test invoice details
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/admin/payments/invoices/$INVOICE_ID?school_id=$SCHOOL_ID"

# Test PDF download
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "http://localhost:3000/api/admin/payments/invoices/$INVOICE_ID/download?school_id=$SCHOOL_ID" \
     -o test-invoice.pdf
```

### Scenario 6: Payment Method Management
**User Story**: As an Admin, I can view parent payment methods

**Steps**:
1. From parent profile or payment details, access payment methods
2. View list of stored payment methods for parent:
   - Card information (last 4 digits, brand, expiration)
   - Bank account details (last 4 digits, bank name)
   - Primary payment method indication
   - Active/inactive status
3. Verify security - sensitive information is properly masked
4. Check payment method usage history

**Expected Results**:
- Payment methods display with proper security masking
- Primary payment method is clearly indicated
- Inactive/expired methods are visually distinguished
- No raw payment data is exposed in UI or API responses
- Multi-tenant scoping prevents cross-school access

**API Validation**:
```bash
# Test payment methods for parent
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:3000/api/admin/payments/payment-methods?school_id=$SCHOOL_ID&parent_id=$PARENT_ID"
```

## Integration Testing Scenarios

### Multi-Tenant Security Testing
1. **Cross-Tenant Access Prevention**:
   - Attempt to access payments from different school using valid admin token
   - Verify 403/404 responses for unauthorized school data
   - Test API endpoints with manipulated school_id parameters

2. **Role-Based Access Control**:
   - Test with Teacher role token (should get 403)
   - Test with Parent role token (should get 403)  
   - Test with invalid/expired tokens
   - Verify middleware blocks non-Admin users

### Stripe Integration Testing
1. **Webhook Processing**:
   - Send test webhook events for payment success/failure
   - Verify database updates occur within expected timeframe
   - Test webhook signature validation
   - Test duplicate webhook handling (idempotency)

2. **Payment Processing**:
   - Test successful payment scenarios with different methods
   - Test failed payment scenarios (declined cards, insufficient funds)
   - Test partial refund processing
   - Test full refund processing

### Performance Testing
1. **Database Query Performance**:
   - Load test with 1000+ payment records per school
   - Verify queries stay under 100ms with proper indexes
   - Test concurrent admin access (5+ users)
   - Monitor multi-tenant query isolation

2. **API Response Times**:
   - Dashboard load: < 200ms
   - Payment list with filters: < 300ms
   - PDF generation: < 5 seconds
   - Webhook processing: < 1 second

## Error Handling Validation

### Stripe API Failures
1. Test behavior when Stripe API is unavailable
2. Verify graceful fallback to cached data
3. Test retry mechanisms with exponential backoff
4. Validate error messages are user-friendly

### Database Connection Issues
1. Test payment page behavior during database downtime
2. Verify transaction rollback for failed operations
3. Test connection pool exhaustion scenarios

### Invalid Input Handling
1. Test malformed API requests
2. Test SQL injection attempts in filters
3. Test XSS prevention in user inputs
4. Validate input sanitization and validation

## Success Criteria Checklist

### Functional Requirements
- [ ] Admin-only access enforced for all payment endpoints
- [ ] Payment history displays with proper filtering and pagination
- [ ] Payment alerts show prominently and can be resolved
- [ ] Refund processing works through Stripe integration
- [ ] Invoice viewing and PDF download functions correctly
- [ ] Payment methods display with proper security masking

### Performance Requirements
- [ ] Dashboard loads in under 2 seconds
- [ ] Payment queries complete in under 300ms
- [ ] PDF generation completes in under 5 seconds
- [ ] Webhook processing completes in under 1 second

### Security Requirements
- [ ] Multi-tenant data isolation prevents cross-school access
- [ ] RBAC enforcement blocks non-admin users
- [ ] Audit logging captures all admin payment actions
- [ ] Sensitive payment data is properly encrypted/masked

### Integration Requirements
- [ ] Stripe webhooks process successfully
- [ ] Database transactions maintain ACID properties
- [ ] Error handling provides graceful degradation
- [ ] API contracts match OpenAPI specification

## Troubleshooting Guide

### Common Issues
1. **403 Errors**: Check admin role assignment and JWT token validity
2. **Empty Payment Lists**: Verify school_id parameter and tenant scoping
3. **PDF Download Fails**: Check file permissions and PDF generation service
4. **Webhook Processing Delays**: Verify Stripe endpoint configuration and signature validation

### Debug Commands
```bash
# Check admin role
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/user/profile"

# Verify school association
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/user/schools"

# Test webhook endpoint
curl -X POST "http://localhost:3000/api/admin/payments/webhooks/stripe" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
```

This quickstart guide provides comprehensive validation steps for the admin payments management feature, ensuring all functional requirements are met and the system performs reliably under various conditions.