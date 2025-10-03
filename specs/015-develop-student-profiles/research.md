# Research: Student Profiles & Observations

## Technical Decisions

### Database Schema Extension
**Decision**: Extend existing schema with new `observations` table  
**Rationale**: Feature builds on existing `children` and `enrollments` tables, requiring minimal schema changes  
**Alternatives considered**: 
- Separate observations service (rejected - adds complexity)
- Embed observations in existing tables (rejected - violates normalization)

### Multi-Teacher Collaboration Model
**Decision**: Permission-based access where any Teacher with student access can create/edit observations  
**Rationale**: Clarification confirmed collaborative approach for comprehensive student tracking  
**Alternatives considered**:
- Owner-only model (rejected - limits collaboration)
- Class-based permissions (deferred - not specified in requirements)

### Observation Edit Tracking
**Decision**: Track last modification timestamp without full audit history  
**Rationale**: Balance between accountability and system complexity per clarifications  
**Alternatives considered**:
- Full audit trail (rejected - excessive for initial implementation)
- No edit tracking (rejected - lacks accountability)

### Data Deletion Policy
**Decision**: No deletion capability for observations  
**Rationale**: Maintain complete historical record as specified in clarifications  
**Alternatives considered**:
- Soft deletion (rejected - not needed without deletion feature)
- Permanent deletion (rejected - violates audit requirements)

## Technology Integration

### Next.js App Router Patterns
**Decision**: Use server components for data display, client components only for interactive forms  
**Rationale**: Aligns with constitutional client-server boundaries, optimizes performance  
**Implementation**: 
- Student list and profiles as server components
- Observation forms with `use client` for real-time validation

### Drizzle ORM Integration
**Decision**: Extend existing schema with proper foreign key relationships  
**Rationale**: Maintains type safety and leverages existing ORM patterns  
**Schema additions**:
- `observations` table with references to `children` and `users`
- Proper indexing for teacher-student query patterns

### RBAC Integration
**Decision**: Leverage existing middleware and extend for Teacher-specific routes  
**Rationale**: Builds on established security patterns, ensures consistency  
**Implementation**: Route-level protection for `/teacher/students/**` paths

### Component Architecture
**Decision**: Scoped components under `/teacher/students/components/` with shared UI library usage  
**Rationale**: Follows constitutional component organization principles  
**Structure**:
- StudentProfile.tsx (server component)
- ObservationList.tsx (server component)  
- ObservationForm.tsx (client component with `use client`)

## Performance Considerations

### Query Optimization
**Decision**: Batch queries for student lists, individual queries for profiles  
**Rationale**: Balances data freshness with performance for teacher workflows  
**Patterns**:
- Teacher dashboard: Single query for all assigned students
- Student profile: Separate queries for student data and observations
- Paginated observations for students with extensive history

### Caching Strategy
**Decision**: Server-side caching for student lists, real-time data for observations  
**Rationale**: Student assignments change infrequently, observations need immediate visibility  
**Implementation**: Next.js cache for student lists, direct DB queries for observations

## Unknowns Resolved

All technical context items were resolvable from existing montessori-app codebase patterns:
- TypeScript/Next.js patterns established
- Database schema patterns available  
- Authentication/RBAC patterns implemented
- Component organization principles defined
- Testing infrastructure configured

No additional research required for implementation.