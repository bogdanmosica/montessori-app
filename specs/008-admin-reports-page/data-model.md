# Data Model: Admin Reports

## Overview
Data structures and entities for the admin reports feature, extracted from functional requirements and user scenarios.

## Core Entities

### Report Configuration
Represents the structure and metadata for generating reports.

```typescript
type ReportType = 'applications' | 'enrollments' | 'payments' | 'activity';
type ReportStatus = 'generating' | 'completed' | 'error';
type ExportFormat = 'csv' | 'pdf';

interface ReportConfig {
  type: ReportType;
  filters: ReportFilters;
  format: ExportFormat;
  tenantId: string;
  requestedBy: string; // Admin user ID
  requestedAt: Date;
}
```

### Report Filters
Represents filtering criteria applied to reports.

```typescript
interface ReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  status?: string[]; // Status values from respective entities
  entityType?: string; // Additional type filtering
}
```

### Report Data Structures

#### Applications Report Data
```typescript
interface ApplicationReportRow {
  applicationId: string;
  applicationDate: Date;
  childName: string;
  childDateOfBirth: Date;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentAddress: string;
  applicationStatus: ApplicationStatus;
  submissionDate: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}
```

#### Enrollments Report Data  
```typescript
interface EnrollmentReportRow {
  enrollmentId: string;
  childName: string;
  childDateOfBirth: Date;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentAddress: string;
  enrollmentDate: Date;
  enrollmentStatus: EnrollmentStatus;
  programType: string;
  monthlyFee: number;
  startDate: Date;
  endDate?: Date;
}
```

#### Payments Report Data
```typescript
interface PaymentReportRow {
  paymentId: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  transactionType: 'payment' | 'refund' | 'failed_charge';
  amount: number;
  currency: string;
  transactionDate: Date;
  paymentMethod: string;
  status: PaymentStatus;
  stripeTransactionId?: string;
  failureReason?: string;
  refundReason?: string;
}
```

#### Activity Report Data
```typescript
interface ActivityReportRow {
  activityId: string;
  activityType: ActivityType;
  performedBy: string; // User name
  performedByRole: UserRole;
  targetEntity: string; // What was acted upon
  targetId: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

## Database Query Patterns

### Applications Query
```sql
-- Tenant-scoped applications with parent/child data
SELECT 
  a.id as applicationId,
  a.created_at as applicationDate,
  c.name as childName,
  c.date_of_birth as childDateOfBirth,
  p.name as parentName,
  p.email as parentEmail,
  p.phone as parentPhone,
  p.address as parentAddress,
  a.status as applicationStatus,
  a.submitted_at as submissionDate,
  ru.name as reviewedBy,
  a.reviewed_at as reviewedAt,
  a.notes
FROM applications a
JOIN children c ON a.child_id = c.id
JOIN parents p ON c.parent_id = p.id
LEFT JOIN users ru ON a.reviewed_by = ru.id
WHERE a.tenant_id = $tenantId
  AND ($startDate IS NULL OR a.created_at >= $startDate)
  AND ($endDate IS NULL OR a.created_at <= $endDate)  
  AND ($status IS NULL OR a.status = ANY($status))
ORDER BY a.created_at DESC
```

### Enrollments Query
```sql
-- Tenant-scoped enrollments with child/parent data
SELECT 
  e.id as enrollmentId,
  c.name as childName,
  c.date_of_birth as childDateOfBirth,
  p.name as parentName,
  p.email as parentEmail,
  p.phone as parentPhone,
  p.address as parentAddress,
  e.enrollment_date as enrollmentDate,
  e.status as enrollmentStatus,
  e.program_type as programType,
  e.monthly_fee as monthlyFee,
  e.start_date as startDate,
  e.end_date as endDate
FROM enrollments e
JOIN children c ON e.child_id = c.id
JOIN parents p ON c.parent_id = p.id
WHERE e.tenant_id = $tenantId
  AND ($startDate IS NULL OR e.enrollment_date >= $startDate)
  AND ($endDate IS NULL OR e.enrollment_date <= $endDate)
  AND ($status IS NULL OR e.status = ANY($status))
