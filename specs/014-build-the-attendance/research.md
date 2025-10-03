# Research: Attendance & Daily Logs Implementation

## Technical Decisions & Rationale

### Database Schema Design
**Decision**: Single `attendance` table with JSON notes field  
**Rationale**: Simplified data model aligns with free-form notes requirement from clarifications. JSON field provides flexibility for future structured note categories while maintaining performance for current use case.  
**Alternatives considered**: Separate notes table, structured fields (meals/naps/behavior) - rejected due to clarified requirement for single free-form text field.

### Co-Teaching Consensus Workflow
**Decision**: Status-based state machine with pending/confirmed states  
**Rationale**: Clarification requires consensus from all assigned teachers. Implementation uses `status` enum with `pending_present`, `pending_absent`, `confirmed_present`, `confirmed_absent` to track consensus workflow.  
**Alternatives considered**: Separate approval table, notification system - rejected for complexity vs. requirement scope.

### Backdated Entry Support
**Decision**: No date restrictions on attendance entry with audit trail  
**Rationale**: Clarification allows indefinite backdated entries with teacher permissions. Audit trail maintained through standard `created_at`, `updated_at` timestamps.  
**Alternatives considered**: Date validation, approval workflow for backdated entries - rejected per clarification decision.

### Component Architecture
**Decision**: Server-first with minimal client components  
**Rationale**: Follows montessori-app Constitution for server components by default. Only attendance toggles and notes form require client interactivity.  
**Alternatives considered**: Full client-side page - rejected per constitutional requirements.

### API Design Pattern
**Decision**: RESTful endpoints following existing montessori-app patterns  
**Rationale**: Consistency with existing Teacher module APIs. Standard CRUD operations align with attendance data lifecycle.  
**Alternatives considered**: GraphQL, bulk operations - rejected for consistency with existing codebase patterns.

### Multi-Tenant Security Implementation
**Decision**: Middleware-based tenant scoping with query-level enforcement  
**Rationale**: Follows existing montessori-app RBAC patterns. Teacher ID extraction from session ensures automatic tenant scoping.  
**Alternatives considered**: Application-level filtering - rejected for security concerns per constitutional requirements.

### Data Retention Strategy
**Decision**: Passive retention with metadata flags for compliance  
**Rationale**: Seven-year retention requirement from clarifications. Metadata approach allows compliance tracking without complex archival systems.  
**Alternatives considered**: Active archival system, external storage - rejected for implementation complexity vs. current business needs.

## Integration Points Identified

### Existing Services to Reuse
- **Student Roster Service**: Located in `lib/services/enrollment.ts` - provides teacher's assigned students
- **RBAC Middleware**: Located in `middleware.ts` - handles Teacher role enforcement
- **Database Connection**: Located in `lib/db.ts` - Drizzle ORM setup
- **UI Components**: Located in `components/ui/` - shadcn/ui components for consistent design

### Navigation Integration
- **Teacher Layout**: Add attendance link to existing teacher navigation in `app/teacher/layout.tsx`
- **Route Protection**: Leverage existing teacher route protection in `middleware.ts`

### Database Schema Extensions
- **New Table**: `attendance` table to be added to existing Drizzle schema
- **Relationships**: Foreign keys to existing `users` (teachers) and `children` (students) tables
- **Indexes**: Performance indexes for common queries (date ranges, teacher scoping)

## Performance Considerations

### Query Optimization
- **Batch Queries**: Single query to fetch students with attendance status for date
- **Indexes**: Composite indexes on (teacher_id, date) and (student_id, date)
- **Caching**: Server-side caching for student roster data that changes infrequently

### UI Responsiveness
- **Optimistic Updates**: Client-side state updates before server confirmation
- **Debounced Saves**: Prevent excessive API calls during rapid note editing
- **Loading States**: Proper loading indicators for attendance toggles and form submissions

## Security & Compliance

### Data Protection
- **Tenant Isolation**: All queries automatically scoped by teacher's school/team
- **Access Logging**: All attendance modifications logged to `access_logs` table
- **Session Validation**: Teacher role verification on every API request

### Audit Trail
- **Change Tracking**: Created/updated timestamps on all attendance records
- **User Attribution**: Teacher ID stored with every attendance entry
- **Retention Compliance**: Seven-year retention metadata for regulatory requirements

## Technology Stack Validation

### Next.js 15 App Router
- **Server Components**: Attendance roster display, initial data fetching
- **Client Components**: Interactive toggles, notes form, optimistic updates
- **API Routes**: RESTful endpoints following existing patterns

### Drizzle ORM Integration
- **Schema Extensions**: New attendance table with proper relationships
- **Type Safety**: Full TypeScript integration with existing database types
- **Query Performance**: Leveraging existing connection pooling and optimization

### shadcn/ui Components
- **Existing Components**: Button, Input, Textarea, Table for attendance interface
- **Custom Components**: AttendanceToggle, NotesDialog for feature-specific interactions
- **Consistent Styling**: Tailwind CSS following existing design system