# Research: Admin Dashboard Controls & Settings

**Feature**: Admin Dashboard Refresh & Settings  
**Date**: September 30, 2025  
**Context**: Extending existing `/admin/dashboard` with interactive controls

## Research Tasks Completed

### 1. Next.js App Router Patterns for Dashboard Extensions

**Decision**: Use App Router with server components for dashboard layout, client components only for interactive elements  
**Rationale**: Leverages Next.js 15 server-first architecture, reduces JavaScript bundle size, improves initial load performance  
**Alternatives considered**: 
- Full client-side dashboard - rejected due to SEO and performance concerns
- Pages Router - rejected as project uses App Router consistently

### 2. Multi-Tenant Settings Storage Strategy

**Decision**: Extend existing `schools` table with settings columns (default_monthly_fee_ron, free_enrollment_count)  
**Rationale**: Leverages existing multi-tenant infrastructure, maintains data consistency, avoids additional joins  
**Alternatives considered**:
- Separate `school_settings` table - rejected to avoid over-normalization for simple key-value pairs
- JSON column - rejected due to type safety and query complexity concerns

### 3. Real-time Dashboard Refresh Patterns

**Decision**: Client-side fetch with React state management, manual refresh trigger  
**Rationale**: Simple implementation, user-controlled updates, maintains server component benefits  
**Alternatives considered**:
- WebSocket real-time updates - rejected as overkill for manual admin control
- Server-sent events - rejected due to complexity for simple refresh use case
- Automatic polling - rejected to preserve user control and reduce server load

### 4. RBAC Enforcement for New Routes

**Decision**: Reuse existing middleware pattern with Admin role checks, extend to `/admin/dashboard/settings`  
**Rationale**: Consistent with existing admin routes, centralized security logic, maintains audit trail  
**Alternatives considered**:
- Route-level auth checks - rejected to avoid duplicating security logic
- Component-level guards - rejected as insufficient for route protection

### 5. Form Validation and Error Handling

**Decision**: Zod schema validation with React Hook Form, server-side validation in API routes  
**Rationale**: Type-safe validation, consistent with existing patterns, client+server validation layers  
**Alternatives considered**:
- Client-only validation - rejected due to security concerns
- Custom validation logic - rejected to maintain consistency with existing forms

### 6. Database Schema Migration Strategy

**Decision**: Add columns to existing `schools` table with nullable defaults  
**Rationale**: Non-breaking change, backwards compatible, simple migration path  
**Alternatives considered**:
- Separate migration with required fields - rejected to avoid deployment complexity
- Default values in application code - rejected to maintain data integrity

## Clarifications Resolved

### Default Fee Fallback Behavior
**Research Finding**: Industry standard is to use 0 RON as fallback for unset fees  
**Decision**: Default to 0 RON when Admin hasn't set default fee  
**Implementation**: Database column with default value 0, validation allows 0 as valid fee

### Free Enrollment Scope  
**Research Finding**: School-wide quotas are more common than classroom-specific in SaaS platforms  
**Decision**: Free enrollments are school-wide, not per-classroom  
**Implementation**: Single integer column on schools table, enforced in enrollment creation logic

### Concurrent Settings Updates
**Research Finding**: Last-write-wins with timestamp tracking is standard for admin settings  
**Decision**: Allow concurrent edits, last save wins, no optimistic locking  
**Implementation**: Standard UPDATE query with updated_at timestamp

### Settings Change Auditing
**Research Finding**: Educational software typically requires audit trails for administrative changes  
**Decision**: No audit logging required for settings changes (per clarification session)  
**Implementation**: Settings changes will not be logged to access_logs table

## Technical Dependencies Confirmed

### Existing Infrastructure to Leverage
- Auth.js middleware for Admin role checking
- Drizzle ORM with PostgreSQL for data persistence  
- shadcn/ui components (Button, Input, Form, Card)
- Existing `/api/admin/metrics` endpoint for dashboard data
- Multi-tenant scoping patterns in existing admin routes
- Access logging infrastructure for audit compliance

### New Dependencies Required
- React Hook Form for settings form management
- Zod schemas for validation (consistent with existing forms)
- Toast notifications for user feedback (existing hook available)

## Performance Considerations

### Dashboard Refresh Performance
- Target: <200ms for metrics refresh
- Strategy: Optimize existing `/api/admin/metrics` endpoint
- Caching: React state management to prevent redundant requests

### Settings Page Performance  
- Target: <100ms initial load, <200ms save operation
- Strategy: Server component for initial load, client form for interactions
- Database: Index on school_id for efficient settings retrieval

## Security Architecture

### Route Protection
- Middleware: Extend existing admin route protection to `/admin/dashboard/settings`
- API Routes: Admin role verification in settings endpoints
- Data Scoping: All queries filtered by user's school_id

### Input Validation
- Client: Zod schemas for immediate feedback
- Server: Duplicate validation in API routes for security
- Sanitization: Built-in with Drizzle ORM prepared statements

## Implementation Readiness

All research tasks completed with concrete decisions made. No remaining unknowns or technical blockers identified. Ready to proceed to Phase 1 design.