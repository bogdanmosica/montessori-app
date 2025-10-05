# Research: Excel Import Feature for Montessori App

## Decision Log

### 1. Excel File Format Support
- **Decision**: Only support Excel file formats (.xlsx, .xls); CSV uploads are not accepted.
- **Rationale**: Ensures consistent template structure and validation; avoids ambiguity in CSV parsing and encoding issues.
- **Alternatives considered**: Supporting CSV uploads; rejected due to risk of inconsistent formatting and increased error handling complexity.

### 2. Duplicate Handling
- **Decision**: Skip existing user/child records and import only new ones.
- **Rationale**: Prevents accidental overwrites and duplicate entries; maintains data integrity.
- **Alternatives considered**: Update existing records, warn admin, or allow duplicates; rejected for simplicity and safety.

### 3. Linking Children to Parents
- **Decision**: Automatically link imported Children to existing Parents if the parent email matches.
- **Rationale**: Reduces manual effort for admins; leverages unique parent email as a reliable identifier.
- **Alternatives considered**: Manual linking, admin confirmation; rejected for efficiency and user experience.

### 4. Failed Import Logging
- **Decision**: Log all failed imports (rows with errors) for audit and troubleshooting purposes.
- **Rationale**: Provides traceability and supports error resolution; meets audit requirements.
- **Alternatives considered**: No logging, or logging only on request; rejected for compliance and support needs.

### 5. RBAC and Multi-Tenant Security
- **Decision**: Restrict import feature to Admins only; enforce strict RBAC and tenant scoping.
- **Rationale**: Protects sensitive data and ensures only authorized users can perform bulk imports.
- **Alternatives considered**: Allowing Teachers/Parents to import; rejected for security and data isolation.

### 6. Micro Functions & File Organization
- **Decision**: Use micro functions and small files; components under `app/admin/import/components/`.
- **Rationale**: Improves maintainability and testability; aligns with constitution.
- **Alternatives considered**: Larger files, monolithic components; rejected for maintainability.

## Best Practices
- Use Drizzle ORM for all DB operations; avoid raw SQL unless necessary.
- Use enums/consts for roles, statuses, and error messages.
- Use shadcn/ui and Tailwind for UI consistency.
- Log all actions to `access_logs` for audit compliance.
- Validate all file uploads server-side; provide clear error feedback.

## Patterns
- Server-side file parsing and validation for security and performance.
- Batch DB inserts for efficiency; skip invalid rows.
- Use RBAC middleware and route protection for `/admin/import`.
- Modularize import logic by entity type (Teachers, Parents, Children).

## Unknowns (Resolved)
- All critical clarifications resolved in spec.

---