ORDER BY e.enrollment_date DESC
```

### Payments Query
```sql
-- Tenant-scoped payments with parent/child data
SELECT 
  pay.id as paymentId,
  p.name as parentName,
  p.email as parentEmail,
  c.name as childName,
  pay.transaction_type as transactionType,
  pay.amount,
  pay.currency,
  pay.created_at as transactionDate,
  pay.payment_method as paymentMethod,
  pay.status,
  pay.stripe_transaction_id as stripeTransactionId,
  pay.failure_reason as failureReason,
  pay.refund_reason as refundReason
FROM payments pay
JOIN parents p ON pay.parent_id = p.id
LEFT JOIN children c ON pay.child_id = c.id
WHERE pay.tenant_id = $tenantId
  AND ($startDate IS NULL OR pay.created_at >= $startDate)
  AND ($endDate IS NULL OR pay.created_at <= $endDate)
  AND ($status IS NULL OR pay.status = ANY($status))
ORDER BY pay.created_at DESC
```

### Activity Query
```sql
-- Tenant-scoped access logs for activity reports
SELECT 
  al.id as activityId,
  al.activity_type as activityType,
  u.name as performedBy,
  u.role as performedByRole,
  al.target_entity as targetEntity,
  al.target_id as targetId,
  al.description,
  al.created_at as timestamp,
  al.ip_address as ipAddress,
  al.user_agent as userAgent
FROM access_logs al
JOIN users u ON al.user_id = u.id
WHERE al.tenant_id = $tenantId
  AND ($startDate IS NULL OR al.created_at >= $startDate)
  AND ($endDate IS NULL OR al.created_at <= $endDate)
  AND ($activityType IS NULL OR al.activity_type = ANY($activityType))
ORDER BY al.created_at DESC
```

## Status Enums

### Application Status
```typescript
enum ApplicationStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review', 
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WAITLISTED = 'waitlisted'
}
```

### Enrollment Status
```typescript
enum EnrollmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
  WITHDRAWN = 'withdrawn',
  SUSPENDED = 'suspended'
}
```

### Payment Status
```typescript
enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}
```

### Activity Type
```typescript
enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout', 
  APPLICATION_CREATE = 'application_create',
  APPLICATION_APPROVE = 'application_approve',
  APPLICATION_REJECT = 'application_reject',
  ENROLLMENT_CREATE = 'enrollment_create',
  ENROLLMENT_UPDATE = 'enrollment_update',
  PAYMENT_PROCESS = 'payment_process',
  REPORT_GENERATE = 'report_generate'
}
```

## Validation Rules

### Date Range Validation
- Start date must be before end date
- Date range cannot exceed 2 years for performance
- Dates must be in valid ISO format

### Status Validation
- Status values must match predefined enums
- Multiple status selection allowed
- Empty status array means "all statuses"

### Tenant Scoping
- All queries must include tenant_id WHERE clause
- Tenant ID derived from authenticated user session
- No cross-tenant data leakage allowed

## Performance Considerations

### Database Indexes
Required indexes for efficient report queries:
- `(tenant_id, created_at)` on applications, enrollments, payments, access_logs
- `(tenant_id, status)` on applications, enrollments, payments  
- `(tenant_id, activity_type)` on access_logs

### Query Limits
- Maximum 10,000 rows per report
- Pagination if results exceed limit
- Timeout after 30 seconds

### Memory Usage
- Stream processing for large result sets
- Chunked data processing for exports
- Proper cleanup after generation

## Export Format Specifications

### CSV Format
- UTF-8 encoding with BOM
- Comma-separated values
- Headers in first row
- Quoted fields containing commas/newlines
- ISO date format (YYYY-MM-DD)

### PDF Format  
- Professional school letterhead
- Tabular layout with proper column widths
- Page breaks at logical boundaries
- Summary statistics at top
- Generation timestamp and filters applied
- Page numbering and total pages

This data model ensures type safety, performance, and constitutional compliance while supporting all required report functionality.