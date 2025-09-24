# API Contract: User Role Management

## PUT /api/users/[id]/role

**Description**: Admin endpoint to update a user's role

**Authentication**: Required (Admin role only)

**Request**:
```json
{
  "role": "parent" | "teacher" | "admin"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com", 
    "name": "User Name",
    "role": "teacher",
    "sessionVersion": 2
  }
}
```

**Response Error (403)**:
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "ADMIN_REQUIRED"
}
```

**Response Error (404)**:
```json
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND"  
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "error": "Invalid role value",
  "code": "INVALID_ROLE"
}
```

## GET /api/users/me

**Description**: Get current user's profile including role

**Authentication**: Required

**Request**: No body

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name", 
    "role": "parent",
    "teamId": "team-uuid",
    "sessionVersion": 1
  }
}
```

**Response Error (401)**:
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

## GET /api/admin/access-logs

**Description**: Admin endpoint to retrieve access logs for audit

**Authentication**: Required (Admin role only)

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 200)
- `userId`: string (optional filter)
- `success`: boolean (optional filter)

**Request**: No body

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-uuid",
        "userId": "user-uuid", 
        "userName": "User Name",
        "route": "/admin/users",
        "success": true,
        "timestamp": "2025-09-24T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

**Response Error (403)**:
```json
{
  "success": false,
  "error": "Insufficient permissions", 
  "code": "ADMIN_REQUIRED"
}
```