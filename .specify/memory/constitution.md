<!--
SYNC IMPACT REPORT - Version 1.0.0 (2025-09-24)

Version Change: Initial creation → 1.0.0
Rationale: First constitution for Monte SMS with comprehensive principles

New Principles Added:
- I. Micro Functions & Simplicity (NON-NEGOTIABLE)
- II. Client-Server Boundaries  
- III. Component Reusability & Organization
- IV. Multi-Tenant Security & RBAC (NON-NEGOTIABLE)
- V. Database Efficiency & Performance
- VI. No Hardcoding & Constants Management
- VII. Specification-First Development

New Sections Added:
- Phase Gates & Quality Assurance (7 validation gates)
- Technology Stack Requirements
- Governance procedures

Templates Updated:
✅ .specify/templates/plan-template.md - Updated constitution checks, project structure for Next.js
✅ .specify/templates/tasks-template.md - Updated for Next.js/TypeScript patterns, multi-tenant testing
⚠ .specify/templates/spec-template.md - No changes needed (business-focused template)
⚠ .specify/templates/agent-file-template.md - Not reviewed (out of scope)

Follow-up TODOs:
- None - All placeholders filled with concrete values

Commit Message: "docs: create Monte SMS constitution v1.0.0 (Montessori SaaS principles + Next.js gates)"
-->

# Monte SMS Constitution
<!-- Montessori School Management SaaS Platform -->

## Core Principles

### I. Micro Functions & Simplicity (NON-NEGOTIABLE)
Always prefer **micro functions** over large ones — keep functions small, composable, and single-purpose.
Avoid large files. Split code into **small, focused files**, especially in route/page files.
Use framework features directly (Next.js, React, Drizzle ORM) — avoid unnecessary abstractions.
**Rationale**: Simplicity enables maintainability, testability, and reduces cognitive load for developers working with Montessori school management complexity.

### II. Client-Server Boundaries
Use the `use client` directive **only when required**, and only on the most child component that actually needs it.
Prefer server components by default to reduce bundle size and improve performance.
**Rationale**: Server-first architecture reduces JavaScript bundle size and improves initial page load times, critical for school administrators accessing the system throughout the day.

### III. Component Reusability & Organization
Use `components/` folder scoped under each page folder. Before creating a new component, check if one already exists.
All reusable UI must live in a **shared `ui/` library folder**, not duplicated in pages.
Use shadcn/ui components + Tailwind consistently for cohesive user experience.
**Rationale**: Prevents code duplication and ensures consistent UI patterns across different school management workflows.

### IV. Multi-Tenant Security & RBAC (NON-NEGOTIABLE)
Enforce **strict RBAC** (Admins, Teachers, Parents) at middleware and route level.
Ensure queries and metrics are always **multi-tenant scoped** by school/team.
Automatically invalidate sessions on role change.
All actions must be logged in `access_logs` for audit compliance.
**Rationale**: Schools handle sensitive student data and require strict access controls. Multi-tenancy ensures data isolation between different school clients.

### V. Database Efficiency & Performance
Use the database **only when needed** — avoid unnecessary queries.
Use Drizzle ORM directly instead of writing raw SQL (unless absolutely necessary for performance).
Cache or reuse queries where possible instead of duplicating work.
Always scope queries by tenant (school/team) for security and performance.
**Rationale**: Educational institutions require responsive systems with many concurrent users during peak hours (enrollment, grade entry periods).

### VI. No Hardcoding & Constants Management
Never hardcode strings or values in implementation code.
Always use `const` or `enum` for values that could repeat or change (e.g., student statuses, grade levels, user roles, error messages).
**Rationale**: Educational systems have many configurable elements (grade structures, roles, policies) that vary by institution and change over time.

### VII. Specification-First Development
**Spec-first**: specifications and plans drive code implementation, not ad-hoc development.
All features must have clear specifications before implementation begins.
Use phase gates to validate compliance with architectural principles.
**Rationale**: Educational software requires careful planning due to regulatory compliance, data privacy requirements, and complex stakeholder needs.

## Phase Gates & Quality Assurance

All development work must pass through the following validation gates before completion:

**Micro Function Gate**
- [ ] Functions must be small, composable, and focused on one responsibility
- [ ] No single file should contain excessive unrelated logic
- [ ] Route handlers and page components are kept minimal with logic extracted to separate files

**Client Directive Gate**
- [ ] `use client` must only appear in the **most child component** that truly requires it
- [ ] Avoid marking entire routes/pages as client unless absolutely necessary
- [ ] Server components are preferred for data fetching and initial rendering

**Component Reuse Gate**
- [ ] Before creating a new component, confirm one doesn't already exist in the scoped `components/` folder
- [ ] Shared UI components should live in the global `ui/` library folder
- [ ] shadcn/ui and Tailwind used consistently across all components

**Multi-Tenant Security Gate**
- [ ] All database queries are scoped by tenant (school/team)
- [ ] RBAC enforcement is implemented at both middleware and route level
- [ ] User actions are logged to `access_logs` with proper tenant isolation
- [ ] Session management handles role changes appropriately

**Database Efficiency Gate**
- [ ] Only query the database when necessary
- [ ] Avoid redundant queries; use caching or state management when possible
- [ ] Drizzle ORM is used instead of raw SQL unless performance requires otherwise
- [ ] Query performance is tested under realistic multi-tenant load

**No Hardcoding Gate**
- [ ] All configurable values use `const` or `enum` declarations
- [ ] No hardcoded strings, roles, statuses, or business logic values in implementation
- [ ] Configuration is externalized and environment-appropriate

## Technology Stack Requirements

**Core Framework**: Next.js 15 (App Router) with React 19 and TypeScript (strict mode)
**Database**: PostgreSQL with Drizzle ORM for type-safe database operations
**Authentication**: Auth.js for JWT-based authentication with RBAC support
**UI Framework**: shadcn/ui components with Tailwind CSS for consistent design system
**Payment Processing**: Stripe integration for subscription management
**Development Standards**: ESLint, Prettier, and strict TypeScript configuration

## Governance

This constitution supersedes all other development practices and guidelines for Monte SMS.
All pull requests and code reviews must verify compliance with these principles.
Complexity and deviations must be explicitly justified and documented.

**Amendment Process**: Changes to this constitution require:
1. Documented rationale for the amendment
2. Impact assessment on existing codebase
3. Approval from technical leadership
4. Migration plan for bringing existing code into compliance

**Compliance Review**: Regular audits must verify adherence to:
- Multi-tenant data isolation
- RBAC implementation consistency
- Component reusability patterns
- Database query optimization
- Security logging completeness

**Version**: 1.0.0 | **Ratified**: 2025-09-24 | **Last Amended**: 2025-09-24