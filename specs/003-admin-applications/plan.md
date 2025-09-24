````markdown

# Implementation Plan: Admin Applications Management

**Branch**: `003-admin-applications` | **Date**: 2025-09-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-admin-applications/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Completed: Feature spec loaded and analyzed
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Completed: All technical details specified based on montessori-app stack
   → Set Structure Decision: Next.js application (Option 2)
3. Fill the Constitution Check section based on the content of the constitution document.
   → Completed: All constitutional requirements assessed
4. Evaluate Constitution Check section below
   → No violations detected in current approach
   → Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → Ready to execute research phase
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
7. Re-evaluate Constitution Check section
   → Will re-check after design phase
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement admin-only `/admin/applications` page for montessori-app that allows administrators to view, search, filter, approve, and reject school applications. Upon approval, the system creates parent user accounts, child records, and enrollment entries. The implementation follows Next.js 15 App Router patterns with server-side rendering, Drizzle ORM for database operations, and strict multi-tenant security controls.

## Technical Context
**Language/Version**: TypeScript (strict mode) with Next.js 15 App Router, React 19  
**Primary Dependencies**: Next.js, React, Drizzle ORM, Auth.js, shadcn/ui, Tailwind CSS  
**Storage**: PostgreSQL with multi-tenant scoping and audit logging  
**Testing**: Jest for unit tests, integration tests for API endpoints and database operations  
**Target Platform**: Web application (server-side rendered pages with selective client components)
**Project Type**: Next.js web application - determines source structure (Option 2)  
**Performance Goals**: Server-side render under 500ms TTFB, efficient pagination for large application lists  
**Constraints**: Admin-only access via middleware, atomic transactions for approval workflow, tenant-scoped queries  
**Scale/Scope**: Multi-tenant SaaS supporting hundreds of schools, thousands of applications per school

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Micro Function Gate
- [x] Functions must be small, composable, and focused on one responsibility
- [x] No single file should contain excessive unrelated logic
- [x] Route handlers and page components are kept minimal with logic extracted to separate files

### Client Directive Gate
- [x] `use client` must only appear in the **most child component** that truly requires it
- [x] Avoid marking entire routes/pages as client unless absolutely necessary
- [x] Server components are preferred for data fetching and initial rendering

### Component Reuse Gate
- [x] Before creating a new component, confirm one doesn't already exist in the scoped `components/` folder
- [x] Shared UI components should live in the global `ui/` library folder
- [x] shadcn/ui and Tailwind used consistently across all components

### Multi-Tenant Security Gate
- [x] All database queries are scoped by tenant (school/team)
- [x] RBAC enforcement is implemented at both middleware and route level
- [x] User actions are logged to `access_logs` with proper tenant isolation
- [x] Session management handles role changes appropriately

### Database Efficiency Gate
- [x] Only query the database when necessary
- [x] Avoid redundant queries; use caching or state management when possible
- [x] Drizzle ORM is used instead of raw SQL unless performance requires otherwise
- [x] Query performance is tested under realistic multi-tenant load

### No Hardcoding Gate
- [x] All configurable values use `const` or `enum` declarations
- [x] No hardcoded strings, roles, statuses, or business logic values in implementation
- [x] Configuration is externalized and environment-appropriate

### Specification-First Gate
- [x] Clear specifications exist before implementation begins
- [x] All features have documented requirements and acceptance criteria
- [x] Implementation follows approved specifications and design documents

## Project Structure

