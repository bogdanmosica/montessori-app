
# Implementation Plan: Admin Applications Management

**Branch**: `003-admin-applications` | **Date**: 2025-09-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `D:\Projects\montessori-app\specs\003-admin-applications\spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ COMPLETED: Feature spec loaded from D:\Projects\montessori-app\specs\003-admin-applications\spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ COMPLETED: All technical details specified based on clarifications and montessori-app stack
   → ✅ COMPLETED: Set Structure Decision: Next.js application (Option 2)
3. Fill the Constitution Check section based on the content of the constitution document.
   → ✅ COMPLETED: All constitutional requirements assessed and documented
4. Evaluate Constitution Check section below
   → ✅ COMPLETED: No violations detected in current approach
   → ✅ COMPLETED: Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → ✅ COMPLETED: research.md exists with technical decisions and patterns
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ COMPLETED: All Phase 1 artifacts generated
7. Re-evaluate Constitution Check section
   → ✅ COMPLETED: No new violations detected after design phase
   → ✅ COMPLETED: Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → ✅ COMPLETED: Task generation approach documented below
9. STOP - Ready for /tasks command
   → ✅ COMPLETED: Ready for next phase
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement admin-only `/admin/applications` page for montessori-app that allows administrators to view, search, filter, approve, and reject school applications with low concurrency (1-3 admins per school). Upon approval, the system creates parent user accounts (with user-defined passwords), child records, and enrollment entries atomically. The implementation follows Next.js 15 App Router patterns with server-side rendering under 2-second page load targets, multi-tenant security controls, and basic audit logging.

## Technical Context
**Language/Version**: TypeScript (strict mode) with Next.js 15 App Router, React 19  
**Primary Dependencies**: Next.js, React, Drizzle ORM, Auth.js, shadcn/ui, Tailwind CSS  
**Storage**: PostgreSQL with multi-tenant scoping, basic audit logging  
**Testing**: Jest for unit tests, integration tests for API endpoints and database operations  
**Target Platform**: Web application (server-side rendered pages with selective client components)
**Project Type**: web - Next.js frontend+backend application  
**Performance Goals**: Under 2-second page load, low concurrency optimization (1-3 admins per school)  
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
- [ ] No single file should contain excessive unrelated logic
- [ ] Route handlers and page components are kept minimal with logic extracted to separate files

### Client Directive Gate
- [ ] `use client` must only appear in the **most child component** that truly requires it
- [ ] Avoid marking entire routes/pages as client unless absolutely necessary
- [ ] Server components are preferred for data fetching and initial rendering

### Component Reuse Gate
- [ ] Before creating a new component, confirm one doesn't already exist in the scoped `components/` folder
- [ ] Shared UI components should live in the global `ui/` library folder
- [ ] shadcn/ui and Tailwind used consistently across all components

### Multi-Tenant Security Gate
- [ ] All database queries are scoped by tenant (school/team)
- [ ] RBAC enforcement is implemented at both middleware and route level
- [ ] User actions are logged to `access_logs` with proper tenant isolation
- [ ] Session management handles role changes appropriately

### Database Efficiency Gate
- [ ] Only query the database when necessary
- [ ] Avoid redundant queries; use caching or state management when possible
- [ ] Drizzle ORM is used instead of raw SQL unless performance requires otherwise
- [ ] Query performance is tested under realistic multi-tenant load

### No Hardcoding Gate
- [ ] All configurable values use `const` or `enum` declarations
- [ ] No hardcoded strings, roles, statuses, or business logic values in implementation
- [ ] Configuration is externalized and environment-appropriate

### Specification-First Gate
- [ ] Clear specifications exist before implementation begins
- [ ] All features have documented requirements and acceptance criteria
- [ ] Implementation follows approved specifications and design documents

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Next.js application (when Next.js/React detected)
app/
├── (dashboard)/
│   ├── components/          # Scoped components for dashboard
│   ├── layout.tsx
│   └── page.tsx
├── (auth)/
│   ├── components/          # Scoped components for auth
│   ├── sign-in/
│   └── sign-up/
├── api/
│   ├── auth/
│   ├── users/
│   └── schools/
├── globals.css
└── layout.tsx

components/
├── ui/                     # Shared shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
└── ...

lib/
├── auth/
├── db/
└── utils/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Next.js application (Option 2) - matches existing montessori-app architecture and web project type

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Database schema tasks → applications table, extend users/children tables [P]
- API contract tests → one task per endpoint [P]
- Component creation tasks → ApplicationsTable, ApplicationActions, forms [P]
- Server function tasks → applications.ts server functions [P]
- Integration tasks → approval workflow, middleware protection, concurrent processing locks
- End-to-end validation tasks → quickstart scenario execution

**Ordering Strategy**:
- TDD order: Schema and contract tests before implementation
- Dependency order: Database → API → Components → Pages
- Mark [P] for parallel execution (independent files)
- Critical path: Applications table → API endpoints → Table component → Page

**Estimated Output**: 22-28 numbered, ordered tasks in tasks.md covering:
- Constants and enums setup (3 tasks)
- Database schema and migrations (4 tasks) 
- TDD test coverage (6 tasks)
- API endpoints with concurrency handling (4 tasks)
- Component creation (7 tasks)
- Integration and validation (4 tasks)

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
- Multi-tenant security: All queries scoped by school/team with basic audit logging
- No hardcoding: All statuses and roles use enums/constants
- Database efficiency: Optimized queries with proper indexing and low concurrency patterns


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
