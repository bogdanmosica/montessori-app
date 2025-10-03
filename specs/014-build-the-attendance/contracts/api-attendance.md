# API Contract: Attendance Management

## Base URL
All endpoints are relative to the application base URL under `/api/teacher/attendance/`

## Authentication
All endpoints require Teacher role authentication via session middleware.

## Data Types

### AttendanceStatus
```typescript
type AttendanceStatus = 
  | 'present' 
  | 'absent' 
  | 'pending_present' 
  | 'pending_absent'
  | 'confirmed_present' 
  | 'confirmed_absent';
```

### AttendanceRecord
```typescript
interface AttendanceRecord {
  id: string;                    // UUID
  studentId: string;             // UUID reference to child
  teacherId: string;             // UUID reference to teacher
  date: string;                  // ISO date format (YYYY-MM-DD)
  status: AttendanceStatus;      // Attendance status enum
  notes: string | null;          // Free-form daily notes
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  student: {                     // Populated student details
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
}
```

### CreateAttendanceRequest
```typescript
interface CreateAttendanceRequest {
  studentId: string;             // UUID reference to child
  date: string;                  // ISO date format (YYYY-MM-DD)
  status: AttendanceStatus;      // Initial attendance status
  notes?: string;                // Optional daily notes
}
```

### UpdateAttendanceRequest
```typescript
interface UpdateAttendanceRequest {
  status?: AttendanceStatus;     // Updated attendance status
  notes?: string;                // Updated daily notes (null to clear)
}
```

### AttendanceListResponse
```typescript
interface AttendanceListResponse {
  date: string;                  // Requested date
  attendanceRecords: AttendanceRecord[];
  studentsWithoutAttendance: {   // Students in class without attendance records
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }[];
  metadata: {
    totalStudents: number;       // Total students in teacher's class
    recordedAttendance: number;  // Number of students with attendance
    pendingConsensus: number;    // Number of co-teaching consensus pending
  };
}
```

## Endpoints

### GET /api/teacher/attendance
Retrieve attendance records for teacher's class on specified date.

**Query Parameters:**
- `date` (required): ISO date string (YYYY-MM-DD)

**Request Example:**
```http
GET /api/teacher/attendance?date=2025-10-03
Authorization: Bearer <session-token>
```

**Response (200 OK):**
```json
{
  "date": "2025-10-03",
  "attendanceRecords": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "studentId": "789e0123-e89b-12d3-a456-426614174001",
      "teacherId": "456e7890-e89b-12d3-a456-426614174002",
      "date": "2025-10-03",
      "status": "present",
      "notes": "Had a great day, participated well in circle time",
      "createdAt": "2025-10-03T08:30:00Z",
      "updatedAt": "2025-10-03T08:30:00Z",
      "student": {
        "id": "789e0123-e89b-12d3-a456-426614174001",
        "firstName": "Emma",
        "lastName": "Johnson",
        "dateOfBirth": "2019-05-15"
      }
    }
  ],
  "studentsWithoutAttendance": [
    {
      "id": "234e5678-e89b-12d3-a456-426614174003",
      "firstName": "Liam",
      "lastName": "Smith",
      "dateOfBirth": "2019-08-22"
    }
  ],
  "metadata": {
    "totalStudents": 15,
    "recordedAttendance": 14,
    "pendingConsensus": 1
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid date parameter
- `401 Unauthorized`: Invalid or missing authentication
- `403 Forbidden`: User does not have Teacher role
- `404 Not Found`: No students assigned to teacher

---

### POST /api/teacher/attendance
Create new attendance record for a student.

**Request Body:**
```json
{
  "studentId": "789e0123-e89b-12d3-a456-426614174001",
  "date": "2025-10-03",
  "status": "present",
  "notes": "Had a great day, participated well in circle time"
}
```

**Response (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "studentId": "789e0123-e89b-12d3-a456-426614174001",
  "teacherId": "456e7890-e89b-12d3-a456-426614174002",
  "date": "2025-10-03",
  "status": "present",
  "notes": "Had a great day, participated well in circle time",
  "createdAt": "2025-10-03T08:30:00Z",
  "updatedAt": "2025-10-03T08:30:00Z",
  "student": {
    "id": "789e0123-e89b-12d3-a456-426614174001",
    "firstName": "Emma",
    "lastName": "Johnson",
    "dateOfBirth": "2019-05-15"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body or validation errors
- `401 Unauthorized`: Invalid or missing authentication
- `403 Forbidden`: Teacher cannot record attendance for this student
- `409 Conflict`: Attendance record already exists for student on date

---

### PUT /api/teacher/attendance/[id]
Update existing attendance record.

**Path Parameters:**
- `id`: UUID of attendance record to update

**Request Body:**
```json
{
  "status": "absent",
  "notes": "Called in sick by parent"
}
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "studentId": "789e0123-e89b-12d3-a456-426614174001",
  "teacherId": "456e7890-e89b-12d3-a456-426614174002",
  "date": "2025-10-03",
  "status": "absent",
  "notes": "Called in sick by parent",
  "createdAt": "2025-10-03T08:30:00Z",
  "updatedAt": "2025-10-03T10:15:00Z",
  "student": {
    "id": "789e0123-e89b-12d3-a456-426614174001",
    "firstName": "Emma",
    "lastName": "Johnson",
    "dateOfBirth": "2019-05-15"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body or validation errors
- `401 Unauthorized`: Invalid or missing authentication
- `403 Forbidden`: Teacher cannot modify this attendance record
- `404 Not Found`: Attendance record not found

---

### DELETE /api/teacher/attendance/[id]
Remove attendance record (optional endpoint for corrections).

**Path Parameters:**
- `id`: UUID of attendance record to delete

**Response (204 No Content):**
Empty response body on successful deletion.

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication
- `403 Forbidden`: Teacher cannot delete this attendance record
- `404 Not Found`: Attendance record not found

## Co-Teaching Consensus Workflow

### Single Teacher Scenario
1. Teacher creates attendance with `present` or `absent` status
2. Record is immediately final (no consensus required)

### Co-Teaching Scenario
1. First teacher creates attendance with `pending_present` or `pending_absent`
2. System detects multiple teachers for student
3. Second teacher can:
   - Agree: Updates status to `confirmed_present` or `confirmed_absent`
   - Disagree: Updates to different pending status
4. Consensus reached when all teachers agree on same status

### API Behavior for Co-Teaching
- **POST**: Automatically sets `pending_*` status if multiple teachers detected
- **PUT**: Handles consensus logic and status transitions
- **GET**: Shows current consensus state in `metadata.pendingConsensus`

## Security & Validation

### Authentication Requirements
- All endpoints require valid session with Teacher role
- Teacher ID extracted from session for automatic tenant scoping

### Authorization Rules
- Teachers can only access attendance for their assigned students
- All queries automatically scoped by teacher's school/tenant
- Student-teacher associations validated on every request

### Data Validation
- Date must be valid ISO format (YYYY-MM-DD)
- Student ID must exist and be assigned to requesting teacher
- Status must be valid enum value
- Notes limited to reasonable length (10,000 characters max)

### Rate Limiting
- Standard API rate limits apply (per existing application configuration)
- Bulk operations batched to prevent excessive database load

## Error Handling

### Standard HTTP Status Codes
- `200 OK`: Successful GET/PUT operations
- `201 Created`: Successful POST operations  
- `204 No Content`: Successful DELETE operations
- `400 Bad Request`: Invalid request data or validation errors
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists or constraint violation
- `500 Internal Server Error`: Unexpected server errors

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Student ID is required",
    "details": {
      "field": "studentId",
      "constraint": "required"
    }
  }
}
```