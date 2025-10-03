
# Implementation Plan: Teacher Progress Board

**Branch**: `013-teacher-progress-board` | **Date**: October 2, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-teacher-progress-board/spec.md`

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
Teacher Progress Board is a visual Kanban interface that allows Teachers to track lesson progress for their students. Each card represents either a student-lesson assignment or a template lesson for planning purposes. Teachers can drag cards between configurable progress columns (Not Started, In Progress, Completed) with admin-configured column templates. The system supports both assigned lessons and unassigned template cards for lesson preparation, with multi-tenant security and concurrent access protection through card locking.

## Technical Context
**Language/Version**: TypeScript with Next.js 15 (App Router) and React 19  
**Primary Dependencies**: Next.js, React, Drizzle ORM, shadcn/ui, Tailwind CSS, Auth.js  
**Storage**: PostgreSQL with Drizzle ORM for lesson progress tracking and multi-tenant data isolation  
**Testing**: Jest for unit tests, Playwright for E2E testing, MSW for API mocking  
**Target Platform**: Web application (Next.js server-side + client-side components)
**Project Type**: web (Next.js application with frontend + backend)  
**Performance Goals**: <200ms drag-and-drop response, smooth 60fps animations, real-time updates  
**Constraints**: Multi-tenant data isolation, RBAC enforcement, card locking for concurrent access  
**Scale/Scope**: 100+ teachers per school, 1000+ students, 10k+ lesson assignments per school

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Micro Function Gate
- [x] Functions must be small, composable, and focused on one responsibility
- [x] No single file should contain excessive unrelated logic
- [x] Route handlers and page components are kept minimal with logic extracted to separate files

### Client Directive Gate
- [x] `use client` must only appear in the **most child component** that truly requires it (only drag-and-drop components)
- [x] Avoid marking entire routes/pages as client unless absolutely necessary
- [x] Server components are preferred for data fetching and initial rendering

### Component Reuse Gate
- [x] Before creating a new component, confirm one doesn't already exist in the scoped `components/` folder
- [x] Shared UI components should live in the global `ui/` library folder
- [x] shadcn/ui and Tailwind used consistently across all components

### Multi-Tenant Security Gate
- [x] All database queries are scoped by tenant (school/team)
- [x] RBAC enforcement is implemented at both middleware and route level (Teacher role only)
- [x] User actions are logged to `access_logs` with proper tenant isolation
- [x] Session management handles role changes appropriately

### Database Efficiency Gate
- [x] Only query the database when necessary (batched lesson progress queries)
- [x] Avoid redundant queries; use caching or state management when possible
- [x] Drizzle ORM is used instead of raw SQL unless performance requires otherwise
- [x] Query performance is tested under realistic multi-tenant load

### No Hardcoding Gate
- [x] All configurable values use `const` or `enum` declarations (lesson statuses, roles)
- [x] No hardcoded strings, roles, statuses, or business logic values in implementation
- [x] Configuration is externalized and environment-appropriate

### Specification-First Gate
- [x] Clear specifications exist before implementation begins (completed spec with clarifications)
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

**Structure Decision**: Option 2 (Next.js application) - Web application with React components and API routes

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
- Database schema tasks: LessonProgress, ProgressColumn table creation [P]
- API contract tests: 7 endpoints × test files [P]
- Data model tasks: Drizzle schema, migrations, seed data [P]
- Service layer tasks: progress queries, card operations, locking logic
- UI component tasks: KanbanBoard, ProgressCard, drag-and-drop integration
- Integration test tasks: Each user journey from quickstart → test scenario
- Implementation tasks to make failing tests pass

**Ordering Strategy**:
- TDD order: Contract tests → Models → Services → UI → Integration tests
- Dependency order: Database → API → Services → Components → Pages
- Parallel execution: Independent model files, test files, component files [P]
- Sequential: Schema migration → seed data → API implementation → UI integration

**Specialized Task Categories**:
- **Database Tasks**: Schema migration, index creation, seed data scripts
- **API Tasks**: Route handlers, middleware, validation, error handling
- **Service Tasks**: Query optimization, batch operations, lock management
- **Component Tasks**: Drag-and-drop components (`use client`), server components
- **Integration Tasks**: E2E test scenarios, performance validation
- **Security Tasks**: RBAC enforcement, multi-tenant data scoping, audit logging

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md
- 8 Database/Schema tasks
- 12 API contract and implementation tasks
- 8 Service layer tasks
- 10 UI component tasks
- 6 Integration and testing tasks

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
- [ ] Complexity deviations documented (none required)

---
*Based on Monte SMS Constitution v1.0.0 - See `.specify/memory/constitution.md`*
