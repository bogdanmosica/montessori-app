# API Contracts: Admin Dashboard Controls & Settings

**Feature**: Admin Dashboard Refresh & Settings  
**Date**: September 30, 2025  
**Base URL**: `/api/admin`  
**Authentication**: Admin role required via middleware

## Contract Overview

### Endpoints
1. `GET /api/admin/metrics` - Dashboard metrics refresh (existing, no changes)
2. `GET /api/admin/settings` - Retrieve school settings  
3. `PUT /api/admin/settings` - Update school settings

### Common Response Headers
```
Content-Type: application/json
X-Tenant-Id: <school_id>
X-Request-Id: <uuid>
```

### Error Response Format
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  timestamp: string;
}
```

## Contract Specifications

### 1. GET /api/admin/settings

**Purpose**: Retrieve current school settings for admin's school  
**Authentication**: Admin role required  
**Multi-Tenant**: Automatically scoped to admin's school_id

#### Request
```
GET /api/admin/settings
Authorization: Bearer <jwt_token>
```

#### Success Response (200)
```typescript
interface SettingsResponse {
  success: true;
  data: {
    school_id: string;
    default_monthly_fee_ron: number; // decimal, >= 0
    free_enrollment_count: number;   // integer, >= 0  
    settings_updated_at: string | null; // ISO datetime
    updated_by_admin: string | null; // admin username who last updated
  };
}
```

#### Error Responses
```typescript
// 401 Unauthorized
{
  error: "Unauthorized",
  message: "Admin role required",
  code: "ADMIN_ROLE_REQUIRED",
  timestamp: "2025-09-30T10:00:00Z"
}

// 404 Not Found (school not found)
{
  error: "Not Found", 
  message: "School settings not found",
  code: "SCHOOL_NOT_FOUND",
  timestamp: "2025-09-30T10:00:00Z"
}

// 500 Internal Server Error
{
  error: "Internal Server Error",
  message: "Database connection failed", 
  code: "DATABASE_ERROR",
  timestamp: "2025-09-30T10:00:00Z"
}
```

### 2. PUT /api/admin/settings

**Purpose**: Update school settings for admin's school  
**Authentication**: Admin role required  
**Multi-Tenant**: Automatically scoped to admin's school_id  
**Side Effects**: Creates audit log entry

#### Request
```typescript
PUT /api/admin/settings
Authorization: Bearer <jwt_token>
Content-Type: application/json

interface SettingsUpdateRequest {
  default_monthly_fee_ron: number; // >= 0, max 99999.99
  free_enrollment_count: number;   // >= 0, max 9999, integer
}
```

#### Success Response (200)
```typescript
interface SettingsUpdateResponse {
  success: true;
  data: {
    school_id: string;
    default_monthly_fee_ron: number;
    free_enrollment_count: number;
    settings_updated_at: string; // ISO datetime
    updated_by_admin: string;    // admin username
  };
  message: "Settings updated successfully";
}
```

#### Error Responses
```typescript
// 400 Bad Request (validation error)
{
  error: "Bad Request",
  message: "Validation failed",
  code: "VALIDATION_ERROR", 
  details: {
    default_monthly_fee_ron: ["Must be non-negative"],
    free_enrollment_count: ["Must be non-negative integer"]
  },
  timestamp: "2025-09-30T10:00:00Z"
}

// 401 Unauthorized
{
  error: "Unauthorized",
  message: "Admin role required",
  code: "ADMIN_ROLE_REQUIRED",
  timestamp: "2025-09-30T10:00:00Z"
}

// 422 Unprocessable Entity (business logic error)
{
  error: "Unprocessable Entity",
  message: "Monthly fee exceeds maximum allowed",
  code: "FEE_LIMIT_EXCEEDED",
  timestamp: "2025-09-30T10:00:00Z"
}

// 500 Internal Server Error
{
  error: "Internal Server Error", 
  message: "Failed to update settings",
  code: "UPDATE_FAILED",
  timestamp: "2025-09-30T10:00:00Z"
}
```

## Validation Rules

### Input Validation
```typescript
const SettingsValidation = {
  default_monthly_fee_ron: {
    type: "number",
    minimum: 0,
    maximum: 99999.99,
    multipleOf: 0.01, // 2 decimal places
    required: true
  },
  free_enrollment_count: {
    type: "integer", 
    minimum: 0,
    maximum: 9999,
    required: true
  }
}
```

### Business Rules
- Settings are scoped to authenticated admin's school only
- All updates must pass validation before database modification  
- Successful updates trigger audit log creation
- Concurrent updates use last-write-wins strategy
- Settings changes are immediately visible to other admins of same school

## Security Requirements

### Authentication
- Valid JWT token with Admin role in claims
- Token must not be expired or revoked
- Multi-factor authentication if enabled for admin account

### Authorization  
- Admin role required for all settings endpoints
- School ownership verified through session school_id
- Cross-tenant access prevented at middleware level

### Data Protection
- All requests logged for audit compliance
- Settings changes logged with admin identification
- Sensitive operations rate-limited to prevent abuse

## Contract Tests Required

### GET /api/admin/settings Tests
1. **Valid Admin Request**: Returns 200 with current settings
2. **Unauthorized Request**: Returns 401 for non-admin users  
3. **School Not Found**: Returns 404 for invalid school_id
4. **Database Error**: Returns 500 for connection failures

### PUT /api/admin/settings Tests  
1. **Valid Update**: Returns 200 with updated settings
2. **Validation Failure**: Returns 400 for invalid input values
3. **Unauthorized Request**: Returns 401 for non-admin users
4. **Business Logic Error**: Returns 422 for rule violations  
5. **Database Error**: Returns 500 for update failures

### Integration Tests
1. **Settings Persistence**: Verify GET returns PUT values
2. **Multi-Tenant Isolation**: Verify school scoping works correctly
3. **Audit Trail**: Verify access_logs entries created on changes
4. **Concurrent Updates**: Verify last-write-wins behavior

## Error Handling Strategy

### Client-Side Handling
- Display user-friendly error messages for validation failures
- Provide retry mechanism for transient errors (500, 503)
- Show appropriate feedback for unauthorized access (401, 403)

### Server-Side Handling  
- Log all errors with request context for debugging
- Return consistent error format across all endpoints
- Sanitize error messages to prevent information disclosure
- Implement circuit breaker for database connectivity issues

## Rate Limiting

### Settings Endpoints
- Maximum 10 requests per minute per admin user
- Burst allowance of 3 requests per 10 seconds
- Rate limit headers included in responses
- 429 Too Many Requests response when exceeded

### Metrics Refresh
- Maximum 20 requests per minute per admin user (higher limit for dashboard refresh)
- Separate rate limit pool from settings endpoints
- Graceful degradation when limits approached