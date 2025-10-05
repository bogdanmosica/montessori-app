# Data Model: Excel Import Feature

## Entities

### Teacher
- name: string (required)
- email: string (required, unique per tenant)
- role: enum (from constants)
- school: string (tenant scope)

### Parent
- name: string (required)
- email: string (required, unique per tenant)
- phone: string (optional)
- children_names: string[] (optional, for template reference)

### Child
- firstName: string (required)
- lastName: string (required)
- dob: date (required)
- parent_email: string (required, must match Parent)
- monthly_fee_RON: number (required)
- enrollment_status: enum (from constants)

## Relationships
- Child → Parent: Linked by parent_email (must match existing Parent email)
- Teacher, Parent, Child: All scoped by tenant (school)

## Validation Rules
- All required fields must be present
- Email fields must be valid and unique per tenant
- Dates must be valid and not in the future
- monthly_fee_RON must be a positive number
- enrollment_status must be a valid enum value
- parent_email for Child must match an existing Parent

## State Transitions
- Imported records: Pending → Validated → Confirmed (on admin review)
- Invalid rows: Remain in error state, logged for audit

---
