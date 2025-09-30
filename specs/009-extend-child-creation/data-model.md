# Data Model: Child Fee Management

## Entity Definitions

### Child Default Fee
Represents the default monthly fee associated with a child record.

**Storage**: `children.monthlyFee` (existing field)
- **Type**: `integer` (cents)
- **Constraints**: `>= 0` (non-negative values only)
- **Default**: `0` (free enrollment)
- **Currency**: RON (Romanian Leu)
- **Display**: Convert cents to RON for UI (`monthlyFee / 100`)

### Enrollment Fee Override  
Represents enrollment-specific fee that overrides child's default fee.

**Storage**: New field `enrollments.monthlyFeeOverride`
- **Type**: `integer | null` (cents, nullable)
- **Constraints**: `>= 0` when not null
- **Default**: `null` (use child's default fee)
- **Currency**: RON (Romanian Leu)
- **Display**: Convert cents to RON, fallback to child fee if null

### Currency Standard
Centralized currency definitions and formatting.

**Storage**: Constants in code (`/lib/constants/currency.ts`)
- **Supported**: `['RON']` (Romanian Leu only)
- **Display Format**: `"1,250 RON"` (with thousand separators)
- **Input Format**: Numeric input, converted to cents for storage

## Entity Relationships

```
children (1) ←→ (0..n) enrollments
├── monthlyFee: integer (child default fee in cents)
└── enrollments[].monthlyFeeOverride: integer|null (override fee in cents)

parentChildRelationships (n) → (1) children
applications (0..1) ← (1) children (via applicationId)
```

## Validation Rules

### Child Default Fee Validation
```typescript
const childFeeSchema = z.object({
  monthlyFee: z.number()
    .min(0, "Fee cannot be negative")
    .max(1000000, "Fee cannot exceed 10,000 RON") // 1M cents = 10K RON
    .optional()
    .default(0)
});
```

### Enrollment Override Fee Validation  
```typescript
const enrollmentFeeSchema = z.object({
  monthlyFeeOverride: z.number()
    .min(0, "Fee cannot be negative") 
    .max(1000000, "Fee cannot exceed 10,000 RON")
    .nullable()
    .optional()
});
```

### Currency Conversion
```typescript
// Cents to RON display
const formatFee = (cents: number): string => {
  const ron = cents / 100;
  return `${ron.toLocaleString('ro-RO')} RON`;
};

// RON input to cents storage
const parseFee = (ronAmount: string): number => {
  const cleaned = ronAmount.replace(/[^\d.,]/g, '');
  const ron = parseFloat(cleaned.replace(',', '.'));
  return Math.round(ron * 100);
};
```

## State Transitions

### Child Fee States
- **Unset** (0 cents): `"No fee set"` or `"Free enrollment"`
- **Set** (>0 cents): `"{amount} RON"` display

### Enrollment Fee Resolution
1. **Check enrollment override**: If `monthlyFeeOverride` is not null, use override
2. **Fallback to child default**: If override is null, use `children.monthlyFee`
3. **Display logic**: Show resolved amount without indicating source (per clarifications)

## Database Schema Changes

### Required Migration
```sql
-- Add monthlyFeeOverride to enrollments table
ALTER TABLE enrollments 
ADD COLUMN monthly_fee_override INTEGER 
CHECK (monthly_fee_override >= 0);

-- Add comment for clarity
COMMENT ON COLUMN enrollments.monthly_fee_override IS 'Override fee in cents, null means use child default fee';
```

### Existing Schema Leveraged
- `children.monthlyFee` already exists (integer, cents)
- Multi-tenant scoping via `schoolId` in both tables
- Audit fields (`createdAt`, `updatedAt`) already present
- RBAC enforcement through existing middleware

## Query Patterns

### Fee Resolution Query
```typescript
// Get effective fee for enrollment
const getEnrollmentFee = async (enrollmentId: string) => {
  const result = await db
    .select({
      childFee: children.monthlyFee,
      enrollmentFeeOverride: enrollments.monthlyFeeOverride
    })
    .from(enrollments)
    .innerJoin(children, eq(enrollments.childId, children.id))
    .where(eq(enrollments.id, enrollmentId))
    .limit(1);
    
  const { childFee, enrollmentFeeOverride } = result[0];
  return enrollmentFeeOverride ?? childFee;
};
```

### Multi-tenant Fee Queries
```typescript
// Get all children with fees for a school
const getChildrenWithFees = async (schoolId: number) => {
  return await db
    .select()
    .from(children)
    .where(eq(children.schoolId, schoolId));
};
```

## Performance Considerations

### Indexing Strategy
- Existing indexes on `schoolId` sufficient for multi-tenant queries
- No additional indexes needed for fee fields (not frequently queried independently)
- Compound queries use existing relationships and indexes

### Caching Approach  
- Currency formatting can be cached at component level
- Fee resolution logic is simple enough to execute per request
- No need for Redis caching due to low complexity

## Data Integrity

### Constraints
- Database-level: `CHECK (monthly_fee >= 0)` and `CHECK (monthly_fee_override >= 0)`
- Application-level: Zod validation schemas
- Business-level: Admin-only modification access

### Audit Trail
- Leverage existing `createdAt`/`updatedAt` timestamps
- Use existing access logging for fee modifications
- No separate fee history table needed initially

## Migration Strategy

### Backward Compatibility
- Existing children records: `monthlyFee` defaults to 0 (graceful)
- Existing enrollments: New `monthlyFeeOverride` field is nullable (safe)
- UI displays: Handle null/zero values appropriately

### Rollback Plan
- New column is nullable and has no dependencies
- Can be dropped safely if needed
- Existing fee data in children table unaffected