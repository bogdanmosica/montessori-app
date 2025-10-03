# Research: Teacher Progress Board

## Technical Decisions

### Drag and Drop Implementation
**Decision**: Use React DnD with HTML5 backend for drag-and-drop functionality  
**Rationale**: 
- Native HTML5 drag-and-drop provides accessibility support
- React DnD integrates well with React Server Components (only client components need interactivity)
- Supports touch devices for mobile tablet usage in classrooms
- Established library with good TypeScript support
**Alternatives considered**: 
- @dnd-kit: More modern but larger bundle size
- Native HTML5 drag-and-drop: Less React integration
- Custom implementation: Too complex for this scope

### Real-time Updates Architecture
**Decision**: Implement optimistic updates with server validation  
**Rationale**:
- Immediate UI feedback for better UX during drag operations
- Server validation ensures data consistency and multi-tenant security
- Rollback mechanism for failed operations
- Works well with existing Next.js API routes pattern
**Alternatives considered**:
- WebSocket real-time sync: Overkill for current scope, adds complexity
- Polling updates: Poor UX during active dragging
- Server-only updates: Too slow for drag-and-drop interactions

### Card Locking Strategy
**Decision**: Implement database-level locks with TTL (time-to-live) expiration  
**Rationale**:
- Prevents concurrent modification conflicts
- TTL prevents stuck locks from user disconnections
- Minimal performance impact using database indexes
- Supports multi-server deployment scenarios
**Alternatives considered**:
- In-memory locks: Don't work across multiple server instances
- User session locks: Complex session management
- No locking: Data corruption risk

### Column Configuration Storage
**Decision**: Store column templates in database with admin management interface  
**Rationale**:
- Allows per-school customization of progress workflows
- Admin control maintains consistency within schools
- Database normalization with template inheritance
- Future-proof for additional column metadata (colors, validation rules)
**Alternatives considered**:
- Hardcoded columns: Not flexible enough for different school workflows
- Per-teacher configuration: Too complex, inconsistent within schools
- Configuration files: Deployment complexity, not tenant-aware

### Multi-tenant Data Scoping
**Decision**: Implement school-scoped queries with middleware enforcement  
**Rationale**:
- Every query automatically includes school context from authenticated session
- Middleware-level enforcement prevents bypass attempts
- Database indexes on school_id for query performance
- Audit logging captures all cross-tenant access attempts
**Alternatives considered**:
- Application-level scoping: More error-prone, easier to bypass
- Database-level RLS: PostgreSQL Row Level Security adds query complexity
- Separate databases: Operational complexity, harder to manage

### Performance Optimization Strategy
**Decision**: Implement batch operations and optimistic caching  
**Rationale**:
- Batch drag operations to reduce API calls during rapid card movements
- Cache lesson metadata to avoid repeated queries
- Server-side pagination for large card sets
- Lazy loading for off-screen column content
**Alternatives considered**:
- Individual API calls: Too chatty for drag-and-drop scenarios
- Client-side pagination: Poor UX for continuous scrolling
- No caching: Unnecessary database load

## Implementation Patterns

### Component Architecture
- Server components for initial data loading and static layout
- Client components only for drag-and-drop interaction layers
- Shared state management using React Context for drag state
- Event handlers bubble up to parent components for API calls

### Database Schema Approach
- `lesson_progress` table with composite indexes on (school_id, teacher_id, status)
- `lesson_templates` for admin-configured lesson definitions
- `progress_columns` for admin-configured column templates
- Foreign key constraints maintain referential integrity

### API Design Pattern
- RESTful endpoints following existing project conventions
- Batch update endpoints for drag-and-drop operations
- Optimistic locking using version timestamps
- Consistent error response format with rollback instructions

### Testing Strategy
- Unit tests for drag-and-drop logic and state management
- Integration tests for API endpoints with multi-tenant scenarios
- E2E tests for complete drag-and-drop workflows
- Performance tests for concurrent user scenarios

## Risk Mitigation

### Concurrent Access Handling
- Database locks prevent data corruption
- UI feedback shows when cards are locked by other users
- Automatic lock expiration prevents permanent blocking
- Conflict resolution with user notification

### Performance Under Load
- Database query optimization with proper indexing
- Pagination and lazy loading for large datasets
- Connection pooling for database efficiency
- Caching strategy for frequently accessed data

### Accessibility Compliance
- Keyboard navigation support for drag-and-drop
- Screen reader support with ARIA labels
- High contrast mode compatibility
- Touch device support for tablet usage

### Data Consistency
- Transactional updates for related data changes
- Validation at both client and server levels
- Audit trail for all progress changes
- Backup and recovery procedures for data integrity