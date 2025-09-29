---
description: Generate comprehensive test cases from specification files following constitutional principles and architecture patterns.
---

The user input can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireSpecs -IncludeSpecs` from repo root and parse SPECS_DIR and AVAILABLE_SPECS list. All paths must be absolute.

2. Load and analyze the project context:
   - **REQUIRED**: Read constitution at `.specify/memory/constitution.md` for principles and quality gates
   - **REQUIRED**: Identify all spec files in SPECS_DIR and analyze their structure
   - **IF EXISTS**: Read plan.md for technical architecture and dependencies
   - **IF EXISTS**: Read data-model.md for entity relationships and validation rules
   - **IF EXISTS**: Read contracts/ for API specifications and interface requirements
   - **IF EXISTS**: Read quickstart.md for integration scenarios and user workflows

3. Parse specification files and extract test requirements:
   - **Functional requirements**: User stories, acceptance criteria, business rules
   - **Non-functional requirements**: Performance, security, accessibility standards
   - **Multi-tenant scenarios**: Role-based access control, data isolation requirements
   - **Integration points**: API endpoints, database operations, external service interactions
   - **Error handling**: Edge cases, validation failures, security violations

4. Generate test case categories following constitutional principles:
   - **Micro Function Tests**: Unit tests for small, composable functions
   - **Client-Server Boundary Tests**: Server component rendering, client directive validation
   - **Component Reusability Tests**: UI component consistency, shadcn/ui compliance
   - **Multi-Tenant Security Tests**: RBAC enforcement, tenant data isolation, audit logging
   - **Database Efficiency Tests**: Query performance, caching behavior, multi-tenant scoping
   - **No Hardcoding Tests**: Configuration validation, constants usage verification
   - **Specification Compliance Tests**: Feature implementation against original requirements

5. Test case generation rules:
   - **Test-Driven Development**: Generate test cases before implementation requirements
   - **Quality Gate Validation**: Create tests that verify each constitutional gate
   - **Role-Based Testing**: Include Admin, Teacher, Parent access scenarios
   - **Tenant Isolation**: Ensure all tests verify multi-tenant data separation
   - **Performance Standards**: Include load testing for realistic school usage patterns
   - **Security Validation**: Test authentication, authorization, and audit trail requirements

6. Output comprehensive test documentation:
   - **Test Plan Overview**: Strategy, scope, and testing methodology
   - **Test Cases by Category**: Organized by constitutional principles and feature areas
   - **Test Data Requirements**: Multi-tenant test data setup and management
   - **Automation Strategy**: Unit, integration, and end-to-end testing approach
   - **Performance Benchmarks**: Expected response times and throughput requirements
   - **Security Test Matrix**: RBAC scenarios and threat model validation

7. Quality assurance and validation:
   - Verify test coverage addresses all specification requirements
   - Ensure constitutional compliance is testable and measurable
   - Validate multi-tenant security scenarios are comprehensive
   - Confirm test cases align with educational institution workflows
   - Check that performance tests reflect realistic school usage patterns

8. Integration with development workflow:
   - Generate test cases in format compatible with existing test framework
   - Provide clear traceability from specifications to test cases
   - Include setup instructions for test environment and data
   - Document test execution order and dependencies
   - Create validation criteria for test success/failure determination

Note: This command focuses on test case generation and planning. Use `/qa-test` to execute the generated test cases using Playwright automation.

Output Format:
- Generate test-plan.md with comprehensive testing strategy
- Create test-cases/ directory with categorized test specifications
- Include setup instructions and test data requirements
- Provide traceability matrix linking specs to test cases
- Document expected outcomes and success criteria