# API Contract: Application Enrollment (Approve/Reject)

**Endpoint**: `POST /api/admin/enrollment`  
**Method**: POST  
**Authentication**: Required (Admin role only)  
**Description**: Approve or reject a school application, creating parent/child records on approval

## Request

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

#### Approve Application
```json
{
  "applicationId": "uuid-string",
  "action": "approve",
  "parentData": {
    "name": "John Smith",
    "email": "john.smith@email.com", 
    "phone": "+1-555-0123",
    "password": "temporaryPassword123",
    "sendWelcomeEmail": true
  },
  "childData": {
    "name": "Emma Smith",
    "dateOfBirth": "2018-03-15",
    "gender": "female",
    "programId": "uuid-program-id",
    "startDate": "2025-09-01"
  },
  "enrollmentData": {
    "programId": "uuid-program-id",
    "status": "active",
    "startDate": "2025-09-01"
  },
  "notes": "Approved for morning Pre-K program"
}
```

#### Reject Application
```json
{
  "applicationId": "uuid-string",
  "action": "reject",
  "rejectionReason": "Application incomplete - missing immunization records",
  "notifyParent": true
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `applicationId` | string (UUID) | Yes | Application to process |
| `action` | string | Yes | 'approve' or 'reject' |
| `parentData` | object | If approving | Parent user account data |
| `childData` | object | If approving | Child record data |
| `enrollmentData` | object | If approving | Enrollment details |
| `rejectionReason` | string | If rejecting | Reason for rejection |
| `notes` | string | No | Admin notes |
| `notifyParent` | boolean | No | Send email notification (default: true) |

## Response

### Success Response - Approval (200 OK)

```json
{
  "success": true,
  "data": {
    "application": {
      "id": "uuid-string",
      "status": "approved",
      "approvedAt": "2025-09-24T14:30:00.000Z",
      "approvedBy": "admin-user-uuid"
    },
    "parentUser": {
      "id": "new-parent-uuid",
      "name": "John Smith",
      "email": "john.smith@email.com",
      "role": "parent",
      "isFromApplication": true,
      "createdAt": "2025-09-24T14:30:00.000Z"
    },
    "child": {
      "id": "new-child-uuid", 
      "name": "Emma Smith",
      "parentId": "new-parent-uuid",
      "dateOfBirth": "2018-03-15",
      "enrollmentStatus": "enrolled",
      "createdAt": "2025-09-24T14:30:00.000Z"
    },
    "enrollment": {
      "id": "enrollment-uuid",
      "childId": "new-child-uuid",
      "parentId": "new-parent-uuid", 
      "programId": "uuid-program-id",
      "status": "active",
      "startDate": "2025-09-01",
      "createdAt": "2025-09-24T14:30:00.000Z"
    },
    "notifications": {
      "welcomeEmailSent": true,
      "parentNotified": true
    }
  },
  "message": "Application approved successfully. Parent account and child record created."
}
```

### Success Response - Rejection (200 OK)

```json
{
  "success": true,
  "data": {
    "application": {
      "id": "uuid-string",
      "status": "rejected",
      "rejectionReason": "Application incomplete - missing immunization records",
      "rejectedAt": "2025-09-24T14:30:00.000Z",
      "rejectedBy": "admin-user-uuid"
    },
    "notifications": {
      "parentNotified": true
    }
  },
  "message": "Application rejected successfully."
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "parentData.email",
        "message": "Email already exists in system"
      },
      {
        "field": "childData.dateOfBirth",
        "message": "Date of birth is required for approval"
      }
    ]
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "APPLICATION_NOT_FOUND",
    "message": "Application not found or not accessible"
  }
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": {
    "code": "APPLICATION_ALREADY_PROCESSED",
    "message": "Application has already been approved or rejected"
  }
}
```

#### 422 Unprocessable Entity
```json
{
  "success": false,
  "error": {
    "code": "PARENT_EMAIL_EXISTS",
    "message": "Parent email already exists in the system",
    "details": {
      "existingUserId": "existing-user-uuid",
      "suggestedAction": "Use different email or contact existing parent"
    }
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "TRANSACTION_FAILED", 
    "message": "Failed to process application. Changes have been rolled back.",
    "details": {
      "step": "child_creation",
      "reason": "Database constraint violation"
    }
  }
}
```

## OpenAPI Schema

```yaml
/api/admin/enrollment:
  post:
    summary: Process application (approve or reject)
    description: Approve application creating parent/child records, or reject with reason
    tags:
      - Admin
      - Applications
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            oneOf:
              - $ref: '#/components/schemas/ApprovalRequest'
              - $ref: '#/components/schemas/RejectionRequest'
          examples:
            approve:
              summary: Approve application
              value:
                applicationId: "uuid-string"
                action: "approve"
                parentData:
                  name: "John Smith"
                  email: "john.smith@email.com"
                  phone: "+1-555-0123"
                  password: "temporaryPassword123"
                childData:
                  name: "Emma Smith"
                  dateOfBirth: "2018-03-15"
                  gender: "female"
                  programId: "uuid-program-id"
            reject:
              summary: Reject application
              value:
                applicationId: "uuid-string"
                action: "reject"
                rejectionReason: "Missing required documentation"
    responses:
      200:
        description: Application processed successfully
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/ApprovalResponse'
                - $ref: '#/components/schemas/RejectionResponse'
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
      422:
        $ref: '#/components/responses/UnprocessableEntity'
      500:
        $ref: '#/components/responses/InternalError'

