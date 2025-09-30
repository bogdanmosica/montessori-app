
# Implementation Plan: Extend Child Creation with Monthly Fee Assignment

**Branch**: `009-extend-child-creation` | **Date**: September 29, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-extend-child-creation/spec.md`

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
Extend existing child creation workflows on `/admin/enrollments/new` and `/admin/applications/create-child` to include optional monthly fee input in RON currency. Implement hybrid fee model where children have optional default fees and enrollments can override them. Features fee validation (≥0 RON), admin-only access, centralized currency constants, and comprehensive edit capabilities post-creation. Builds on existing children table schema with `monthlyFee` field already present.

## Technical Context
**Language/Version**: TypeScript 5.8.3, Node.js (Next.js 15.4.0 App Router)  
**Primary Dependencies**: Next.js, React 19, Drizzle ORM, PostgreSQL, shadcn/ui, Tailwind CSS, Zod, React Hook Form  
**Storage**: PostgreSQL with existing children table (monthlyFee field exists), multi-tenant with schoolId scoping  
**Testing**: Jest with React Testing Library for components, contract tests for API routes  
**Target Platform**: Web application (Server-side rendered Next.js with selective client components)  
**Project Type**: web - Next.js application with admin dashboard features  
**Performance Goals**: <200ms page load for admin forms, real-time form validation, optimistic UI updates  
**Constraints**: RON currency only, Admin-role access only, multi-tenant data isolation, RBAC enforcement  
**Scale/Scope**: School management system - 50-500 children per school, 5-20 admin users per school, form-heavy workflows

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

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

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
- Load `.specify/templates/tasks-template.md` as base template
- Generate database tasks: Add `monthlyFeeOverride` column to enrollments table
- Generate constants tasks: Create currency enums and formatting utilities in `/lib/constants/currency.ts`
- Generate validation tasks: Create Zod schemas for child/enrollment fee validation
- Generate service tasks: Extend child/enrollment services with fee logic
- Generate component tasks: Create fee input components for both admin pages
- Generate API tasks: Extend existing child/enrollment API routes with fee handling
- Generate contract test tasks: Test each API endpoint with fee scenarios [P]
- Generate integration test tasks: Test complete user workflows from quickstart [P]
- Generate UI tasks: Update existing forms with fee inputs, display logic

**Ordering Strategy**:
- **Phase 2A - Foundation** (Parallel execution): Database migration, constants, validation schemas [P]
- **Phase 2B - Services** (Sequential): Extend child service → enrollment service → fee resolution logic
- **Phase 2C - API Layer** (Parallel after services): Extend API routes, add contract tests [P]
- **Phase 2D - UI Components** (Parallel after APIs): Fee input components, form integration [P] 
- **Phase 2E - Integration** (Sequential): End-to-end testing, quickstart validation, performance testing

**Task Categories**:
1. **Database Tasks** (1-2 tasks): Schema migration, seed data updates
2. **Constants & Validation** (2-3 tasks): Currency enums, Zod schemas, formatting utilities  
3. **Service Layer** (3-4 tasks): Child service, enrollment service, fee resolution service
4. **API Layer** (4-6 tasks): Extend existing routes, new fee endpoints, contract tests
5. **Component Layer** (5-7 tasks): Fee input components, form updates, display logic
6. **Integration Testing** (4-5 tasks): User workflow tests, performance tests, accessibility tests
7. **Documentation** (1-2 tasks): Update API docs, user guides

**Estimated Output**: 20-29 numbered, ordered tasks in tasks.md

**Dependency Management**:
- Database migration must complete before all other tasks
- Services must complete before API extensions
- APIs must complete before UI components
- Contract tests can run in parallel with implementation
- Integration tests require all components complete

**Constitutional Compliance**:
- Each task validates against relevant constitutional gates
- Micro-function principle enforced in task descriptions
- Multi-tenant security requirements in all database/API tasks
- Component reuse checked before new component creation
- No hardcoding requirements in all implementation tasks

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