### Documentation (this feature)
```
specs/003-admin-applications/
├── spec.md                     # Feature specification
├── plan.md                     # This file (/plan command output)
├── research.md                 # Phase 0 output (/plan command)
├── data-model.md               # Phase 1 output (/plan command)
├── quickstart.md               # Phase 1 output (/plan command)
├── contracts/                  # Phase 1 output (/plan command)
│   ├── api-applications.md     # GET /api/applications contract
│   ├── api-enrollment.md       # POST /api/admin/enrollment contract
│   ├── api-children.md         # POST /api/children contract
│   └── api-users.md           # POST /api/users contract
└── tasks.md                   # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Next.js application structure (Option 2)
app/
├── admin/
│   ├── applications/
│   │   ├── components/              # Scoped components for applications
│   │   │   ├── ApplicationsTable.tsx
│   │   │   ├── ApplicationActions.tsx
│   │   │   ├── AddChildForm.tsx
│   │   │   └── AddParentForm.tsx
│   │   ├── constants.ts             # Application statuses, roles, validation
│   │   ├── server/
│   │   │   └── applications.ts      # Server functions for data fetching
│   │   └── page.tsx                 # Main applications page (thin composition)
│   └── dashboard/                   # Existing dashboard
├── api/
│   ├── applications/
│   │   └── route.ts                 # GET /api/applications endpoint
│   ├── admin/
│   │   └── enrollment/
│   │       └── route.ts             # POST /api/admin/enrollment endpoint
│   ├── children/
│   │   └── route.ts                 # POST /api/children endpoint
│   └── users/
│       └── route.ts                 # POST /api/users endpoint (extend existing)
├── globals.css
└── layout.tsx

components/
├── ui/                             # Shared shadcn/ui components
│   ├── button.tsx
│   ├── table.tsx
│   ├── form.tsx
│   └── ...
└── ...

lib/
├── auth/                           # Existing auth utilities
├── db/
│   ├── schema/                     # Drizzle schema definitions
│   │   ├── applications.ts         # Applications table schema
│   │   ├── children.ts             # Children table schema (extend existing)
│   │   ├── users.ts                # Users table schema (extend existing)
│   │   └── enrollments.ts          # Enrollments table schema
│   └── queries/
│       └── applications.ts         # Application-specific queries
├── types/
│   └── applications.ts             # Application-related TypeScript types
└── utils/
```

**Structure Decision**: Next.js application (Option 2) - matches existing montessori-app architecture

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Database schema requirements for applications table
   - Integration patterns with existing auth middleware
   - Best practices for atomic transactions in approval workflow
   - Performance optimization for paginated table queries

2. **Generate and dispatch research agents**:
   ```
   Task: "Research multi-step approval workflow patterns with database atomicity"
   Task: "Find best practices for server-side pagination with Drizzle ORM"
   Task: "Research Next.js App Router patterns for admin-scoped routes"
   Task: "Find shadcn/ui table component patterns with filtering and sorting"
   ```

3. **Consolidate findings** in `applications-research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all technical decisions and patterns documented

## Phase 1: Design & Contracts
*Prerequisites: applications-research.md complete*

1. **Extract entities from feature spec** → `applications-data-model.md`:
   - Application (parent info, child info, program, status, timestamps)
   - Parent User Account (extends users table with Parent role)
   - Child Record (extends children table with parent relationship)
   - Enrollment (links parent, child, and program)
   - Application Status enum and transitions

2. **Generate API contracts** from functional requirements:
   - GET /api/applications (list, search, filter, paginate)
   - POST /api/admin/enrollment (approve/reject workflow)
   - POST /api/children (create child record)
   - POST /api/users (create parent account)
   - Output OpenAPI specs to `/contracts/`

3. **Generate contract tests** from contracts:
   - Test files for each API endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Application table rendering and filtering
   - Approval workflow with parent/child creation
   - Rejection workflow with status update
   - Search and pagination functionality

5. **Update CLAUDE.md incrementally**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - Add applications page context to existing admin dashboard context
   - Preserve manual additions between markers
   - Keep under 150 lines for token efficiency

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Database schema tasks → applications table, extend users/children tables [P]
- API contract tests → one task per endpoint [P]
- Component creation tasks → ApplicationsTable, ApplicationActions, forms [P]
- Server function tasks → applications.ts server functions [P]
- Integration tasks → approval workflow, middleware protection
- End-to-end validation tasks → quickstart scenario execution

**Ordering Strategy**:
- TDD order: Schema and contract tests before implementation
- Dependency order: Database → API → Components → Pages
- Mark [P] for parallel execution (independent files)
- Critical path: Applications table → API endpoints → Table component → Page

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No constitutional violations detected. All requirements align with Monte SMS principles:
- Micro functions: Components and server functions are small and focused
- Client boundaries: Server-first rendering with minimal client components
- Multi-tenant security: All queries scoped by school/team
- No hardcoding: All statuses and roles use enums/constants
- Database efficiency: Optimized queries with proper indexing

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Monte SMS Constitution v1.0.0 - See `.specify/memory/constitution.md`*

````