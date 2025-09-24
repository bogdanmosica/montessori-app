# Quickstart: Role-Based Access Control Testing

## Prerequisites
- Next.js development server running (`pnpm dev`)
- PostgreSQL database with migrations applied
- Test users created with different roles

## Test Scenarios

### Scenario 1: Admin Access to Protected Routes
**Given**: User with Admin role signs in  
**When**: Navigate to `/admin/users` or any `/admin/*` route  
**Then**: User should see admin content without redirect  

**Test Steps**:
1. Sign in with admin credentials: `admin@test.com` / `admin123`
2. Navigate to `http://localhost:3000/admin/users`
3. Verify page loads successfully
4. Check browser network tab - no redirect responses
5. Verify access log entry created with `success: true`

### Scenario 2: Non-Admin Redirect to Unauthorized
**Given**: User with Parent or Teacher role signs in  
**When**: Attempt to access any `/admin/*` route  
**Then**: User should be redirected to `/unauthorized` page  

**Test Steps**:
1. Sign in with parent credentials: `parent@test.com` / `parent123`  
2. Navigate to `http://localhost:3000/admin/settings`
3. Verify redirect to `/unauthorized` page
4. Check page displays appropriate unauthorized message
5. Verify access log entry created with `success: false`

### Scenario 3: Role Visibility in Session
**Given**: Any authenticated user  
**When**: Access session context or user profile  
**Then**: User role should be visible and accurate  

**Test Steps**:
1. Sign in with any test user
2. Navigate to `/profile` or make API call to `/api/users/me`
3. Verify role field matches user's assigned role
4. Check browser dev tools session storage/cookies
5. Confirm role persists across page refreshes

### Scenario 4: Role Change Session Invalidation
**Given**: User has active session  
**When**: Admin changes user's role through admin interface  
**Then**: User's session should be invalidated on next navigation  

**Test Steps**:
1. Sign in as teacher: `teacher@test.com` / `teacher123`
2. Open second browser tab, sign in as admin
3. Use admin interface to change teacher's role to parent
4. Return to teacher tab, navigate to any page
5. Verify user is redirected to sign-in (session invalidated)

### Scenario 5: Logo Update Verification  
**Given**: Application is running  
**When**: View any page header/topbar  
**Then**: New school logo should be displayed instead of old logo  

**Test Steps**:
1. Navigate to any application page
2. Inspect topbar/header area  
3. Verify new school logo is displayed
4. Check image source points to updated asset
5. Confirm logo styling matches existing design

## Database Verification

### Check User Roles
```sql
SELECT id, email, name, role, session_version FROM users;
```

### Check Access Logs  
```sql
SELECT * FROM access_logs ORDER BY timestamp DESC LIMIT 10;
```

### Verify Multi-tenant Isolation
```sql  
SELECT team_id, COUNT(*) as log_count FROM access_logs GROUP BY team_id;
```

## API Testing

### Test Role Update Endpoint (Admin only)
```bash
# Update user role (requires admin auth)
curl -X PUT http://localhost:3000/api/users/[user-id]/role \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-session-cookie]" \
  -d '{"role": "teacher"}'
```

### Test Current User Endpoint
```bash
# Get current user profile with role
curl http://localhost:3000/api/users/me \
  -H "Cookie: [auth-session-cookie]"
```

### Test Access Logs Endpoint (Admin only)
```bash
# Get recent access logs
curl http://localhost:3000/api/admin/access-logs?limit=20 \
  -H "Cookie: [admin-auth-session-cookie]"
```

## Performance Validation

### Route Protection Performance
- Middleware execution: < 50ms
- Database role lookup: Only on sign-in, not per request
- Session validation: Memory-based, < 10ms

### Audit Logging Performance  
- Async logging: No request blocking
- Database insert: < 100ms
- Log retention: Configurable cleanup

## Success Criteria Checklist
- [ ] Admin users can access `/admin/*` routes
- [ ] Non-admin users redirected to `/unauthorized`
- [ ] User roles visible in session context
- [ ] Role changes invalidate sessions appropriately  
- [ ] New school logo displayed in topbar
- [ ] Existing design/fonts/colors preserved
- [ ] Access attempts logged with basic detail level
- [ ] Multi-tenant data isolation maintained
- [ ] No hardcoded role strings in implementation
- [ ] Performance targets met (<200ms route protection)