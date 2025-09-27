# Research: Admin Enrollments Management

**Date**: September 27, 2025  
**Feature**: Admin Enrollments Management  
**Context**: Next.js 15 + React 19 + TypeScript + Drizzle ORM + PostgreSQL

## Technical Decisions

### Database Schema Design
**Decision**: Use foreign key relationships between `enrollments` and `children` tables with status-based soft deletion
**Rationale**: 
- Maintains data integrity while allowing enrollment lifecycle management
- Status-based approach preserves historical data for compliance and reporting
- Foreign key constraints prevent orphaned enrollments
**Alternatives considered**: 
- Hard deletion: Rejected due to data loss concerns and audit requirements
- Junction table: Rejected as enrollment has its own attributes and lifecycle

### Multi-Tenant Scoping Strategy
**Decision**: Implement tenant scoping at database query level using school/team identifiers
**Rationale**:
- Ensures data isolation between schools in SaaS deployment
- Leverages existing authentication and session management
- Allows efficient queries with proper indexing
**Alternatives considered**:
- Schema-per-tenant: Rejected due to operational complexity
- Application-level filtering: Already implemented, extending pattern

### Enrollment Status Management
**Decision**: Use TypeScript enums exported from constants file with database enum type
**Rationale**:
- Type safety at compile time and runtime
- Prevents hardcoded strings throughout codebase
- Database constraints ensure data consistency
**Alternatives considered**:
- String literals: Rejected due to maintenance and type safety issues
- Configuration table: Rejected as statuses are core business logic, not configuration

### API Design Pattern
**Decision**: RESTful API with standard HTTP methods following existing montessori-app patterns
**Rationale**:
- Consistency with existing codebase
- Clear semantic meaning for CRUD operations
- Easy to test and document
**Alternatives considered**:
- GraphQL: Rejected due to complexity for simple CRUD operations
- RPC-style: Rejected due to inconsistency with existing patterns

### Component Architecture
**Decision**: Scoped components under `/admin/enrollments/components/` with minimal client-side JavaScript
**Rationale**:
- Follows montessori-app constitutional requirements
- Server-first approach for better performance
- Clear separation of concerns
**Alternatives considered**:
- Global components: Rejected due to domain-specific logic
- Client-heavy SPA: Rejected due to constitutional server-first principle

### Performance Optimization
**Decision**: Use Drizzle ORM joins to fetch enrollment and child data in single queries
**Rationale**:
- Prevents N+1 query problems
- Leverages database optimization
- Maintains type safety with ORM
**Alternatives considered**:
- Separate queries: Rejected due to performance concerns
- Raw SQL: Rejected unless performance requires it per constitution

## Integration Patterns

### Authentication Integration
**Pattern**: Leverage existing Auth.js middleware for admin role enforcement
**Implementation**: Check session role at both page and API route levels
**Validation**: Ensure session invalidation works with existing system

### Database Integration
**Pattern**: Extend existing Drizzle schema with enrollment and child relationship
**Implementation**: Add enrollment table with foreign key to children, status enum
**Validation**: Ensure migrations work with existing multi-tenant setup

### UI Integration
**Pattern**: Use existing shadcn/ui components with montessori-app design tokens
**Implementation**: Reuse table, form, and button components from existing pages
**Validation**: Ensure consistent styling with existing admin pages

## Risk Mitigation

### Data Consistency
**Risk**: Enrollment and child data becoming out of sync
**Mitigation**: Use database transactions for enrollment operations that affect child records
**Validation**: Test concurrent access scenarios

### Performance
**Risk**: Slow queries with large datasets
**Mitigation**: Implement pagination, proper indexing on tenant + status columns
**Validation**: Load testing with realistic data volumes

### Security
**Risk**: Cross-tenant data access
**Mitigation**: Double-check tenant scoping in all queries, add integration tests
**Validation**: Automated tests verify tenant isolation

## Dependencies Confirmed

### Existing Infrastructure
- Auth.js session management ✓
- Drizzle ORM setup ✓  
- PostgreSQL database ✓
- shadcn/ui components ✓
- Tailwind CSS configuration ✓

### New Requirements
- Enrollment status enum definition
- Database migration for enrollments table
- API route handlers for CRUD operations
- UI components for enrollment management
- Integration tests for tenant scoping