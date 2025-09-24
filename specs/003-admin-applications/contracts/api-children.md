# API Contract: Create Child Record

**Endpoint**: `POST /api/children`  
**Method**: POST  
**Authentication**: Required (Admin role only)  
**Description**: Create a new child record (used during application approval process)

## Request

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "parentId": "parent-user-uuid",
  "applicationId": "application-uuid",
  "name": "Emma Smith",
  "dateOfBirth": "2018-03-15",
  "gender": "female",
  "enrollmentStatus": "enrolled",
  "medicalInfo": {
    "allergies": ["peanuts", "dairy"],
    "medications": [],
    "emergencyContact": {
      "name": "Jane Smith",
      "phone": "+1-555-0987",
      "relationship": "aunt"
    }
  },
  "notes": "Transferred from previous daycare"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `parentId` | string (UUID) | Yes | Parent user ID to link child to |
| `applicationId` | string (UUID) | No | Originating application ID |
| `name` | string | Yes | Child's full name |
| `dateOfBirth` | string (date) | Yes | Child's birth date (YYYY-MM-DD) |
| `gender` | string | No | Child's gender ('male', 'female', 'other') |
| `enrollmentStatus` | string | No | Default: 'enrolled' |
| `medicalInfo` | object | No | Medical and emergency information |
| `notes` | string | No | Additional notes about the child |

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "child": {
      "id": "new-child-uuid",
      "parentId": "parent-user-uuid", 
      "applicationId": "application-uuid",
      "name": "Emma Smith",
      "dateOfBirth": "2018-03-15",
      "gender": "female",
      "enrollmentStatus": "enrolled",
      "medicalInfo": {
        "allergies": ["peanuts", "dairy"],
        "medications": [],
        "emergencyContact": {
          "name": "Jane Smith",
          "phone": "+1-555-0987",
          "relationship": "aunt"
        }
      },
      "notes": "Transferred from previous daycare",
      "createdAt": "2025-09-24T14:30:00.000Z",
      "updatedAt": "2025-09-24T14:30:00.000Z",
      "schoolId": "current-school-uuid"
    }
  },
  "message": "Child record created successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid child data",
    "details": [
      {
        "field": "dateOfBirth",
        "message": "Date of birth cannot be in the future"
      },
      {
        "field": "name",
        "message": "Name is required and cannot be empty"
      }
    ]
  }
}
```

#### 404 Not Found - Parent Not Found
```json
{
  "success": false,
  "error": {
    "code": "PARENT_NOT_FOUND",
    "message": "Parent user not found or not accessible"
  }
}
```

#### 409 Conflict - Duplicate Child
```json
{
  "success": false,
  "error": {
    "code": "CHILD_ALREADY_EXISTS",
    "message": "Child with this name and date of birth already exists for this parent",
    "details": {
      "existingChildId": "existing-child-uuid"
    }
  }
}
```

#### 403 Forbidden - Cross-Tenant Access
```json
{
  "success": false,
  "error": {
    "code": "CROSS_TENANT_ACCESS",
    "message": "Cannot create child for parent from different school"
  }
}
```

## OpenAPI Schema

```yaml
/api/children:
  post:
    summary: Create child record
    description: Create a new child record linked to a parent
    tags:
      - Children
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateChildRequest'
    responses:
      201:
        description: Child created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateChildResponse'
      400:
        $ref: '#/components/responses/BadRequest'
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      404:
        $ref: '#/components/responses/NotFound'
      409:
        $ref: '#/components/responses/Conflict'

components:
  schemas:
    CreateChildRequest:
      type: object
      required: [parentId, name, dateOfBirth]
      properties:
        parentId:
          type: string
          format: uuid
          description: Parent user ID
        applicationId:
          type: string
          format: uuid
          description: Originating application ID
        name:
          type: string
          maxLength: 255
          description: Child's full name
        dateOfBirth:
          type: string
          format: date
          description: Child's birth date
        gender:
          type: string
          enum: [male, female, other]
          description: Child's gender
        enrollmentStatus:
          type: string
          enum: [enrolled, pending, inactive]
          default: enrolled
          description: Enrollment status
        medicalInfo:
          type: object
          properties:
            allergies:
              type: array
              items:
                type: string
            medications:
              type: array
              items:
                type: string
            emergencyContact:
              type: object
              properties:
                name:
                  type: string
                phone:
                  type: string
                relationship:
                  type: string
        notes:
          type: string
          maxLength: 1000
          description: Additional notes

    CreateChildResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            child:
              $ref: '#/components/schemas/Child'
        message:
          type: string

    Child:
      type: object
      properties:
        id:
          type: string
          format: uuid
        parentId:
          type: string
          format: uuid
        applicationId:
          type: string
          format: uuid
          nullable: true
        name:
          type: string
        dateOfBirth:
          type: string
          format: date
        gender:
          type: string
          enum: [male, female, other]
          nullable: true
        enrollmentStatus:
          type: string
          enum: [enrolled, pending, inactive]
        medicalInfo:
          type: object
          nullable: true
        notes:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        schoolId:
          type: string
          format: uuid
```

## Implementation Notes

### Multi-Tenant Security
- Child records are automatically scoped to admin's school
- Parent must belong to same school as creating admin
- Cross-tenant child creation is forbidden

### Validation Rules
- Child name + date of birth + parent ID must be unique
- Date of birth cannot be in the future
- Parent ID must reference existing parent user
- Gender is optional but must be valid enum if provided

### Database Relationships
- Child record links to parent via `parentId` foreign key
- Optional link to originating application via `applicationId`
- School scoping enforced through `schoolId` column

### Medical Information Handling
- Medical info is stored as JSON for flexibility
- Emergency contact information is optional but recommended
- Allergies and medications are stored as arrays for easy management

### Audit and Logging
- Child creation actions logged to access_logs
- Include admin user ID and parent/application context
- Track source application for audit trail

### Performance Considerations
- Index on (parentId, name, dateOfBirth) for duplicate checking
- Index on schoolId for multi-tenant queries
- JSON indexing on medical info if search required