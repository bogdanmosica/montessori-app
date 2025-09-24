# API Contract: Applications List

**Endpoint**: `GET /api/applications`  
**Method**: GET  
**Authentication**: Required (Admin role only)  
**Description**: Retrieve paginated list of school applications with filtering and search capabilities

## Request

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 10 | Number of applications per page (max 100) |
| `status` | string | No | - | Filter by status: 'pending', 'approved', 'rejected' |
| `search` | string | No | - | Search in parent name, child name, or email |
| `programRequested` | string | No | - | Filter by requested program |
| `sortBy` | string | No | 'createdAt' | Sort field: 'createdAt', 'parentName', 'childName' |
| `sortOrder` | string | No | 'desc' | Sort order: 'asc', 'desc' |

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Example Request
```http
GET /api/applications?page=1&limit=20&status=pending&search=Smith&sortBy=createdAt&sortOrder=desc
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "uuid-string",
        "parentName": "John Smith",
        "parentEmail": "john.smith@email.com",
        "parentPhone": "+1-555-0123",
        "childName": "Emma Smith",
        "childDateOfBirth": "2018-03-15",
        "childGender": "female",
        "programRequested": "Pre-K",
        "preferredStartDate": "2025-09-01",
        "status": "pending",
        "notes": "Interested in morning program",
        "createdAt": "2025-09-20T10:30:00.000Z",
        "updatedAt": "2025-09-20T10:30:00.000Z",
        "approvedAt": null,
        "approvedBy": null,
        "rejectedAt": null,
        "rejectedBy": null,
        "rejectionReason": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "status": "pending",
      "search": "Smith",
      "programRequested": null
    }
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Admin role required to access applications"
  }
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "limit",
        "message": "Limit must be between 1 and 100"
      }
    ]
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## OpenAPI Schema

```yaml
/api/applications:
  get:
    summary: List school applications
    description: Retrieve paginated list of applications with filtering and search
    tags:
      - Applications
    security:
      - BearerAuth: []
    parameters:
      - name: page
        in: query
        description: Page number
        required: false
        schema:
          type: integer
          minimum: 1
          default: 1
      - name: limit
        in: query
        description: Items per page
        required: false
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 10
      - name: status
        in: query
        description: Filter by application status
        required: false
        schema:
          type: string
          enum: [pending, approved, rejected]
      - name: search
        in: query
        description: Search in names and email
        required: false
        schema:
          type: string
          maxLength: 255
      - name: programRequested
        in: query
        description: Filter by requested program
        required: false
        schema:
          type: string
      - name: sortBy
        in: query
        description: Sort field
        required: false
        schema:
          type: string
          enum: [createdAt, parentName, childName]
          default: createdAt
      - name: sortOrder
        in: query
        description: Sort order
        required: false
        schema:
          type: string
          enum: [asc, desc]
          default: desc
    responses:
      200:
        description: Successfully retrieved applications
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: object
                  properties:
                    applications:
                      type: array
                      items:
                        $ref: '#/components/schemas/Application'
                    pagination:
                      $ref: '#/components/schemas/Pagination'
                    filters:
                      type: object
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      400:
        $ref: '#/components/responses/BadRequest'
      500:
        $ref: '#/components/responses/InternalError'

components:
  schemas:
    Application:
      type: object
      properties:
        id:
          type: string
          format: uuid
        parentName:
          type: string
        parentEmail:
          type: string
          format: email
        parentPhone:
          type: string
          nullable: true
        childName:
          type: string
        childDateOfBirth:
          type: string
          format: date
        childGender:
          type: string
          nullable: true
          enum: [male, female, other]
        programRequested:
          type: string
        preferredStartDate:
          type: string
          format: date
          nullable: true
        status:
          type: string
          enum: [pending, approved, rejected]
        notes:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        approvedAt:
          type: string
          format: date-time
          nullable: true
        approvedBy:
          type: string
          format: uuid
          nullable: true
        rejectedAt:
          type: string
          format: date-time
          nullable: true
        rejectedBy:
          type: string
          format: uuid
          nullable: true
        rejectionReason:
          type: string
          nullable: true
    
    Pagination:
      type: object
      properties:
        currentPage:
          type: integer
        totalPages:
          type: integer
        totalItems:
          type: integer
        limit:
          type: integer
        hasNextPage:
          type: boolean
        hasPrevPage:
          type: boolean
```

## Implementation Notes

### Multi-Tenant Security
- All queries must filter by current admin's school ID
- Applications from other schools must never be returned
- School ID is derived from authenticated user's session

### Performance Requirements
- Response time must be under 300ms for typical page sizes
- Database queries should use proper indexes for pagination and filtering
- Count queries run in parallel with data queries

### Caching Strategy
- Response can be cached for 5 minutes per school/filter combination
- Cache invalidation on new applications or status changes
- No caching during active approval processes

### Rate Limiting
- 100 requests per minute per admin user
- Burst allowance of 20 requests per 10 seconds
- Apply rate limiting at application level