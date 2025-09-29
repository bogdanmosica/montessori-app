---
description: Execute automated tests using Playwright MCP based on generated test cases with constitutional compliance validation.
---

The user input can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json` from repo root and parse TEST_PLAN, TEST_CASES_DIR, and AVAILABLE_TEST_SPECS. All paths must be absolute.

2. Load and analyze the testing context:
   - **REQUIRED**: Read test-plan.md for testing strategy and execution methodology
   - **REQUIRED**: Load all test case specifications from TEST_CASES_DIR
   - **REQUIRED**: Read constitution at `.specify/memory/constitution.md` for validation gates
   - **IF EXISTS**: Read plan.md for application architecture and endpoint specifications
   - **IF EXISTS**: Read quickstart.md for user workflow scenarios and test data setup
   - **IF EXISTS**: Parse existing test results and failure patterns

3. Initialize Playwright testing environment:
   - **Browser Setup**: Configure browser instance with appropriate viewport and settings
   - **Multi-Tenant Context**: Set up test data with multiple school/tenant configurations
   - **Authentication Setup**: Prepare Admin, Teacher, and Parent user contexts
   - **Database State**: Initialize clean test database with multi-tenant sample data
   - **Environment Config**: Load test environment variables and configuration

4. Execute test categories in priority order:
   - **Phase 1 - Security & RBAC Tests**: Multi-tenant access control, session management
   - **Phase 2 - Component Functionality Tests**: UI component behavior, form validation
   - **Phase 3 - Integration Tests**: API endpoints, database operations, cross-component workflows
   - **Phase 4 - Performance Tests**: Response times, concurrent user scenarios
   - **Phase 5 - End-to-End Tests**: Complete user journeys, multi-role workflows

5. Playwright execution strategy:
   - **Constitutional Gate Validation**: Test each quality gate from constitution
   - **Role-Based Testing**: Execute scenarios for Admin, Teacher, Parent perspectives
   - **Tenant Isolation Verification**: Ensure data separation between different schools
   - **Client-Server Boundary Tests**: Validate server component behavior and client directive usage
   - **Component Reusability Tests**: Verify UI consistency across different pages and workflows
   - **Error Handling Tests**: Test edge cases, validation failures, unauthorized access attempts

6. Test execution workflow:
   - **Pre-execution**: Validate test environment setup and data initialization
   - **Parallel Execution**: Run independent test suites concurrently for efficiency
   - **Sequential Dependencies**: Execute dependent tests in proper order
   - **Real-time Monitoring**: Track test progress and capture screenshots/videos on failures
   - **Failure Handling**: Continue execution with non-blocking failures, halt on critical security issues

7. Results collection and analysis:
   - **Test Results Matrix**: Pass/fail status for each constitutional principle and feature area
   - **Performance Metrics**: Response times, page load speeds, concurrent user limits
   - **Security Validation**: RBAC compliance, tenant isolation verification, audit log accuracy
   - **UI Consistency Report**: Component reusability validation and design system adherence
   - **Failure Analysis**: Root cause analysis for failed tests with reproduction steps

8. Reporting and documentation:
   - **Executive Summary**: High-level test results with constitutional compliance status
   - **Detailed Test Report**: Individual test case results with screenshots and logs
   - **Performance Benchmarks**: Comparison against expected performance criteria
   - **Security Assessment**: Multi-tenant security validation and risk assessment
   - **Recommendations**: Action items for addressing failures and improving quality

9. Integration with development workflow:
   - **CI/CD Integration**: Generate test results in format compatible with build pipeline
   - **Regression Testing**: Compare results against previous test runs to identify regressions
   - **Test Data Management**: Clean up test data and reset environment for future runs
   - **Artifact Storage**: Archive test results, screenshots, and logs for future reference

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

Note: This command requires generated test cases from `/qa-tasks`. Ensure test plan and test cases are available before execution.