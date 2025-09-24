# API Contract: Admin Role Assignment Interface

## POST /api/admin/users/[id]/assign-role

**Description**: Admin interface endpoint to assign roles to users with validation and logging

**Authentication**: Required (Admin role only)

**Request**:
```json
{
  "userId": "user-uuid",
  "newRole": "parent" | "teacher" | "admin",
  "reason": "Optional reason for role change"
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
    "previousRole": "parent",
    "newRole": "teacher",
    "sessionVersion": 3,
    "assignedBy": "admin-uuid",
    "timestamp": "2025-09-24T10:30:00Z"
  }
}
```

**Response Error (403)**:
```json
{
  "success": false,
  "error": "Insufficient permissions - Admin role required",
  "code": "ADMIN_REQUIRED"
}
```

**Response Error (404)**:
```json
{
  "success": false,
  "error": "Target user not found",
  "code": "USER_NOT_FOUND"
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "error": "Invalid role assignment",
  "code": "INVALID_ROLE_ASSIGNMENT",
  "details": "Cannot assign admin role to user outside organization"
}
```

## Validation Rules

- Admin cannot demote themselves
- Role assignments must respect organizational hierarchy
- All role changes are logged to access_logs
- Target user's session is invalidated (sessionVersion increment)
- Multi-tenant isolation enforced (same team only)