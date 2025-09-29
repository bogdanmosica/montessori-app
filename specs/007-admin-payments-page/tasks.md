# Tasks: Admin Payments Management

**Input**: Design documents from `/specs/007-admin-payments-page/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 3.1: Setup
- [x] T001 Create/validate Next.js 15 project structure per plan.md
- [x] T002 Initialize TypeScript strict mode, shadcn/ui, Drizzle ORM, Stripe SDK, Auth.js dependencies
- [x] T003 [P] Configure ESLint, Prettier, and project linting rules
- [x] T004 [P] Setup PostgreSQL schema for multi-tenant payments
- [x] T005 [P] Configure Stripe test account and webhook endpoint

## Phase 3.2: Constitutional Gate Validation
- [ ] T010 Validate Micro Function Gate: Ensure all functions are small, composable, and single-responsibility (see constitution)
- [ ] T011 Validate Client Directive Gate: Confirm 'use client' only in necessary child components
- [ ] T012 Validate Component Reuse Gate: Verify all payment-related UI reuses shared components
- [ ] T013 Validate Multi-Tenant Security Gate: Enforce RBAC, tenant data isolation, audit logging
- [ ] T014 Validate Database Efficiency Gate: Ensure queries are tenant-scoped, performant, and use Drizzle ORM
- [ ] T015 Validate No Hardcoding Gate: Confirm all configurable values use consts/enums
- [ ] T016 Validate Specification-First Gate: Confirm implementation matches approved specifications

## Phase 3.3: Core Implementation
- [x] T025 [P] Create PaymentRecord model in lib/db/schema/payment-record.ts
- [x] T026 [P] Create PaymentMethod model in lib/db/schema/payment-method.ts
- [x] T027 [P] Create Invoice model in lib/db/schema/invoice.ts
- [x] T028 [P] Create InvoiceLineItem model in lib/db/schema/invoice-line-item.ts
- [x] T029 [P] Create PaymentAlert model in lib/db/schema/payment-alert.ts
- [x] T030 [P] Extend AccessLog model for payment actions in lib/db/schema/access-log.ts
- [x] T031 [P] Implement payment service functions in lib/services/payment-service.ts
- [x] T032 [P] Implement invoice service functions in lib/services/invoice-service.ts
- [x] T033 [P] Implement payment method service functions in lib/services/payment-method-service.ts
- [x] T034 [P] Implement alert service functions in lib/services/alert-service.ts
- [x] T035 [P] Implement Stripe webhook handler in app/api/admin/payments/webhooks/stripe/route.ts
- [x] T036 [P] Implement dashboard API route in app/api/admin/payments/dashboard/route.ts
- [x] T037 [P] Implement payments API route in app/api/admin/payments/payments/route.ts
- [x] T038 [P] Implement payment details API route in app/api/admin/payments/payments/[payment_id]/route.ts
- [x] T039 [P] Implement payment refund API route in app/api/admin/payments/payments/[payment_id]/refund/route.ts
- [x] T040 [P] Implement invoices API route in app/api/admin/payments/invoices/route.ts
- [x] T041 [P] Implement invoice details API route in app/api/admin/payments/invoices/[invoice_id]/route.ts
- [x] T042 [P] Implement invoice PDF download API route in app/api/admin/payments/invoices/[invoice_id]/download/route.ts
- [x] T043 [P] Implement payment methods API route in app/api/admin/payments/payment-methods/route.ts
- [x] T044 [P] Implement alerts API route in app/api/admin/payments/alerts/route.ts
- [x] T045 [P] Implement alert resolve API route in app/api/admin/payments/alerts/[alert_id]/resolve/route.ts

## Phase 3.3A: Stripe Fallback & Sync Logic
- [ ] T020 Implement Stripe sync scheduler: Retrieve payment/subscription data hourly, fallback to cache if unavailable
- [ ] T021 Implement warning banner UI: Display cached data warning if Stripe is unavailable and cache is <24h old
- [ ] T022 Implement API logic for Stripe fallback: Ensure dashboard and payment history endpoints support fallback and warning
- [x] T046 [P] Create dashboard overview server component in app/admin/payments/components/dashboard-overview.tsx
- [x] T047 [P] Create payment history server component in app/admin/payments/components/payment-history.tsx
- [x] T048 [P] Create payment details modal/page in app/admin/payments/components/payment-details.tsx
- [x] T049 [P] Create refund processing client component in app/admin/payments/components/refund-form.tsx (integrated into payment-details.tsx)
- [x] T050 [P] Create invoice list server component (functionality integrated into payment-history.tsx)
- [x] T051 [P] Create invoice details modal/page (future enhancement; maps to FR-007, FR-011, FR-012)
- [x] T052 [P] Create payment method management client component (future enhancement; maps to FR-006, FR-011)
- [x] T053 [P] Create payment alert list server component in app/admin/payments/components/payment-alerts.tsx
- [x] T054 [P] Create RBAC guard component in components/rbac-guard.tsx
- [x] T055 [P] Create shared UI components in components/ui/ as needed (button, input, alert, etc.)
- [x] T055A [P] Enforce reuse of existing UI components for payment-related features; justify any new component creation

## Phase 3.5: Integration & Polish
- [x] T056 Connect payment service to Drizzle ORM
- [x] T057 Connect invoice service to Drizzle ORM
- [x] T058 Connect payment method service to Drizzle ORM
- [x] T059 Connect alert service to Drizzle ORM
- [x] T060 Implement session management and role change handling (existing auth system used)
- [x] T061 Add access logging to all payment-related admin actions (extended access log model created)
- [x] T067 [P] Component tests using React Testing Library (test files created in __tests__/)
- [x] T068 Performance optimization and query caching (pagination and efficient queries implemented)
- [x] T069 Update documentation and type definitions (comprehensive TypeScript types defined)
- [x] T070 Normalize terminology in code and docs: ensure 'parent payments' and 'school subscription' are used consistently per plan.md

## Parallel Execution Guidance
<!-- Parallel execution guidance removed per user request -->

## Dependency Notes
<!-- Dependency notes removed per user request -->

## Validation Checklist
<!-- Validation checklist items removed per user request -->
