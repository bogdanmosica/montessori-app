# API Contracts: Teacher Management

## REST API Endpoints

### GET /api/admin/teachers
**Purpose**: Retrieve list of teachers for the admin's school

**Request**:
```typescript
// Query Parameters
interface GetTeachersQuery {
  page?: number;        // Pagination, default: 1
  limit?: number;       // Page size, default: 20
  search?: string;      // Search by name or email
  includeInactive?: boolean; // Include soft-deleted teachers, default: true
}
```

**Response**:
```typescript
interface GetTeachersResponse {
  teachers: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    wage: number | null;
    nationality: string | null;
    isActive: boolean;
    studentCount: number; // Number of assigned students
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Status Codes**:
- `200`: Success
- `403`: Forbidden (not admin)
- `500`: Internal server error

---

### POST /api/admin/teachers
**Purpose**: Create a new teacher account

**Request**:
```typescript
interface CreateTeacherRequest {
  name: string;                    // Required, 1-100 chars
  email: string;                   // Required, valid email, unique
  wage?: number;                   // Optional, positive decimal
  nationality?: string;            // Optional, max 100 chars
}
```

**Response**:
```typescript
interface CreateTeacherResponse {
  teacher: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: 'TEACHER';
    };
    wage: number | null;
    nationality: string | null;
    isActive: true;
    studentCount: 0;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Status Codes**:
- `201`: Created successfully
- `400`: Validation error (email exists, invalid data)
- `403`: Forbidden (not admin)
- `500`: Internal server error

---

### GET /api/admin/teachers/[id]
**Purpose**: Get specific teacher details with assigned students

**Request**:
```typescript
// Path parameter: teacher ID
// No request body
```

**Response**:
```typescript
interface GetTeacherResponse {
  teacher: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    wage: number | null;
    nationality: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  assignedStudents: Array<{
    id: string;
    name: string;
    assignedAt: string;
  }>;
}
```

**Status Codes**:
- `200`: Success
- `403`: Forbidden (not admin)
- `404`: Teacher not found
- `500`: Internal server error

---

### PUT /api/admin/teachers/[id]
**Purpose**: Update teacher information

**Request**:
```typescript
interface UpdateTeacherRequest {
  name?: string;                   // Optional, 1-100 chars
  email?: string;                  // Optional, valid email, unique
  wage?: number | null;            // Optional, positive decimal or null
  nationality?: string | null;     // Optional, max 100 chars or null
}
```

**Response**:
```typescript
interface UpdateTeacherResponse {
  teacher: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    wage: number | null;
    nationality: string | null;
    isActive: boolean;
    studentCount: number;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Status Codes**:
- `200`: Updated successfully
- `400`: Validation error
- `403`: Forbidden (not admin)
- `404`: Teacher not found
- `500`: Internal server error

---

### DELETE /api/admin/teachers/[id]
**Purpose**: Soft delete teacher (mark as inactive)

**Request**:
```typescript
// Path parameter: teacher ID
// No request body
```

**Response**:
```typescript
interface DeleteTeacherResponse {
  teacher: {
    id: string;
    isActive: false;
    updatedAt: string;
  };
  message: string; // "Teacher deactivated successfully"
}
```

**Status Codes**:
- `200`: Soft deleted successfully
- `403`: Forbidden (not admin)
- `404`: Teacher not found
- `500`: Internal server error

---

### GET /api/admin/students/available
**Purpose**: Get students available for assignment (for the assignment UI)

**Request**:
```typescript
// Query Parameters
interface GetAvailableStudentsQuery {
  search?: string;      // Search by student name
  teacherId?: string;   // Exclude already assigned to this teacher
}
```

**Response**:
```typescript
interface GetAvailableStudentsResponse {
  students: Array<{
    id: string;
    name: string;
    isAssignedToTeacher?: boolean; // For the specific teacher if teacherId provided
  }>;
}
```

**Status Codes**:
- `200`: Success
- `403`: Forbidden (not admin)
- `500`: Internal server error

---

### POST /api/admin/teachers/[id]/assignments
**Purpose**: Assign students to a teacher

**Request**:
```typescript
interface AssignStudentsRequest {
  studentIds: string[];           // Array of student IDs to assign
}
```

**Response**:
```typescript
interface AssignStudentsResponse {
  assignments: Array<{
    id: string;
    teacherId: string;
    studentId: string;
    studentName: string;
    assignedAt: string;
  }>;
  message: string; // "X students assigned successfully"
}
```

**Status Codes**:
- `201`: Assignments created successfully
- `400`: Validation error (invalid student IDs)
- `403`: Forbidden (not admin)
- `404`: Teacher not found
- `409`: Conflict (already assigned - but allowed per co-teaching model)
- `500`: Internal server error

---

### DELETE /api/admin/teachers/[teacherId]/assignments/[studentId]
**Purpose**: Remove student assignment from teacher

**Request**:
```typescript
// Path parameters: teacherId, studentId
// No request body
```

**Response**:
```typescript
interface RemoveAssignmentResponse {
  message: string; // "Student assignment removed successfully"
}
```

**Status Codes**:
- `200`: Assignment removed successfully
- `403`: Forbidden (not admin)
- `404`: Assignment not found
- `500`: Internal server error

## Error Response Format

All error responses follow this structure:
```typescript
interface ErrorResponse {
  error: string;           // Error message
  code?: string;           // Error code for client handling
  details?: unknown;       // Additional error details (validation errors, etc.)
}
```

## Validation Rules

### Input Validation
- **Name**: Required, 1-100 characters, trim whitespace
- **Email**: Required, valid email format, unique across users table
- **Wage**: Optional, if provided must be positive number with max 2 decimal places
- **Nationality**: Optional, if provided max 100 characters, trim whitespace
- **Student IDs**: Must be valid UUIDs, must exist in children table, must belong to same school

### Business Rules
- Only admins can access these endpoints
- All operations are scoped to admin's school (multi-tenant)
- Email uniqueness is enforced at user level
- Teacher soft deletion preserves student assignments
- Co-teaching is allowed (students can have multiple teachers)
- Student assignments require both teacher and student to belong to same school

### Rate Limiting
- Standard rate limiting applies (100 requests per minute per user)
- Bulk operations (student assignments) may have additional limits

## Authentication & Authorization

### Authentication
- Requires valid JWT token in Authorization header
- Token must be from active user session

### Authorization
- User must have 'ADMIN' role
- All operations are automatically scoped to user's school
- Cross-tenant data access is prevented at query level