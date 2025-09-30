# Research: Child Fee Creation Feature

## Technology Decisions

### Currency Handling in RON
**Decision**: Store fees in cents (integer) in database, display with "RON" suffix  
**Rationale**: Avoids floating-point precision issues, consistent with existing schema (`monthlyFee: integer`), standard practice in financial applications  
**Alternatives considered**: 
- Decimal type: More complex, overkill for RON amounts
- Floating point: Precision issues with currency calculations
- String storage: Loss of numeric operations, complex validation

### Form Validation Strategy  
**Decision**: Client-side validation with Zod + React Hook Form, server-side validation in API routes  
**Rationale**: Immediate user feedback, type safety, reusable validation schemas, security through server validation  
**Alternatives considered**:
- Client-only: Security vulnerability  
- Server-only: Poor user experience
- Custom validation: Reinventing wheel, less type safety

### Database Schema Approach
**Decision**: Utilize existing `children.monthlyFee` field for child default fees, add `enrollments.monthlyFeeOverride` for enrollment-specific fees  
**Rationale**: Hybrid model from clarifications, leverages existing infrastructure, minimal migration impact  
**Alternatives considered**:
- Separate fee table: Over-engineering for simple fee storage
- Only child fees: Doesn't support enrollment overrides
- Only enrollment fees: Doesn't support child defaults

### Component Architecture
**Decision**: Create scoped form components under `/app/admin/enrollments/components/` and `/app/admin/applications/components/`  
**Rationale**: Follows Next.js App Router patterns, component colocation, constitutional requirements  
**Alternatives considered**:
- Global components: Would violate component scoping principles
- Inline form logic: Would violate micro-function principles
- Third-party form builder: Unnecessary complexity

### Currency Constants Management
**Decision**: Create centralized currency enums in `/lib/constants/currency.ts`  
**Rationale**: No hardcoding constitutional requirement, reusability, type safety  
**Alternatives considered**:
- Environment variables: Overkill for static currency list
- Hardcoded strings: Violates constitution
- Database configuration: Unnecessary complexity

### Edit Capability Implementation
**Decision**: Reuse existing child/enrollment edit forms with fee field updates  
**Rationale**: Code reuse, consistent UI patterns, minimal new component creation  
**Alternatives considered**:
- Separate fee-only edit: Fragment user experience
- Inline editing: Complex state management
- Modal editing: Inconsistent with existing patterns

## Best Practices Integration

### Next.js App Router Patterns
- Server components by default for data fetching
- Client components only for form interactions (`use client` on form components)
- Route handlers for API endpoints following RESTful conventions
- Proper error boundaries and loading states

### Drizzle ORM Usage
- Type-safe queries with schema inference
- Transaction usage for atomic operations (child + enrollment creation)
- Proper relationship handling between children/enrollments
- Multi-tenant query scoping with `schoolId`

### Form Handling Excellence  
- React Hook Form for performance (minimal re-renders)
- Zod schemas for validation and type inference
- Error state management with proper user feedback
- Optimistic updates for better perceived performance

### Security Implementation
- Admin role validation in middleware (already exists)
- CSRF protection through SameSite cookies
- Input sanitization through Zod validation
- Access logging for audit trails (constitutional requirement)

## Integration Patterns

### Existing Admin Dashboard Integration
- Reuse existing admin layout and navigation
- Follow established design tokens and component patterns  
- Integrate with existing RBAC and session management
- Maintain consistent error handling and user feedback

### Database Integration Approach
- Extend existing child creation services
- Add fee validation helpers
- Implement enrollment fee override logic
- Maintain existing audit logging patterns

### UI/UX Consistency
- Use existing shadcn/ui components (Input, Label, Button, etc.)
- Follow established form layouts and validation displays
- Maintain responsive design patterns
- Implement proper loading and error states

## Risk Mitigation

### Data Integrity
- Database constraints on fee amounts (non-negative)
- Transaction usage for multi-table operations
- Proper validation at both client and server levels
- Migration scripts for any schema changes

### Performance Considerations  
- Minimal additional queries (leverage existing data flows)
- Proper indexing on fee-related queries
- Caching strategies for currency formatting
- Optimized form rendering (React Hook Form)

### Backward Compatibility
- Graceful handling of existing children with null fees
- Non-breaking API changes
- Progressive enhancement approach
- Fallback displays for missing fee data

## Technology Stack Validation

All selected technologies align with existing project dependencies:
- ✅ Next.js 15 App Router (existing)
- ✅ React 19 (existing)  
- ✅ TypeScript 5.8.3 (existing)
- ✅ Drizzle ORM + PostgreSQL (existing)
- ✅ shadcn/ui + Tailwind (existing)
- ✅ Zod validation (existing)
- ✅ React Hook Form (existing)
- ✅ Jest testing framework (existing)

No new major dependencies required - pure feature extension using established patterns.