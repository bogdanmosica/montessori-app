# API Contracts: Teacher Progress Board

## Endpoints Overview

### GET /api/teacher/progress-board
Retrieve all lesson progress cards for the authenticated teacher.

**Request**:
- Method: GET
- Auth: Required (Teacher role)
- Query Parameters:
  - `student_id?: string` - Filter by specific student
  - `category?: string` - Filter by lesson category
  - `status?: string` - Filter by progress status

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "id": "uuid",
        "name": "Not Started",
        "status_value": "not_started", 
        "position": 0,
        "color": "#ef4444",
        "cards": [
          {
            "id": "uuid",
            "lesson_id": "uuid",
            "lesson_title": "Addition with Manipulatives",
            "lesson_category": "Mathematics",
            "student_id": "uuid",
            "student_name": "John Doe",
            "status": "not_started",
            "position": 0,
            "locked_by": null,
            "locked_at": null,
            "updated_at": "2025-10-02T10:00:00Z"
          }
        ]
      }
    ],
    "filters": {
      "students": [
        {"id": "uuid", "name": "John Doe"},
        {"id": "uuid", "name": "Jane Smith"}
      ],
      "categories": ["Mathematics", "Language", "Science"]
    }
  }
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not a Teacher)
- 500: Internal Server Error

### POST /api/teacher/progress-board/cards
Create a new lesson progress card.

**Request**:
- Method: POST
- Auth: Required (Teacher role)
- Body:
```json
{
  "lesson_id": "uuid",
  "student_id": "uuid", // nullable for template cards
  "status": "not_started"
}
```

**Response**: 201 Created
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lesson_id": "uuid",
    "lesson_title": "Addition with Manipulatives",
    "lesson_category": "Mathematics", 
    "student_id": "uuid",
    "student_name": "John Doe",
    "status": "not_started",
    "position": 0,
    "locked_by": null,
    "locked_at": null,
    "created_at": "2025-10-02T10:00:00Z",
    "updated_at": "2025-10-02T10:00:00Z"
  }
}
```

**Error Responses**:
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 409: Conflict (duplicate lesson-student pair)
- 500: Internal Server Error

### PATCH /api/teacher/progress-board/cards/[id]/move
Move a card to a different status column.

**Request**:
- Method: PATCH
- Auth: Required (Teacher role)
- Path: `/api/teacher/progress-board/cards/{card_id}/move`
- Body:
```json
{
  "new_status": "in_progress",
  "new_position": 2,
  "version": "2025-10-02T10:00:00Z" // for optimistic locking
}
```

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "lesson_id": "uuid", 
    "lesson_title": "Addition with Manipulatives",
    "lesson_category": "Mathematics",
    "student_id": "uuid",
    "student_name": "John Doe",
    "status": "in_progress",
    "position": 2,
    "locked_by": null,
    "locked_at": null,
    "updated_at": "2025-10-02T10:05:00Z"
  }
}
```

**Error Responses**:
- 400: Bad Request (invalid status transition)
- 401: Unauthorized
- 403: Forbidden
- 404: Card not found
- 409: Conflict (card locked by another user or version mismatch)
- 500: Internal Server Error

### POST /api/teacher/progress-board/cards/[id]/lock
Lock a card for editing to prevent concurrent modifications.

**Request**:
- Method: POST
- Auth: Required (Teacher role)
- Path: `/api/teacher/progress-board/cards/{card_id}/lock`

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "locked_by": "uuid",
    "locked_at": "2025-10-02T10:00:00Z",
    "expires_at": "2025-10-02T10:05:00Z"
  }
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden
- 404: Card not found
- 409: Already locked by another user
- 500: Internal Server Error

### DELETE /api/teacher/progress-board/cards/[id]/lock
Unlock a previously locked card.

**Request**:
- Method: DELETE
- Auth: Required (Teacher role)
- Path: `/api/teacher/progress-board/cards/{card_id}/lock`

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "locked_by": null,
    "locked_at": null
  }
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not the locking user)
- 404: Card not found or not locked
- 500: Internal Server Error

### POST /api/teacher/progress-board/batch-move
Move multiple cards in a single transaction (for drag-and-drop optimization).

**Request**:
- Method: POST
- Auth: Required (Teacher role)
- Body:
```json
{
  "moves": [
    {
      "card_id": "uuid",
      "new_status": "in_progress", 
      "new_position": 0,
      "version": "2025-10-02T10:00:00Z"
    },
    {
      "card_id": "uuid",
      "new_status": "in_progress",
      "new_position": 1, 
      "version": "2025-10-02T10:01:00Z"
    }
  ]
}
```

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "updated_cards": [
      {
        "id": "uuid",
        "status": "in_progress",
        "position": 0,
        "updated_at": "2025-10-02T10:05:00Z"
      }
    ],
    "failed_moves": [
      {
        "card_id": "uuid",
        "error": "Card locked by another user",
        "code": "CARD_LOCKED"
      }
    ]
  }
}
```

**Error Responses**:
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 500: Internal Server Error

### DELETE /api/teacher/progress-board/cards/[id]
Delete a lesson progress card.

**Request**:
- Method: DELETE
- Auth: Required (Teacher role)
- Path: `/api/teacher/progress-board/cards/{card_id}`

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "deleted_id": "uuid"
  }
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden
- 404: Card not found
- 409: Card locked by another user
- 500: Internal Server Error

## Error Response Format

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error context when applicable
    }
  }
}
```

### Error Codes
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_ERROR`: Request validation failed
- `CARD_NOT_FOUND`: Card does not exist
- `CARD_LOCKED`: Card locked by another user
- `DUPLICATE_ASSIGNMENT`: Lesson already assigned to student
- `INVALID_STATUS_TRANSITION`: Status change not allowed
- `VERSION_CONFLICT`: Optimistic locking conflict
- `INTERNAL_ERROR`: Server error

## Rate Limiting

All endpoints are subject to rate limiting:
- 100 requests per minute per user
- Burst limit: 20 requests per 10 seconds
- Headers returned: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Caching Strategy

- GET /api/teacher/progress-board: Cache for 30 seconds with ETag support
- Other endpoints: No caching (real-time data)
- Client should implement optimistic updates for better UX