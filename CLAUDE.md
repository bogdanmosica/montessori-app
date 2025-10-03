# Claude Context: Monte SMS - Montessori School Management System

## Recent Changes
- 015-develop-student-profiles: Implemented Student Profiles & Observations feature with full CRUD operations, multi-teacher collaboration, and observation tracking. Added observations table, student profile pages, observation management UI, and teacher-student access validation.
- 014-build-the-attendance: Added TypeScript (strict mode) with Next.js 15 App Router and React 19 + Drizzle ORM, Auth.js, shadcn/ui, Tailwind CSS
- 013-teacher-progress-board: Added TypeScript with Next.js 15 (App Router) and React 19 + Next.js, React, Drizzle ORM, shadcn/ui, Tailwind CSS, Auth.js

## Current Project Structure

### Admin Pages & Navigation
- **Admin Dashboard** (`/admin/dashboard`) - Metrics, cashflow, capacity overview with quick actions
- **Admin Applications** (`/admin/applications`) - Student application management with search/filters
- **Navigation Pattern**: Reusing dashboard quick actions as persistent navigation bar
- **Layout**: `min-h-screen bg-gray-50/30` with `container mx-auto px-4 py-8` for consistency

### Teacher Pages & Navigation
- **Teacher Dashboard** (`/teacher/dashboard`) - Student metrics and overview
- **Teacher Students** (`/teacher/students`) - Student roster with observation counts and profile links
- **Student Profile** (`/teacher/students/[studentId]`) - Detailed student profile with observations management
- **Route Structure**: `app/teacher/` with top navigation bar pattern (same as admin)
- **RBAC**: Middleware enforces Teacher role for all `/teacher/*` routes (Admins also have access for testing/management)
- **Navigation Pattern**: Top navigation bar with responsive mobile menu, consistent with Admin navigation
- **Observation Features**: Create, view, and edit observations for assigned students with multi-teacher collaboration support

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
// Teacher & Student Management
export const teachers = pgTable('teachers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id').references(() => users.id),
  schoolId: integer('school_id').references(() => teams.id),
  // ... teacher details
});

export const teacherStudentAssignments = pgTable('teacher_student_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').references(() => teachers.id),
  studentId: uuid('student_id').references(() => children.id),
  isActive: boolean('is_active').default(true),
  // ... assignment details
});

export const observations = pgTable('observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => children.id),
  teacherId: integer('teacher_id').references(() => users.id),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  // ... no deletion allowed for audit trail
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
### Admin Module
- `app/admin/dashboard/page.tsx` - Main admin dashboard with quick actions pattern
- `app/admin/applications/page.tsx` - Applications management with search/filtering

### Teacher Module
- `app/teacher/dashboard/page.tsx` - Teacher dashboard with metrics
- `app/teacher/students/page.tsx` - Student roster with observation counts and profile navigation
- `app/teacher/students/[studentId]/page.tsx` - Student profile page with observations management
- `app/teacher/students/components/` - Student profile and observation components
- `components/teacher/teacher-navigation.tsx` - Teacher top navigation bar component

### API Routes
- `app/api/teacher/students/route.ts` - GET teacher's assigned students
- `app/api/teacher/students/[studentId]/route.ts` - GET student profile details
- `app/api/teacher/students/[studentId]/observations/route.ts` - GET/POST student observations
- `app/api/teacher/observations/[observationId]/route.ts` - PUT update observation

### Database & Services
- `lib/db/schema.ts` - Main schema with users, teams, children, etc.
- `lib/db/schema/observations.ts` - Observations table schema
- `lib/db/schema/teachers.ts` - Teachers and assignments schema
- `lib/services/observation-service.ts` - Observation CRUD operations
- `lib/services/student-service.ts` - Student queries for teachers
- `lib/auth/teacher-access.ts` - Teacher-student access validation
- `lib/db/queries/observations.ts` - Multi-tenant observation queries

### Constants & Types
- `lib/constants/observations.ts` - Observation limits and messages
- `lib/types/student-types.ts` - Student profile types
- `lib/types/teacher-api-types.ts` - Teacher API response types
- `lib/validations/observation-schemas.ts` - Zod validation schemas
- `middleware.ts` - RBAC middleware with Teacher route protection

## Active Branch
Currently on branch `015-develop-student-profiles` with Student Profiles & Observations feature complete.

---
*Last Updated: 2025-09-26 | Constitution v1.0.0 | Agent: Claude*
