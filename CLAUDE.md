# Claude Context: Monte SMS - Montessori School Management System

## Recent Changes
- 014-build-the-attendance: Added TypeScript (strict mode) with Next.js 15 App Router and React 19 + Drizzle ORM, Auth.js, shadcn/ui, Tailwind CSS
- 013-teacher-progress-board: Added TypeScript with Next.js 15 (App Router) and React 19 + Next.js, React, Drizzle ORM, shadcn/ui, Tailwind CSS, Auth.js
- 012-initialize-the-teacher: Implemented Teacher module with route group structure, empty pages, RBAC integration, and navigation components

## Current Project Structure

### Admin Pages & Navigation
- **Admin Dashboard** (`/admin/dashboard`) - Metrics, cashflow, capacity overview with quick actions
- **Admin Applications** (`/admin/applications`) - Student application management with search/filters
- **Navigation Pattern**: Reusing dashboard quick actions as persistent navigation bar
- **Layout**: `min-h-screen bg-gray-50/30` with `container mx-auto px-4 py-8` for consistency

### Teacher Pages & Navigation
- **Teacher Dashboard** (`/teacher/dashboard`) - Student metrics and overview (empty state initially)
- **Teacher Students** (`/teacher/students`) - Student roster management (empty state initially)
- **Route Structure**: `app/teacher/` with top navigation bar pattern (same as admin)
- **RBAC**: Middleware enforces Teacher role for all `/teacher/*` routes (Admins also have access for testing/management)
- **Navigation Pattern**: Top navigation bar with responsive mobile menu, consistent with Admin navigation

### Architecture
- **Framework**: Next.js 15 (App Router) with React 19 and TypeScript
- **Database**: PostgreSQL with Drizzle ORM, multi-tenant scoped by school/team
- **UI**: shadcn/ui components + Tailwind CSS for consistent design system
- **Auth**: JWT-based with RBAC (Admin/Teacher/Parent roles)
- **Testing**: React Testing Library + Playwright for E2E

### Key Components
- **Applications List**: Server-side with async searchParams handling (Next.js 15 requirement)
- **Dashboard Metrics**: Real-time school analytics with capacity utilization
- **Quick Actions**: Card-based navigation pattern being converted to persistent header
- **Responsive Design**: Mobile/desktop layouts with hamburger menu patterns

### Database Schema Highlights
```typescript
// Recently fixed schema conflicts
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id').references(() => teams.id),
  status: applicationStatusEnum('status').default('PENDING'),
  // ... child and parent information fields
});

export const adminAccessLogs = pgTable('admin_access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: integer('school_id').references(() => teams.id),
  adminUserId: integer('admin_user_id').references(() => users.id),
  actionType: accessLogActionEnum('action_type'),
  // ... audit trail fields
});
```

### Current Feature: Admin Navigation Bar
**Goal**: Extract dashboard quick actions pattern into reusable navigation component
**Requirements**: 
- Position as topmost header on all admin pages
- Support Dashboard, Applications, Enrollments, Payments, Reports
- Show "Coming Soon" placeholders for unimplemented pages
- Maintain responsive design and existing page functionality
- Handle authorization with redirect to login for unauthorized users

### Constitutional Principles
- **Micro Functions**: Keep components small and focused
- **Client Directive**: Use `'use client'` only on interactive child components  
- **Component Reuse**: Check existing components before creating new ones
- **Multi-Tenant Security**: All queries scoped by school/team, RBAC enforced
- **No Hardcoding**: Use constants/enums for configurable values

### Development Patterns
- **Async Components**: Page components that use searchParams must be async and await params
- **Layout Structure**: Consistent container/padding patterns across admin pages
- **Error Handling**: Proper TypeScript error handling with user-friendly messages
- **Performance**: Server-first rendering with client interactivity where needed

## Files to Know
- `app/admin/dashboard/page.tsx` - Main admin dashboard with quick actions pattern
- `app/admin/applications/page.tsx` - Applications management with search/filtering
- `app/(dashboard)/dashboard/layout.tsx` - Sidebar navigation pattern for regular dashboard
- `app/teacher/dashboard/page.tsx` - Teacher dashboard with empty state and top navigation
- `app/teacher/students/page.tsx` - Student roster with empty state and top navigation
- `components/teacher/teacher-navigation.tsx` - Teacher top navigation bar component
- `lib/db/schema.ts` - Database schema with applications, adminAccessLogs, etc.
- `lib/constants/teacher-routes.ts` - Teacher route and navigation constants
- `lib/types/teacher.ts` - Teacher module type definitions
- `middleware.ts` - RBAC middleware with Teacher route protection

## Active Branch
Currently on branch `012-initialize-the-teacher` with Teacher module implementation complete.

---
*Last Updated: 2025-09-26 | Constitution v1.0.0 | Agent: Claude*
