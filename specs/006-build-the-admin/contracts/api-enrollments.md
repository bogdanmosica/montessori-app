# API Contracts: Admin Enrollments Management

**Version**: 1.0.0  
**Date**: September 27, 2025  
**Base URL**: `/api/enrollments`  
**Authentication**: Required (Admin role only)

## Data Types

### EnrollmentStatus Enum
```typescript
type EnrollmentStatus = 'active' | 'inactive' | 'withdrawn' | 'archived';
```

### Enrollment Model
```typescript
interface Enrollment {
  id: string;                    // UUID
  child_id: string;              // UUID, foreign key
  school_id: string;             // UUID, foreign key (tenant)
  status: EnrollmentStatus;
  enrollment_date: string;       // ISO date string
  withdrawal_date?: string;      // ISO date string, nullable
  notes?: string;                // Optional administrative notes
  created_at: string;            // ISO datetime string
  updated_at: string;            // ISO datetime string
  created_by: string;            // UUID, admin user id
  updated_by: string;            // UUID, admin user id
}
```

### Child Model (Relevant Fields)
```typescript
interface Child {
  id: string;                    // UUID
  school_id: string;             // UUID, foreign key
  first_name: string;
  last_name: string;
  date_of_birth: string;         // ISO date string
  parent_name: string;
  parent_email?: string;         // Optional
  parent_phone?: string;         // Optional
  is_active: boolean;
}
```

### Enrollment with Child Details
```typescript
interface EnrollmentWithChild {
  id: string;
  status: EnrollmentStatus;
  enrollment_date: string;
  withdrawal_date?: string;
  notes?: string;
  child: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    parent_name: string;
    parent_email?: string;
    parent_phone?: string;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}
```

## Endpoints

### GET /api/enrollments

**Description**: List enrollments with filtering, search, and pagination

**Query Parameters**:
```typescript
interface GetEnrollmentsQuery {
  status?: EnrollmentStatus | EnrollmentStatus[];  // Filter by status
  search?: string;                                 // Search child name or parent name
  page?: number;                                   // Page number (default: 1)
  limit?: number;                                  // Items per page (default: 20, max: 100)
  sort_by?: 'enrollment_date' | 'child_name' | 'created_at';  // Sort field (default: enrollment_date)
  sort_order?: 'asc' | 'desc';                    // Sort direction (default: desc)
}
```

**Response**: 200 OK
```typescript
interface GetEnrollmentsResponse {
  data: EnrollmentWithChild[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin user
- `400 Bad Request`: Invalid query parameters

---

### POST /api/enrollments

**Description**: Create new enrollment (with new or existing child)

**Request Body**:
```typescript
interface CreateEnrollmentRequest {
  enrollment: {
    enrollment_date: string;     // ISO date string
    notes?: string;              // Optional notes
  };
  child: {
    // If linking to existing child
    existing_child_id?: string;  // UUID of existing child
    
    // If creating new child (required if existing_child_id not provided)
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;      // ISO date string
    parent_name?: string;
    parent_email?: string;       // Optional
    parent_phone?: string;       // Optional
  };
}
```

**Response**: 201 Created
```typescript
interface CreateEnrollmentResponse {
  data: EnrollmentWithChild;
  message: string;
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors or duplicate active enrollment
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Child not found (when using existing_child_id)
- `409 Conflict`: Child already has active enrollment

**Example Error Response**:
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;  // Validation errors
}
```

---

### PUT /api/enrollments/[id]

**Description**: Update enrollment and optionally sync child details

**Path Parameters**:
- `id` (string): Enrollment UUID

**Request Body**:
```typescript
interface UpdateEnrollmentRequest {
  enrollment: {
    status?: EnrollmentStatus;
    enrollment_date?: string;    // ISO date string
    withdrawal_date?: string;    // ISO date string, required if status = 'withdrawn'
    notes?: string;
  };
  child?: {
    // Optional child updates
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;      // ISO date string
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
  };
}
```

**Response**: 200 OK
```typescript
interface UpdateEnrollmentResponse {
  data: EnrollmentWithChild;
  message: string;
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors or invalid status transition
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Enrollment not found
- `409 Conflict`: Invalid status transition

---

### DELETE /api/enrollments/[id]

**Description**: Remove enrollment (change status to 'withdrawn')

**Path Parameters**:
- `id` (string): Enrollment UUID

**Request Body** (Optional):
```typescript
interface WithdrawEnrollmentRequest {
  withdrawal_date?: string;      // ISO date string (default: today)
  notes?: string;                // Optional withdrawal reason
}
```

**Response**: 200 OK
```typescript
interface WithdrawEnrollmentResponse {
  data: EnrollmentWithChild;
  message: string;
  archived_records?: number;     // Count of related records archived
}
```

**Error Responses**:
- `400 Bad Request`: Invalid withdrawal date
- `401 Unauthorized`: Not authenticated  
- `403 Forbidden`: Not an admin user
- `404 Not Found`: Enrollment not found
- `409 Conflict`: Enrollment already withdrawn

---

## Common Error Response Format

All error responses follow this structure:

```typescript
interface ApiError {
  error: string;                 // Error type/code
  message: string;               // Human-readable message
  details?: Record<string, string[]>;  // Field-specific validation errors
  timestamp: string;             // ISO datetime string
  path: string;                  // Request path
}
```

## Authentication & Authorization

**Authentication**: All endpoints require valid JWT token in Authorization header
**Format**: `Authorization: Bearer <jwt_token>`

**Authorization**: All endpoints require Admin role
**Tenant Scoping**: All operations automatically scoped to admin's school_id

**Session Validation**:
- Token must be valid and not expired
- User must have 'admin' role
- User must be associated with a school (tenant)

## Rate Limiting

**Limits**:
- GET requests: 100 per minute per user
- POST/PUT/DELETE requests: 30 per minute per user

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1640995200
```

## Validation Rules

### Enrollment Validation
- `enrollment_date`: Must be valid date, not in future
- `withdrawal_date`: Must be >= enrollment_date, required if status = 'withdrawn'
- `status`: Must be valid EnrollmentStatus enum value
- `notes`: Maximum 1000 characters

### Child Validation  
- `first_name`, `last_name`: Required, 1-100 characters
- `date_of_birth`: Required, valid date, reasonable age range (0-18 years)
- `parent_name`: Required, 1-100 characters
- `parent_email`: Optional, valid email format if provided
- `parent_phone`: Optional, valid phone format if provided

### Business Rule Validation
- Cannot create enrollment for child with existing active enrollment
- Cannot update enrollment to 'active' if child already has active enrollment  
- Cannot withdraw already withdrawn enrollment
- Cannot modify archived enrollments