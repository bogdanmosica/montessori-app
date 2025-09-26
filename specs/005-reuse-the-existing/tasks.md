# Tasks: Reusable Admin Navigation Bar

**Input**: Design documents from `specs/005-reuse-the-existing/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 15, React 19, TypeScript, shadcn/ui, Tailwind CSS
   → Structure: Web frontend component with routing integration
2. Load design documents:
   → data-model.md: NavigationItem, NavigationConfig, AdminPage entities
   → contracts/: AdminNavigation component interface contracts
   → research.md: Existing navigation patterns to reuse
   → quickstart.md: 6 test scenarios for validation
3. Generate tasks by category:
   → Setup: Component structure, constants
   → Tests: Component tests, integration scenarios
   → Core: Navigation component, configuration
   → Integration: Page integration, placeholder pages
   → Polish: E2E tests, responsive validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph and parallel execution examples
7. Validate: All contracts tested, all entities implemented, all quickstart scenarios covered
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Components**: `components/admin/` for admin-specific shared components
- **Constants**: `lib/constants/` for navigation configuration
- **Types**: `lib/types/` for TypeScript interfaces
- **Pages**: `app/admin/` for admin page integration
- **Tests**: `__tests__/components/` and `__tests__/integration/`

## Phase 3.1: Setup & Configuration
- [X] T001 [P] Create navigation constants in `lib/constants/admin-navigation.ts` with ADMIN_ROUTES, NAVIGATION_LABELS, and navigation items configuration
- [X] T002 [P] Create TypeScript interfaces in `lib/types/navigation.ts` for NavigationItem, NavigationConfig, and AdminPage types from data-model.md
- [X] T003 [P] Create placeholder page component in `components/admin/placeholder-page.tsx` per PlaceholderPage contract

## Phase 3.2: Core Implementation
- [X] T004 Create AdminNavigation component in `components/admin/admin-navigation.tsx` implementing AdminNavigationProps interface and behavior contracts from component-contracts.md
- [X] T005 [P] Create desktop navigation layout in `components/admin/admin-navigation.tsx` using Next.js Link components and active state detection with usePathname()
- [X] T006 [P] Add mobile responsive behavior to AdminNavigation component with hamburger menu toggle and mobile menu state management
- [X] T007 [P] Implement authorization handling in AdminNavigation component with redirect logic for unauthorized users

## Phase 3.3: Page Integration (Sequential - modifying existing pages)  
- [X] T008 Integrate AdminNavigation into admin dashboard page `app/admin/dashboard/page.tsx` as topmost header element while preserving existing layout
- [X] T009 Integrate AdminNavigation into admin applications page `app/admin/applications/page.tsx` maintaining consistent positioning and styling
- [X] T010 Create enrollments placeholder page `app/admin/enrollments/page.tsx` using PlaceholderPage component with "Enrollments" as page name
- [X] T011 Create payments placeholder page `app/admin/payments/page.tsx` using PlaceholderPage component with "Payments" as page name
- [X] T012 Create reports placeholder page `app/admin/reports/page.tsx` using PlaceholderPage component with "Reports" as page name

## Phase 3.4: Styling & Polish
- [X] T013 [P] Add Tailwind CSS classes for navigation styling using shadcn/ui Button and Card components for consistency with existing design system
- [X] T014 [P] Implement active state visual highlighting with proper contrast and accessibility considerations
- [X] T015 [P] Add mobile breakpoint styles for responsive navigation layout adapting to screen sizes <768px

## Dependencies

### Sequential Dependencies
1. **Setup** (T001-T003) → **Tests** (T004-T010) → **Core** (T011-T014)
2. **Core Implementation** (T011-T014) → **Page Integration** (T015-T019)  
3. **Page Integration** (T015-T019) → **Styling** (T020-T022)
4. **All Implementation** (T011-T022) → **E2E Testing** (T023-T025)

### Parallel Execution Groups
- **Setup Phase**: T001, T002, T003 (different files)
- **Test Phase**: T004, T005, T006, T007, T008, T009, T010 (different test files)
- **Component Logic**: T012, T013, T014 (within same component file)
- **Styling Phase**: T020, T021, T022 (different style concerns)
- **E2E Phase**: T023, T024, T025 (different test scenarios)

## Parallel Execution Examples

### Example 1: Setup Phase
```bash
# Run in parallel - different files
Task T001: Create navigation constants
Task T002: Create TypeScript interfaces  
Task T003: Create placeholder component
```

### Example 2: Test Phase  
```bash
# Run in parallel - independent test files
Task T004: AdminNavigation unit test
Task T005: PlaceholderPage unit test
Task T006: Navigation display integration test
Task T007: Active state integration test
Task T008: Responsive behavior test
Task T009: Placeholder pages test
Task T010: Authorization test
```

### Example 3: E2E Validation
```bash
# Run in parallel - independent test scenarios
Task T023: Complete user journey E2E test
Task T024: Performance validation E2E test
Task T025: Authorization flow E2E test
```

## Validation Checklist
- [ ] All component contracts from `contracts/component-contracts.md` have corresponding tests
- [ ] All entities from `data-model.md` (NavigationItem, NavigationConfig, AdminPage) are implemented
- [ ] All test scenarios from `quickstart.md` (6 scenarios) are covered by integration/E2E tests
- [ ] All admin pages (Dashboard, Applications, Enrollments, Payments, Reports) have navigation integration
- [ ] Constitutional principles maintained (micro functions, component reuse, responsive design)
- [ ] Performance goals met (<100ms navigation response time)

---
*Generated from Monte SMS Constitution v1.0.0 - 25 tasks total, 15 parallelizable*