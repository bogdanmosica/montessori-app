# Quickstart: Lessons Management Feature

## Prerequisites
- Next.js 15 (App Router), React 19, TypeScript (strict mode)
- Drizzle ORM, PostgreSQL
- Auth.js for authentication
- shadcn/ui and Tailwind CSS

## Steps
1. Ensure all dependencies are installed (`pnpm install`)
2. Confirm existing lessons module and components are present in `components/` and `app/[role]/lessons/components/`
3. Add new lesson categories or visibility enums to shared constants if needed
4. Implement new API endpoints or extend `/api/lessons` for role-based filtering
5. Reuse existing UI components for list, form, and filter views
6. Enforce RBAC and multi-tenant scoping in all backend logic
7. Log all lesson actions to `access_logs`
8. Skip dedicated testing phase for initial rollout (per user instruction)

## Verification
- Admins and Teachers can add, view, edit, and delete lessons per spec
- Visibility rules enforced for global and private lessons
- Cloning, archiving, and deletion flows work as clarified
- No hardcoded strings; all enums/constants used
