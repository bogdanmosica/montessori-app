# Middleware Contract: Route Protection

## Middleware Execution

**Trigger**: All requests matching `/admin/*` pattern

**Flow**:
1. Extract session from Auth.js
2. Validate user authentication 
3. Check user role against route requirements
4. Log access attempt to access_logs table
5. Allow access or redirect to `/unauthorized`

## Session Validation Contract

**Input**: Request with session cookie/token

**Processing**:
```typescript
interface MiddlewareValidation {
  isAuthenticated: boolean
  user?: {
    id: string
    role: 'parent' | 'teacher' | 'admin'
    teamId: string
    sessionVersion: number
  }
  hasRequiredRole: boolean
  route: string
}
```

**Output Scenarios**:

### Success Case
- **Condition**: Authenticated Admin user accessing `/admin/*`
- **Action**: `NextResponse.next()` (continue to page)
- **Side Effect**: Log success access attempt

### Unauthorized Role
- **Condition**: Authenticated non-Admin user accessing `/admin/*`
- **Action**: `NextResponse.redirect('/unauthorized')`
- **Side Effect**: Log failed access attempt

### Unauthenticated
- **Condition**: No valid session accessing `/admin/*`
- **Action**: `NextResponse.redirect('/sign-in')`
- **Side Effect**: Log failed access attempt

### Session Version Mismatch
- **Condition**: User token sessionVersion < database sessionVersion
- **Action**: `NextResponse.redirect('/sign-in')` (force re-auth)
- **Side Effect**: Clear session, log session invalidation

## Access Logging Contract

**Log Entry Creation**:
```typescript
interface AccessLogEntry {
  userId: string | null  // null for unauthenticated attempts
  teamId: string | null  // inherited from user
  route: string          // requested path
  success: boolean       // access granted/denied
  timestamp: Date        // automatic
  userAgent?: string     // from headers
  ipAddress?: string     // from request
}
```

**Logging Rules**:
- Log ALL attempts to access protected routes
- Include success/failure status
- Maintain tenant isolation (teamId scoping)
- Async logging to prevent blocking requests
- Basic log level (per spec clarification)