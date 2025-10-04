# Data Model: Montessori-App Post-Migration

## Entities

### School
- id: string
- name: string
- address: string
- ...

### SchoolMember
- id: string
- userId: string
- schoolId: string
- role: enum (Admin, Teacher, Parent)

### MetricsService
- Provides metrics scoped by schoolId
- Used by dashboards and lists

### PaymentFlow
- Manages subscriptions and invoices
- References schoolId
- Payments are made by parents

## Relationships
- School has many SchoolMembers
- SchoolMember belongs to one School
- MetricsService aggregates data per School
- PaymentFlow links subscriptions/invoices to School and Parent

## Notes
- All queries and references must use `schools` and `schoolMembers` tables
- Legacy references (teams/teamMembers) should be removed or patched
- Role-based scoping enforced for all entities

---
