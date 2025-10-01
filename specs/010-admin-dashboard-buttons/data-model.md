# Data Model: Admin Dashboard Controls & Settings

**Feature**: Admin Dashboard Refresh & Settings  
**Date**: September 30, 2025  
**Dependencies**: Extends existing multi-tenant school management schema

## Core Entities

### School Settings (Extension)
**Description**: Extends existing `schools` table with configurable defaults for administrative control  
**Entity Type**: Extension of existing entity  
**Multi-Tenant Scope**: Isolated by school_id

**New Fields**:
- `default_monthly_fee_ron`: decimal(10,2), nullable, default 0.00
  - Represents default monthly fee in Romanian Lei
  - Used as default value in child enrollment creation
  - Must be non-negative (validation constraint)
  
- `free_enrollment_count`: integer, nullable, default 0  
  - Number of free empty enrollments available school-wide
  - Enforced during enrollment creation process
  - Must be non-negative (validation constraint)

- `settings_updated_at`: timestamp, nullable
  - Tracks when settings were last modified
  - Used for audit purposes and concurrent update handling

**Relationships**:
- Belongs to School (existing one-to-one via school_id)
- Related to User (admin who can modify settings)
- Related to Enrollments (settings apply to new enrollments)

**Validation Rules**:
- default_monthly_fee_ron >= 0 (cannot be negative)
- free_enrollment_count >= 0 (cannot be negative)  
- settings_updated_at auto-updated on settings change
- No audit logging required (per clarification session)

### Dashboard Metrics (Existing)
**Description**: Data structure returned by `/api/admin/metrics` for dashboard display  
**Entity Type**: Read-only aggregation (not stored entity)  
**Multi-Tenant Scope**: Filtered by admin's school_id

**Data Structure**:
- Student metrics (counts, enrollment status)
- Financial metrics (revenue, outstanding payments)
- System alerts (capacity warnings, payment issues)
- Operational metrics (staff utilization, classroom occupancy)

**Refresh Behavior**:
- On-demand refresh via client-side fetch
- No caching layer (real-time data required)
- Error handling for failed refresh attempts

## State Transitions

### Settings Lifecycle
```
Initial State: NULL values (unset)
    ↓ (Admin sets values)
Configured State: Non-null values stored
    ↓ (Admin modifies)  
Updated State: New values with updated timestamp
    ↓ (Used in enrollment creation)
Applied State: Settings influence new records
```

### Dashboard Refresh Lifecycle
```
Loaded State: Initial dashboard display
    ↓ (User clicks Refresh)
Loading State: Fetch in progress, UI feedback
    ↓ (Success)
Updated State: New metrics displayed
    ↓ (Failure)  
Error State: Error message, retry option
```

## Data Access Patterns

### Settings Operations
- **Create/Update**: Upsert pattern on schools table extension
- **Read**: Single query by school_id for admin's school
- **Timestamp**: Update settings_updated_at on every change for concurrency handling
- **Apply**: Join with enrollments table during creation process

### Metrics Operations  
- **Refresh**: Re-execute existing aggregation queries
- **Display**: Format for dashboard component consumption
- **Error Handling**: Graceful degradation with cached values

## Validation Schema

### Settings Input Validation
```typescript
const SettingsSchema = z.object({
  default_monthly_fee_ron: z.number().min(0).max(99999.99),
  free_enrollment_count: z.number().int().min(0).max(9999),
})
```

### API Response Validation
```typescript  
const MetricsSchema = z.object({
  students: z.object({
    total: z.number().int(),
    enrolled: z.number().int(),
    pending: z.number().int(),
  }),
  financial: z.object({
    monthly_revenue: z.number(),
    outstanding_payments: z.number(),
  }),
  alerts: z.array(z.object({
    type: z.enum(['warning', 'error', 'info']),
    message: z.string(),
    timestamp: z.string().datetime(),
  })),
})
```

## Database Schema Changes

### Migration: Add Settings Columns
```sql
-- Add settings columns to existing schools table
ALTER TABLE schools 
ADD COLUMN default_monthly_fee_ron DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN free_enrollment_count INTEGER DEFAULT 0,
ADD COLUMN settings_updated_at TIMESTAMP;

-- Add validation constraints
ALTER TABLE schools 
ADD CONSTRAINT check_monthly_fee_non_negative 
CHECK (default_monthly_fee_ron >= 0);

ALTER TABLE schools 
ADD CONSTRAINT check_enrollment_count_non_negative 
CHECK (free_enrollment_count >= 0);

-- Add index for efficient settings lookups
CREATE INDEX idx_schools_settings ON schools(id, settings_updated_at);
```

### Audit Trail Extension
Reuse existing `access_logs` table with new action types:
- `settings_update_fee`: When default fee is changed
- `settings_update_enrollments`: When enrollment count is changed  
- `dashboard_refresh`: When admin manually refreshes dashboard

## Performance Considerations

### Query Optimization
- Settings retrieval: Single query by school_id (indexed)
- Metrics refresh: Leverage existing optimized aggregation queries
- Audit logging: Asynchronous insert to avoid blocking user operations

### Caching Strategy
- No server-side caching for settings (immediate consistency required)
- Client-side state management for dashboard metrics between refreshes
- Browser validation caching for form schemas

## Multi-Tenant Isolation

### Data Scoping
- All settings queries filtered by admin's school_id from session
- Metrics aggregation scoped to admin's school data only
- Audit logs include school_id for proper tenant isolation

### Security Boundaries
- Middleware enforces admin role before settings access
- API routes validate school ownership before data operations
- Database constraints prevent cross-tenant data access

## Integration Points

### Enrollment Creation Flow
- Fetch school settings during enrollment form initialization
- Apply default_monthly_fee_ron as pre-filled value
- Enforce free_enrollment_count limit during submission

### Dashboard Display
- Load metrics on initial page render (server component)
- Refresh metrics on user action (client component)
- Display settings link only for admin users

### Audit System
- Log settings changes with admin user_id and school_id
- Include previous and new values for complete audit trail
- Timestamp all changes for compliance reporting