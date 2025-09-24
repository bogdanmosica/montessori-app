# Research: Admin Applications Management

**Date**: 2025-09-24  
**Context**: Implementation research for `/admin/applications` page in montessori-app  
**Focus**: Multi-step approval workflow, server-side pagination, Next.js patterns, and UI components

## Research Tasks

### 1. Multi-step Approval Workflow with Database Atomicity

**Decision**: Use Drizzle ORM transactions with error boundary patterns and rollback mechanisms.

**Rationale**: 
- Application approval requires creating multiple related records (parent account, child record, enrollment)
- Atomic operations ensure data consistency - if any step fails, all changes are rolled back
- Drizzle ORM's transaction API provides type safety and clean error handling
- Error boundaries prevent partial states that could corrupt the application workflow

**Implementation Pattern**:
```typescript
await db.transaction(async (tx) => {
  // 1. Create parent user account
  const parentUser = await tx.insert(users).values(parentData).returning();
  
  // 2. Create child record linked to parent
  const child = await tx.insert(children).values({
    ...childData,
    parentId: parentUser[0].id
  }).returning();
  
  // 3. Create enrollment record
  await tx.insert(enrollments).values({
    childId: child[0].id,
    parentId: parentUser[0].id,
    programId: application.programId,
    status: 'active'
  });
  
  // 4. Update application status
  await tx.update(applications)
    .set({ status: 'approved', approvedAt: new Date(), approvedBy: adminId })
    .where(eq(applications.id, applicationId));
});
```

**Alternatives Considered**:
- Individual sequential operations: Rejected due to risk of partial failures
- Saga pattern: Overkill for simple CRUD operations, adds complexity
- Event-driven approach: Too complex for current requirements

### 2. Server-side Pagination with Drizzle ORM

**Decision**: Use offset/limit pagination with count query for total records, implement search as additional WHERE clauses.

**Rationale**:
- Server-side pagination reduces memory usage and improves performance
- Offset/limit is simple to implement and understand
- Count query provides total for pagination UI
- WHERE clause filtering integrates naturally with pagination
- Next.js searchParams make URL state management seamless

**Implementation Pattern**:
```typescript
const getApplications = async (searchParams: {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}) => {
  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '10');
  const offset = (page - 1) * limit;

  let query = db.select().from(applications)
    .where(eq(applications.schoolId, currentSchoolId));

  if (searchParams.status) {
    query = query.where(eq(applications.status, searchParams.status));
  }
  
  if (searchParams.search) {
    query = query.where(
      or(
        ilike(applications.parentName, `%${searchParams.search}%`),
        ilike(applications.childName, `%${searchParams.search}%`)
      )
    );
  }

  const [results, totalCount] = await Promise.all([
    query.limit(limit).offset(offset),
    db.select({ count: count() }).from(applications).where(/* same conditions */)
  ]);

  return { results, totalCount: totalCount[0].count, page, limit };
};
```

**Alternatives Considered**:
- Cursor-based pagination: More complex, not needed for admin interface
- Client-side pagination: Poor performance with large datasets
- Infinite scroll: Not appropriate for admin table interface

### 3. Next.js App Router Patterns for Admin-Scoped Routes

**Decision**: Use middleware for admin authentication, server components for data fetching, and URL searchParams for filter state.

**Rationale**:
- Middleware provides global admin authentication enforcement
- Server components reduce client bundle and improve initial load time
- searchParams preserve filter/pagination state in URL for bookmarking
- Route groups organize admin pages without affecting URL structure

**Implementation Pattern**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token');
    if (!token || !isAdminToken(token)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
}

// app/admin/applications/page.tsx (Server Component)
interface PageProps {
  searchParams: { page?: string; status?: string; search?: string };
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const { results, totalCount, page, limit } = await getApplications(searchParams);
  
  return (
    <div className="space-y-4">
      <ApplicationFilters />
      <ApplicationsTable applications={results} />
      <Pagination
        currentPage={page}
        totalPages={Math.ceil(totalCount / limit)}
        totalItems={totalCount}
      />
    </div>
  );
}
```

**Alternatives Considered**:
- Client-side authentication: Security risk, not suitable for admin routes
- useState for filters: Loses state on refresh, poor UX
- Route-level authentication: More complex, middleware is cleaner

### 4. shadcn/ui Table Component Patterns with Filtering and Sorting

**Decision**: Use shadcn/ui Table component with server-side sorting and filtering, implement search with debounced input.

**Rationale**:
- shadcn/ui Table provides consistent styling with existing design system
- Server-side operations maintain performance with large datasets
- Debounced search prevents excessive API calls
- URL state management preserves user context

**Implementation Pattern**:
```typescript
// components/ApplicationsTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ApplicationsTableProps {
  applications: Application[];
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Parent Name</TableHead>
          <TableHead>Child Name</TableHead>
          <TableHead>Application Date</TableHead>
          <TableHead>Program</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow key={application.id}>
            <TableCell>{application.parentName}</TableCell>
            <TableCell>{application.childName}</TableCell>
            <TableCell>{formatDate(application.createdAt)}</TableCell>
            <TableCell>{application.program}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(application.status)}>
                {application.status}
              </Badge>
            </TableCell>
            <TableCell>
              <ApplicationActions application={application} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Alternatives Considered**:
- Custom table implementation: More work, inconsistent with design system
- Client-side DataTable: Bundle size concerns, complexity overkill
- Third-party table libraries: Adds dependencies, styling conflicts

## Technology Stack Validation

### Database Schema Requirements
- Applications table with proper indexing for search and filtering
- Foreign key relationships to maintain data integrity
- Multi-tenant scoping with schoolId column
- Audit fields for tracking approval actions

### Integration with Existing Auth Middleware
- Leverage existing Auth.js implementation
- Extend middleware to handle admin-specific routes
- Reuse session management and RBAC patterns
- Maintain compatibility with existing user roles

### Performance Optimization Strategies
- Database indexing on frequently queried columns (status, schoolId, createdAt)
- Efficient pagination with LIMIT/OFFSET
- Parallel execution of count and data queries
- Caching consideration for relatively static data

## Architectural Decisions Summary

1. **Approval Workflow**: Database transactions ensure atomicity
2. **Pagination**: Server-side with URL state management
3. **Authentication**: Middleware enforcement with existing Auth.js
4. **UI Components**: shadcn/ui table with consistent styling
5. **Data Fetching**: Server components for initial load performance
6. **Search/Filter**: Server-side with debounced client input

## Next Steps

All research tasks completed. Ready to proceed to Phase 1: Design & Contracts phase to create detailed data models, API contracts, and test scenarios based on these research findings.