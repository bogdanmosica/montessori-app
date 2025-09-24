````markdown
# montessori-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-24

## Active Technologies
- TypeScript (strict mode) + Next.js 15 App Router + React 19 (003-admin-applications)
- Drizzle ORM + PostgreSQL (003-admin-applications)
- Auth.js + shadcn/ui + Tailwind CSS (003-admin-applications)

## Project Structure
```
app/
├── admin/
│   ├── dashboard/          # Existing admin dashboard
│   └── applications/       # NEW: Applications management
│       ├── components/     # ApplicationsTable, ApplicationActions, forms
│       ├── constants.ts    # Application statuses, roles, validation
│       ├── server/         # applications.ts server functions
│       └── page.tsx        # Main applications page
├── api/
│   ├── applications/       # GET /api/applications
│   ├── admin/enrollment/   # POST approval/rejection workflow
│   ├── children/          # POST child creation
│   └── users/             # POST parent account creation
components/ui/             # Shared shadcn/ui components
lib/
├── db/schema/            # Drizzle schemas (applications, enrollments)
└── auth/                 # Existing auth utilities
```

## Commands
pnpm dev; pnpm build; pnpm test

## Code Style
TypeScript: Strict mode, prefer server components, use client only when needed
Next.js: App Router patterns, server-side rendering, middleware for auth
Database: Drizzle ORM with multi-tenant scoping, atomic transactions

## Constitutional Requirements
- Micro functions: Small, focused components and server functions
- Server-first: Use client directive only on leaf components needing interactivity
- Multi-tenant: All queries scoped by schoolId, RBAC enforcement
- No hardcoding: All statuses/roles in enums/constants
- Database efficiency: Indexed queries, transaction atomicity

## Recent Changes
- 003-admin-applications: Added admin applications management with approval workflow
- Applications table with search/filter/pagination (server-side)
- Atomic approval process (parent + child + enrollment creation)
- Multi-step forms with validation and error handling

<!-- MANUAL ADDITIONS START -->
Admin Applications Feature Context:
- Route: /admin/applications (admin-only via middleware)
- Approval workflow creates parent user + child record + enrollment atomically
- Server-side pagination and filtering for performance
- shadcn/ui Table component with consistent styling
- Multi-tenant security with schoolId scoping throughout
<!-- MANUAL ADDITIONS END -->