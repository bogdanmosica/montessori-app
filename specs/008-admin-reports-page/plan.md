
# Implementation Plan: Admin Reports Page

**Branch**: `008-admin-reports-page` | **Date**: 2025-09-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-admin-reports-page/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Admin reports page that allows Admins to generate, filter, and export reports for applications, enrollments, payments, and school activity. Reports are generated synchronously with full PII included, exported as CSV/PDF, and scoped to tenant context. No report storage or scheduling features.

## Technical Context
**Language/Version**: TypeScript 5.8+ with React 19 and Next.js 15.4 (App Router)  
**Primary Dependencies**: Drizzle ORM, PostgreSQL, shadcn/ui, Tailwind CSS, Stripe, Auth.js  
**Storage**: PostgreSQL database with Drizzle ORM, no report persistence (on-demand generation)  
**Testing**: Jest with jsdom environment, integration and unit tests  
**Target Platform**: Web application (responsive design for desktop/mobile)  
**Project Type**: Next.js web application - determines source structure  
**Performance Goals**: Synchronous report generation with loading indicators, <2s response time for typical reports  
**Constraints**: Multi-tenant scoped queries, RBAC enforcement, full PII inclusion in exports  
**Scale/Scope**: Multi-school SaaS platform, tenant-isolated data, Admin-only access

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

**Structure Decision**: Next.js application (Option 2) - Admin reports feature fits the web application pattern with route groups, scoped components, and API endpoints

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
- Extract API endpoints from contracts/reports-api.yaml → API route handler tasks
- Extract data models from data-model.md → Drizzle schema and service tasks  
- Extract UI components from quickstart scenarios → component creation tasks
- Each user story from quickstart → integration test task
- Constitutional gates → validation tasks throughout

**Ordering Strategy**:
- **Foundation First**: Database schemas, enums, and constants
- **Services Layer**: Report generation services and utilities
- **API Layer**: Route handlers for each report type
- **UI Components**: Page components, forms, tables, export buttons
- **Integration**: User flow tests and end-to-end validation
- **Performance**: Load testing and optimization
- Mark [P] for parallel execution (independent files)

**Estimated Task Categories**:
1. **Database & Models** (4-5 tasks): Drizzle schemas, enum definitions, migration scripts
2. **Services** (6-7 tasks): Report generation services, CSV/PDF utilities, query builders
3. **API Routes** (4 tasks): One handler per report type (applications, enrollments, payments, activity)  
4. **UI Components** (8-10 tasks): Report page, filter forms, data tables, export buttons, loading states
5. **Security** (3-4 tasks): RBAC middleware, tenant isolation, audit logging
6. **Testing** (8-12 tasks): Unit tests for services, API tests, integration tests, security tests
7. **Integration** (3-4 tasks): End-to-end user flows, performance validation, quickstart verification

**Estimated Output**: 35-45 numbered, ordered tasks in tasks.md with clear dependencies and parallel execution markers

**Key Dependencies Identified**:
- Database schemas must be complete before service implementation
- Services must be functional before API route handlers
- API routes must work before UI component integration
- All components needed before integration testing
- Security implementation spans multiple layers

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


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
