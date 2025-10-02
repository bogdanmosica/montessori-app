# Data Model: Weekly Trends Widget

## Core Entities

### Application
**Purpose**: Track school application submissions for trend analysis  
**Fields**:
- `id`: Primary key (UUID)
- `tenant_id`: School/organization identifier (UUID, FK)
- `created_at`: Submission timestamp (DateTime)
- `status`: Application status (enum: pending, approved, rejected, withdrawn)
- `applicant_name`: Student name (String)
- `grade_level`: Requested grade (String)
- `updated_at`: Last modification timestamp (DateTime)

**Validation Rules**:
- `tenant_id` must exist in tenants table
- `created_at` cannot be future date
- `status` must be valid enum value
- `applicant_name` required, max 255 characters

**State Transitions**:
- pending → approved/rejected/withdrawn
- No reverse transitions allowed

### Enrollment  
**Purpose**: Track confirmed student enrollments for trend analysis  
**Fields**:
- `id`: Primary key (UUID)
- `tenant_id`: School/organization identifier (UUID, FK)
- `student_id`: Reference to student record (UUID, FK)
- `enrolled_at`: Enrollment confirmation date (DateTime)
- `status`: Enrollment status (enum: active, inactive, graduated, transferred)
- `grade_level`: Current grade (String)
- `enrollment_type`: Type of enrollment (enum: new, returning, transfer)
- `created_at`: Record creation timestamp (DateTime)

**Validation Rules**:
- `tenant_id` must exist in tenants table
- `student_id` must exist in students table with matching tenant
- `enrolled_at` cannot be future date
- `status` must be valid enum value
- One active enrollment per student per academic year

### Payment
**Purpose**: Track payment activities for financial trend analysis  
**Fields**:
- `id`: Primary key (UUID)
- `tenant_id`: School/organization identifier (UUID, FK)
- `student_id`: Reference to student record (UUID, FK)
- `amount`: Payment amount (Decimal, 2 decimal places)
- `payment_date`: When payment was processed (DateTime)
- `payment_type`: Type of payment (enum: tuition, registration, materials, other)
- `status`: Payment status (enum: pending, completed, failed, refunded)
- `created_at`: Record creation timestamp (DateTime)

**Validation Rules**:
- `tenant_id` must exist in tenants table
- `student_id` must exist and match tenant
- `amount` must be positive
- `payment_date` cannot be future date
- `payment_type` must be valid enum value

### StaffActivity
**Purpose**: Track staff-related activities for administrative trend analysis  
**Fields**:
- `id`: Primary key (UUID)
- `tenant_id`: School/organization identifier (UUID, FK)
- `staff_id`: Reference to staff member (UUID, FK)
- `activity_type`: Type of activity (enum: hire, promotion, training, evaluation, departure)
- `activity_date`: When activity occurred (DateTime)
- `description`: Activity details (Text, optional)
- `created_at`: Record creation timestamp (DateTime)

**Validation Rules**:
- `tenant_id` must exist in tenants table
- `staff_id` must exist and match tenant
- `activity_type` must be valid enum value
- `activity_date` cannot be future date

### Event
**Purpose**: Track school events for activity trend analysis  
**Fields**:
- `id`: Primary key (UUID)
- `tenant_id`: School/organization identifier (UUID, FK)
- `name`: Event name (String, max 255 chars)
- `event_type`: Type of event (enum: meeting, ceremony, training, social, academic)
- `event_date`: When event occurred (DateTime)
- `participant_count`: Number of participants (Integer, optional)
- `created_at`: Record creation timestamp (DateTime)

**Validation Rules**:
- `tenant_id` must exist in tenants table
- `name` required, max 255 characters
- `event_type` must be valid enum value
- `event_date` cannot be future date
- `participant_count` must be non-negative if provided

## Aggregated Entities

### DailyActivityMetrics
**Purpose**: Computed view for efficient trend data retrieval  
**Derived Fields**:
- `date`: Activity date (Date)
- `tenant_id`: School identifier (UUID)
- `applications_count`: Daily application submissions (Integer)
- `enrollments_count`: Daily enrollment confirmations (Integer)
- `payments_count`: Daily payment transactions (Integer)
- `payments_amount`: Daily payment total (Decimal)
- `staff_activities_count`: Daily staff activities (Integer)
- `events_count`: Daily events (Integer)

**Computation Rules**:
- Aggregate by `DATE(created_at)` for applications, enrollments
- Aggregate by `DATE(payment_date)` for payments
- Aggregate by `DATE(activity_date)` for staff activities
- Aggregate by `DATE(event_date)` for events
- Group by `tenant_id` for multi-tenant isolation
- Fill gaps with zero values for missing dates

## Relationships

### Primary Relationships
- `Application.tenant_id` → `Tenant.id` (Many-to-One)
- `Enrollment.tenant_id` → `Tenant.id` (Many-to-One)
- `Enrollment.student_id` → `Student.id` (Many-to-One)
- `Payment.tenant_id` → `Tenant.id` (Many-to-One)
- `Payment.student_id` → `Student.id` (Many-to-One)
- `StaffActivity.tenant_id` → `Tenant.id` (Many-to-One)
- `StaffActivity.staff_id` → `Staff.id` (Many-to-One)
- `Event.tenant_id` → `Tenant.id` (Many-to-One)

### Referential Integrity
- All foreign keys must exist in referenced tables
- Cascading deletes not allowed (preserve historical data)
- Updates cascade for tenant changes only
- Soft deletes preferred for audit trail maintenance

## Indexes

### Performance Indexes
```sql
-- Multi-tenant date range queries
CREATE INDEX idx_applications_tenant_date ON applications(tenant_id, created_at);
CREATE INDEX idx_enrollments_tenant_date ON enrollments(tenant_id, enrolled_at);
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, payment_date);
CREATE INDEX idx_staff_activities_tenant_date ON staff_activities(tenant_id, activity_date);
CREATE INDEX idx_events_tenant_date ON events(tenant_id, event_date);

-- Status filtering
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_payments_status ON payments(status);
```

## Security Constraints

### Multi-Tenant Isolation
- All queries must include `tenant_id` filter
- Middleware enforces tenant context from user session
- No cross-tenant data access permitted
- Audit logging for all data access operations

### Data Privacy
- Personal identifiable information (names) in separate fields
- Aggregated views exclude PII
- GDPR compliance for data retention
- Anonymization options for historical analysis