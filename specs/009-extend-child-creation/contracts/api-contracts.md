# API Contracts: Child Fee Management

## Child Creation Endpoints

### POST /api/admin/children
Create a new child with optional monthly fee.

**Request Body:**
```typescript
{
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  monthlyFee?: number; // RON amount, converted to cents
  gender?: string;
  startDate: string; // ISO date
  specialNeeds?: string;
  medicalConditions?: string;
  // ... other existing child fields
}
```

**Response (201 Created):**
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  monthlyFee: number; // cents
  monthlyFeeDisplay: string; // "1,250 RON"
  // ... other child fields
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin role
- `500 Internal Server Error`: Server error

### PATCH /api/admin/children/[id]
Update child information including monthly fee.

**Request Body:**
```typescript
{
  monthlyFee?: number; // RON amount, converted to cents
  // ... other updatable child fields
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  monthlyFee: number; // cents
  monthlyFeeDisplay: string; // "1,250 RON" 
  updatedAt: string; // ISO timestamp
  // ... other child fields
}
```

## Enrollment Override Endpoints

### POST /api/admin/enrollments
Create enrollment with optional fee override.

**Request Body:**
```typescript
{
  childId: string;
  monthlyFeeOverride?: number; // RON amount, null to use child default
  // ... other enrollment fields
}
```

**Response (201 Created):**
```typescript
{
  id: string;
  childId: string;
  monthlyFeeOverride: number | null; // cents
  effectiveFee: number; // resolved fee in cents
  effectiveFeeDisplay: string; // "1,250 RON"
  // ... other enrollment fields
}
```

### PATCH /api/admin/enrollments/[id] 
Update enrollment fee override.

**Request Body:**
```typescript
{
  monthlyFeeOverride?: number | null; // RON amount, null to use child default
  // ... other updatable enrollment fields
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  monthlyFeeOverride: number | null; // cents
  effectiveFee: number; // resolved fee in cents 
  effectiveFeeDisplay: string; // "1,250 RON"
  updatedAt: string;
  // ... other enrollment fields
}
```

## Fee Resolution Endpoints

### GET /api/admin/children/[id]/fee-details
Get detailed fee information for a child.

**Response (200 OK):**
```typescript
{
  childId: string;
  defaultFee: number; // cents
  defaultFeeDisplay: string; // "1,250 RON"
  enrollments: Array<{
    id: string;
    monthlyFeeOverride: number | null; // cents
    effectiveFee: number; // resolved fee in cents
    effectiveFeeDisplay: string; // "1,250 RON"
  }>;
}
```

### GET /api/admin/enrollments/[id]/effective-fee
Get the effective fee for a specific enrollment.

**Response (200 OK):**
```typescript
{
  enrollmentId: string;
  childDefaultFee: number; // cents
  enrollmentOverride: number | null; // cents
  effectiveFee: number; // resolved fee in cents
  effectiveFeeDisplay: string; // "1,250 RON"
  feeSource: "child_default" | "enrollment_override";
}
```

## Validation Schemas

### Child Fee Validation
```typescript
const createChildSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100), 
  dateOfBirth: z.string().datetime(),
  monthlyFee: z.number().min(0).max(10000).optional(), // 0-10000 RON
  // ... other fields
});
```

### Enrollment Fee Validation
```typescript
const createEnrollmentSchema = z.object({
  childId: z.string().uuid(),
  monthlyFeeOverride: z.number().min(0).max(10000).nullable().optional(),
  // ... other fields
});
```

## Error Response Format

All endpoints follow consistent error format:

```typescript
{
  error: string; // Error message
  code: string; // Error code (VALIDATION_ERROR, UNAUTHORIZED, etc.)
  details?: Array<{
    field: string;
    message: string;
  }>; // Field-specific validation errors
}
```

## Currency Handling

### Input Processing
- Accept RON amounts as numbers (e.g., 1250.50)
- Convert to cents for storage (multiply by 100)
- Validate range: 0 - 10,000 RON (0 - 1,000,000 cents)

### Output Processing  
- Return cents in `monthlyFee` field for exact values
- Include `monthlyFeeDisplay` for formatted display
- Format: "1,250 RON" (with thousand separators)

## Authentication & Authorization

### Required Headers
```
Authorization: Bearer <jwt-token>
Cookie: session=<session-cookie>
```

### Access Control
- All endpoints require Admin role
- Multi-tenant isolation by `schoolId`
- Rate limiting: 100 requests/minute per user

## Audit Logging

All fee-related operations generate access logs:

```typescript
{
  userId: number;
  teamId: number; // schoolId
  action: "CHILD_FEE_UPDATED" | "ENROLLMENT_FEE_UPDATED";
  target: "CHILD" | "ENROLLMENT";
  targetId: string;
  metadata: {
    previousFee?: number; // cents
    newFee?: number; // cents
    feeType: "default" | "override";
  };
}
```