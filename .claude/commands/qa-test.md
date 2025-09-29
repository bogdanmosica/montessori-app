---
description: Execute automated tests using Playwright MCP based on generated test cases with constitutional compliance validation.
---

The user input can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS


1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTests -IncludeTests` from repo root and parse TEST_PLAN, TEST_CASES_DIR, and AVAILABLE_TEST_SPECS. All paths must be absolute.

2. Load and analyze the testing context:
   - **REQUIRED**: Read test-plan.md for testing strategy and execution methodology
   - **REQUIRED**: Load all test case specifications from TEST_CASES_DIR
   - **REQUIRED**: Read constitution at `.specify/memory/constitution.md` for validation gates
   - **IF EXISTS**: Read plan.md for application architecture and endpoint specifications
   - **IF EXISTS**: Read quickstart.md for user workflow scenarios and test data setup
   - **IF EXISTS**: Parse existing test results and failure patterns

3. If all required files and environment are present, automatically start Playwright MCP testing:
   - Initialize Playwright testing environment (browser, multi-tenant data, authentication, database, environment config)
   - Execute test categories in priority order:
     - Security & RBAC
     - Component Functionality
     - Integration
     - Performance
     - End-to-End
   - Apply constitutional gate validation, role-based scenarios, tenant isolation, client-server boundaries, component reusability, error handling
   - Use parallel execution for independent suites, sequential for dependencies
   - Monitor progress, capture evidence, and handle failures (fail fast on security, continue on UI/performance)

4. Collect and analyze results:
   - Test Results Matrix
   - Performance Metrics
   - Security Validation
   - UI Consistency Report
   - Failure Analysis

5. Reporting and documentation:
   - Executive Summary
   - Detailed Test Report
   - Performance Benchmarks
   - Security Assessment
   - Recommendations

6. Integration with development workflow:
   - CI/CD Integration
   - Regression Testing
   - Test Data Management
   - Artifact Storage

Test Execution Rules:
- **Fail Fast**: Halt execution on critical security or multi-tenant isolation failures
- **Continue on UI Issues**: Continue testing for non-critical UI or performance issues
- **Comprehensive Logging**: Log all test actions for debugging and audit purposes
- **Constitutional Compliance**: Mark tests as failed if they violate constitutional principles
- **Multi-Tenant Validation**: Every test must verify proper tenant scoping and data isolation

Output Format:
- Generate comprehensive test-results.html report with visual dashboard
- Create detailed test-logs/ directory with execution traces and screenshots
- Provide constitutional-compliance.md report with gate validation results
- Include performance-benchmarks.json with quantitative metrics
- Document failed-tests.md with reproduction steps and recommended fixes

Note: This command requires generated test cases from `/qa-tasks`. If prerequisites are met, testing starts automatically.