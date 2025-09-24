# Research: Role-Based Access Control Implementation

## TypeScript Enum vs Const for User Roles

**Decision**: Use TypeScript enum for user roles
**Rationale**: 
- Provides compile-time type safety and autocomplete
- Generates both value and reverse mapping for debugging
- Integrates well with Drizzle ORM enum schema types
- Prevents hardcoded string values throughout codebase
**Alternatives considered**: 
- `const` assertions (`as const`) - less feature-rich for this use case
- Plain string literals - violates constitution no-hardcoding principle

## Auth.js Session Extension Pattern

**Decision**: Extend both JWT and session callbacks to include role information
**Rationale**:
- JWT callback stores role in token for stateless authentication
- Session callback makes role available to client-side code
- Follows Auth.js best practices for custom user properties
- Enables role validation without additional DB queries per request
**Alternatives considered**:
- Database session storage - increases latency and DB load
- Context API only - doesn't persist across page refreshes

## Next.js Middleware for Route Protection

**Decision**: Use Next.js middleware.ts for `/admin/*` route protection
**Rationale**:
- Runs at edge before page rendering, optimal performance
- Single point of route protection logic (DRY principle)
- Integrates with Auth.js session management
- Supports both client and server-side route protection
**Alternatives considered**:
- Page-level protection only - less secure, more repetitive
- Custom HOC wrapper - adds client-side bundle size

## Database Schema Extension Strategy

**Decision**: Add `role` field to existing users table using Drizzle migration
**Rationale**:
- Preserves existing user data and relationships
- Follows Drizzle ORM migration best practices
- Enum constraint at DB level prevents invalid values
- Default to 'parent' role aligns with spec clarifications
**Alternatives considered**:
- Separate roles table with foreign key - unnecessary complexity for this scope
- JSON field for roles - doesn't leverage DB enum constraints

## Session Invalidation Implementation

**Decision**: Use session token versioning with middleware validation
**Rationale**:
- Role changes increment user session version in database
- Middleware compares token version to current DB version
- Forces re-authentication on version mismatch (next navigation)
- Balances security with user experience (not immediate kick-out)
**Alternatives considered**:
- Immediate WebSocket-based invalidation - adds complexity
- Time-based expiration only - doesn't handle role changes promptly

## Audit Logging Architecture

**Decision**: Create dedicated `access_logs` table with async logging
**Rationale**:
- Separate concern from main business logic
- Async logging prevents blocking request processing
- Structured data enables compliance reporting
- Tenant-scoped for multi-tenant isolation
**Alternatives considered**:
- File-based logging - harder to query for compliance
- Third-party service - adds external dependency

## Logo Asset Management

**Decision**: Use Next.js public folder with optimized SVG format
**Rationale**:
- SVG scales perfectly across devices and zoom levels
- Small file size for school logo graphics
- Next.js Image component optimization for different displays
- Easy to replace without code changes
**Alternatives considered**:
- PNG/JPG formats - larger file sizes, scaling issues
- External CDN - unnecessary complexity for single logo

## Component Architecture for Unauthorized Page

**Decision**: Create server component with minimal client interactivity
**Rationale**:
- Follows constitution server-first principle
- Unauthorized page doesn't need complex state management
- Better SEO and initial load performance
- Uses existing shadcn/ui components for consistency
**Alternatives considered**:
- Client component - violates constitution guidelines
- Redirect to existing error page - less user-friendly messaging