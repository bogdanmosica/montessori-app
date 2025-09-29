---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

The user input to you can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

Goal: Identify inconsistencies, duplications, ambiguities, and underspecified items across the core artifacts (`spec.md`, `plan.md`, `tasks.md`, test specifications) before implementation. This command MUST run only after `/tasks` has successfully produced a complete `tasks.md`.

STRICTLY READ-ONLY: Do **not** modify any files. Output a structured analysis report. Offer an optional remediation plan (user must explicitly approve before any follow-up editing commands would be invoked manually).

QA Integration: When test specifications exist (from `/qa-tasks` output), include test coverage analysis and validate that critical requirements have corresponding test cases, especially for constitutional compliance (multi-tenant security, RBAC, etc.).

Constitution Authority: The project constitution (`.specify/memory/constitution.md`) is **non-negotiable** within this analysis scope. Constitution conflicts are automatically CRITICAL and require adjustment of the spec, plan, or tasks—not dilution, reinterpretation, or silent ignoring of the principle. If a principle itself needs to change, that must occur in a separate, explicit constitution update outside `/analyze`.

Execution steps:

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` once from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS. Derive absolute paths:
   - SPEC = FEATURE_DIR/spec.md
   - PLAN = FEATURE_DIR/plan.md
   - TASKS = FEATURE_DIR/tasks.md
   - TEST_PLAN = FEATURE_DIR/test-plan.md (if exists from `/qa-tasks`)
   - TEST_CASES = FEATURE_DIR/test-cases/ (if exists from `/qa-tasks`)
   Abort with an error message if any required file is missing (instruct the user to run missing prerequisite command).

2. Load artifacts:
   - Parse spec.md sections: Overview/Context, Functional Requirements, Non-Functional Requirements, User Stories, Edge Cases (if present).
   - Parse plan.md: Architecture/stack choices, Data Model references, Phases, Technical constraints.
   - Parse tasks.md: Task IDs, descriptions, phase grouping, parallel markers [P], referenced file paths.
   - Parse test-plan.md (if exists): Test strategy, coverage requirements, QA methodology.
   - Parse test-cases/ directory (if exists): Test specifications by category, constitutional compliance tests.
   - Load constitution `.specify/memory/constitution.md` for principle validation.

3. Build internal semantic models:
   - Requirements inventory: Each functional + non-functional requirement with a stable key (derive slug based on imperative phrase; e.g., "User can upload file" -> `user-can-upload-file`).
   - User story/action inventory.
   - Task coverage mapping: Map each task to one or more requirements or stories (inference by keyword / explicit reference patterns like IDs or key phrases).
   - Test coverage mapping: Map test cases to requirements and constitutional principles.
   - Constitution rule set: Extract principle names and any MUST/SHOULD normative statements.

4. Detection passes:
   A. Duplication detection:
      - Identify near-duplicate requirements. Mark lower-quality phrasing for consolidation.
   B. Ambiguity detection:
      - Flag vague adjectives (fast, scalable, secure, intuitive, robust) lacking measurable criteria.
      - Flag unresolved placeholders (TODO, TKTK, ???, <placeholder>, etc.).
   C. Underspecification:
      - Requirements with verbs but missing object or measurable outcome.
      - User stories missing acceptance criteria alignment.
      - Tasks referencing files or components not defined in spec/plan.
   D. Constitution alignment:
      - Any requirement or plan element conflicting with a MUST principle.
      - Missing mandated sections or quality gates from constitution.
   E. Coverage gaps:
      - Requirements with zero associated tasks.
      - Tasks with no mapped requirement/story.
      - Non-functional requirements not reflected in tasks (e.g., performance, security).
   F. Inconsistency:
      - Terminology drift (same concept named differently across files).
      - Data entities referenced in plan but absent in spec (or vice versa).
      - Task ordering contradictions (e.g., integration tasks before foundational setup tasks without dependency note).
      - Conflicting requirements (e.g., one requires to use Next.js while other says to use Vue as the framework).
   G. Test coverage gaps (if QA artifacts exist):
      - Critical requirements without corresponding test cases.
      - Missing constitutional compliance tests (especially multi-tenant security, RBAC).
      - Test cases not mapped to any requirement.
      - Security-sensitive operations without proper test coverage.

5. Severity assignment heuristic:
   - CRITICAL: Violates constitution MUST, missing core spec artifact, requirement with zero coverage that blocks baseline functionality, or critical security requirement without test coverage.
   - HIGH: Duplicate or conflicting requirement, ambiguous security/performance attribute, untestable acceptance criterion, missing RBAC or multi-tenant tests.
   - MEDIUM: Terminology drift, missing non-functional task coverage, underspecified edge case, incomplete test coverage for non-critical features.
   - LOW: Style/wording improvements, minor redundancy not affecting execution order, optional test scenarios.

6. Produce a Markdown report (no file writes) with sections:

   ### Specification Analysis Report
   | ID | Category | Severity | Location(s) | Summary | Recommendation |
   |----|----------|----------|-------------|---------|----------------|
   | A1 | Duplication | HIGH | spec.md:L120-134 | Two similar requirements ... | Merge phrasing; keep clearer version |
   (Add one row per finding; generate stable IDs prefixed by category initial.)

   Additional subsections:
   - Coverage Summary Table:
     | Requirement Key | Has Task? | Task IDs | Has Test? | Test Coverage | Notes |
   - Test Coverage Analysis (if QA artifacts exist):
     | Constitutional Principle | Test Coverage | Missing Tests | Risk Level |
   - Constitution Alignment Issues (if any)
   - Unmapped Tasks (if any)
   - Unmapped Test Cases (if any)
   - Metrics:
     * Total Requirements
     * Total Tasks  
     * Total Test Cases (if exists)
     * Task Coverage % (requirements with >=1 task)
     * Test Coverage % (requirements with >=1 test)
     * Constitutional Test Coverage % (principles with test validation)
     * Ambiguity Count
     * Duplication Count
     * Critical Issues Count

7. At end of report, output a concise Next Actions block:
   - If CRITICAL issues exist: Recommend resolving before `/implement`.
   - If only LOW/MEDIUM: User may proceed, but provide improvement suggestions.
   - If test coverage gaps exist: Recommend running `/qa-tasks` to generate missing test cases.
   - Provide explicit command suggestions: e.g., "Run /specify with refinement", "Run /plan to adjust architecture", "Manually edit tasks.md to add coverage for 'performance-metrics'", "Run /qa-tasks to generate constitutional compliance tests".

8. Ask the user: "Would you like me to suggest concrete remediation edits for the top N issues?" (Do NOT apply them automatically.)

Behavior rules:
- NEVER modify files.
- NEVER hallucinate missing sections—if absent, report them.
- KEEP findings deterministic: if rerun without changes, produce consistent IDs and counts.
- LIMIT total findings in the main table to 50; aggregate remainder in a summarized overflow note.
- If zero issues found, emit a success report with coverage statistics and proceed recommendation.

Context: $ARGUMENTS
