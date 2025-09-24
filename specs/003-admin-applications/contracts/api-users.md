# API Contract: Create Parent User

**Endpoint**: `POST /api/users`  
**Method**: POST  
**Authentication**: Required (Admin role only)  
**Description**: Create a new parent user account (extends existing users endpoint for application approval)

## Request

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "role": "parent",
  "applicationId": "application-uuid",
  "name": "John Smith",
  "email": "john.smith@email.com",
  "phone": "+1-555-0123",
  "password": "temporaryPassword123",
  "isFromApplication": true,
  "sendWelcomeEmail": true,
  "parentProfile": {
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zipCode": "62701"
    },
    "occupation": "Teacher",
    "emergencyContact": {
      "name": "Jane Smith",
      "phone": "+1-555-0987",
      "relationship": "spouse"
    }
  }
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | Must be 'parent' for this endpoint usage |
| `applicationId` | string (UUID) | No | Originating application ID |
| `name` | string | Yes | Parent's full name |
| `email` | string | Yes | Parent's email address (must be unique) |
| `phone` | string | No | Parent's phone number |
| `password` | string | Yes | Temporary password (min 8 characters) |
| `isFromApplication` | boolean | No | Default: false, set true for app approvals |
| `sendWelcomeEmail` | boolean | No | Default: true |
| `parentProfile` | object | No | Additional parent information |

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "new-parent-uuid",
      "name": "John Smith",
      "email": "john.smith@email.com", 
      "phone": "+1-555-0123",
      "role": "parent",
      "isFromApplication": true,
      "applicationId": "application-uuid",
      "schoolId": "current-school-uuid",
      "parentProfile": {
        "address": {
          "street": "123 Main St",
          "city": "Springfield", 
          "state": "IL",
          "zipCode": "62701"
        },
        "occupation": "Teacher",
        "emergencyContact": {
          "name": "Jane Smith",
          "phone": "+1-555-0987",
          "relationship": "spouse"
        }
      },
      "isActive": true,
      "emailVerified": false,
      "createdAt": "2025-09-24T14:30:00.000Z",
      "updatedAt": "2025-09-24T14:30:00.000Z",
      "lastLoginAt": null
    },
    "notifications": {
      "welcomeEmailSent": true,
      "passwordResetRequired": true
    }
  },
  "message": "Parent user created successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid user data",
    "details": [
      {
        "field": "email",
        "message": "Valid email address is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters long"
      },
      {
        "field": "role",
        "message": "Role must be 'parent' for this operation"
      }
    ]
  }
}
```

#### 409 Conflict - Email Already Exists
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "User with this email already exists",
    "details": {
      "existingUserId": "existing-user-uuid",
      "existingUserRole": "parent",
      "suggestedAction": "Use different email or contact existing user"
    }
  }
}
```

#### 422 Unprocessable Entity - Role Restriction
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ROLE_FOR_OPERATION",
    "message": "Only parent role can be created through application approval process"
  }
}
```

## OpenAPI Schema

```yaml
/api/users:
  post:
    summary: Create parent user account
    description: Create new parent user (extends existing endpoint for applications)
    tags:
      - Users
      - Parents
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateParentUserRequest'
    responses:
      201:
        description: Parent user created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateParentUserResponse'
      400:
        $ref: '#/components/responses/BadRequest'
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      409:
        $ref: '#/components/responses/Conflict'
      422:
        $ref: '#/components/responses/UnprocessableEntity'

components:
  schemas:
    CreateParentUserRequest:
      type: object
      required: [role, name, email, password]
      properties:
        role:
          type: string
          enum: [parent]
          description: User role (must be parent)
        applicationId:
          type: string
          format: uuid
          description: Originating application ID
        name:
          type: string
          maxLength: 255
          description: Parent's full name
        email:
          type: string
          format: email
          maxLength: 255
          description: Parent's email address
        phone:
          type: string
          maxLength: 20
          description: Parent's phone number
        password:
          type: string
          minLength: 8
          description: Temporary password
        isFromApplication:
          type: boolean
          default: false
          description: Indicates user created from application
        sendWelcomeEmail:
          type: boolean
          default: true
          description: Send welcome email notification
        parentProfile:
          type: object
          description: Additional parent information
          properties:
            address:
              type: object
              properties:
                street:
                  type: string
                city:
                  type: string
                state:
                  type: string
                zipCode:
                  type: string
            occupation:
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

    CreateParentUserResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            user:
              $ref: '#/components/schemas/ParentUser'
            notifications:
              type: object
              properties:
                welcomeEmailSent:
                  type: boolean
                passwordResetRequired:
                  type: boolean
        message:
          type: string

    ParentUser:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        phone:
          type: string
          nullable: true
        role:
          type: string
          enum: [parent]
        isFromApplication:
          type: boolean
        applicationId:
          type: string
          format: uuid
          nullable: true
        schoolId:
          type: string
          format: uuid
        parentProfile:
          type: object
          nullable: true
        isActive:
          type: boolean
        emailVerified:
          type: boolean
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        lastLoginAt:
          type: string
          format: date-time
          nullable: true
```

## Implementation Notes

### Multi-Tenant Security
- User automatically assigned to admin's school via schoolId
- Email uniqueness enforced globally across all schools
- Cross-tenant user creation forbidden

### Password Management
- Temporary passwords generated for application approvals
- Force password reset on first login
- Password must meet minimum security requirements
- Secure password hashing (bcrypt) before storage

### Email Handling
- Welcome emails sent asynchronously after user creation
- Email verification link included in welcome email
- Failed email sends logged but don't prevent user creation
- Notification preferences respected

### Role and Permission Management
- Role defaulted to 'parent' for application approvals
- isFromApplication flag tracks origin for audit purposes
- Parent users have restricted access to child-related data only
- Role cannot be changed through this endpoint

### Integration with Application Approval
- applicationId links user back to originating application
- isFromApplication flag enables special handling
- Parent profile data populated from application details
- User marked as requiring password reset

### Audit and Logging
- User creation logged to access_logs with admin context
- Include application ID for traceability
- Log email notification attempts and results

### Validation Rules
- Email format validation and uniqueness check
- Password complexity requirements enforced
- Phone number format validation if provided
- Name cannot be empty or contain only whitespace

### Error Recovery
- Duplicate email errors include existing user details
- Clear error messages for validation failures
- Rollback on any database constraint violations