components:
  schemas:
    ApprovalRequest:
      type: object
      required: [applicationId, action, parentData, childData, enrollmentData]
      properties:
        applicationId:
          type: string
          format: uuid
        action:
          type: string
          enum: [approve]
        parentData:
          type: object
          required: [name, email, password]
          properties:
            name:
              type: string
              maxLength: 255
            email:
              type: string
              format: email
              maxLength: 255
            phone:
              type: string
              maxLength: 20
            password:
              type: string
              minLength: 8
            sendWelcomeEmail:
              type: boolean
              default: true
        childData:
          type: object
          required: [name, dateOfBirth]
          properties:
            name:
              type: string
              maxLength: 255
            dateOfBirth:
              type: string
              format: date
            gender:
              type: string
              enum: [male, female, other]
            programId:
              type: string
              format: uuid
            startDate:
              type: string
              format: date
        enrollmentData:
          type: object
          properties:
            programId:
              type: string
              format: uuid
            status:
              type: string
              enum: [active]
              default: active
            startDate:
              type: string
              format: date
        notes:
          type: string
          maxLength: 1000

    RejectionRequest:
      type: object
      required: [applicationId, action, rejectionReason]
      properties:
        applicationId:
          type: string
          format: uuid
        action:
          type: string
          enum: [reject]
        rejectionReason:
          type: string
          maxLength: 1000
        notifyParent:
          type: boolean
          default: true
        notes:
          type: string
          maxLength: 1000
```

## Implementation Notes

### Transaction Requirements
- All approval operations must be wrapped in database transaction
- Rollback on any failure during parent/child/enrollment creation
- Atomic status update - no partial approvals allowed

### Security Considerations
- Validate admin has access to specified application's school
- Password generation should use secure random methods
- Email validation prevents duplicate accounts

### Audit Logging
- Log all approval/rejection actions to access_logs
- Include admin user ID, application ID, and action type
- Store original application data before modification

### Email Notifications
- Welcome emails sent asynchronously after successful approval
- Rejection notifications include reason and next steps
- Email failures should not prevent application processing

### Validation Rules
- Parent email must be unique within the system
- Child date of birth must be valid and not in future
- Program ID must exist and be available for enrollment
- Status transition validation (only pending → approved/rejected)