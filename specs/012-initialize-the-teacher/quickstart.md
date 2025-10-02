# Quickstart: Teacher Module Testing

## Prerequisites
- Montessori-app development environment running
- Test database with sample data
- Teacher user account created with proper role assignment

## Test User Setup

### Create Test Teacher
```sql
-- Insert test teacher user
INSERT INTO users (id, email, first_name, last_name, role, school_id) 
VALUES (
  'teacher-test-001', 
  'teacher@testschool.com', 
  'Jane', 
  'Smith', 
  'TEACHER',
  'school-001'
);

-- Insert teacher record
INSERT INTO teachers (id, user_id, school_id) 
VALUES (
  'teacher-001',
  'teacher-test-001',
  'school-001'
);
```

### Create Test Student Assignments
```sql
-- Insert test students
INSERT INTO students (id, first_name, last_name, enrollment_status, school_id)
VALUES 
  ('student-001', 'Alice', 'Johnson', 'ACTIVE', 'school-001'),
  ('student-002', 'Bob', 'Wilson', 'ACTIVE', 'school-001'),
  ('student-003', 'Carol', 'Davis', 'INACTIVE', 'school-001');

-- Create teacher-student assignments
INSERT INTO teacher_student_assignments (id, teacher_id, student_id, class_group, is_active)
VALUES 
  ('assign-001', 'teacher-001', 'student-001', 'Morning Class', true),
  ('assign-002', 'teacher-001', 'student-002', 'Morning Class', true),
  ('assign-003', 'teacher-001', 'student-003', 'Morning Class', true);
```

## Test Scenarios

### 1. Teacher Authentication & Dashboard Access
**Steps**:
1. Navigate to `/sign-in`
2. Login with teacher credentials
3. Verify redirect to `/teacher/dashboard`
4. Confirm dashboard displays basic metrics

**Expected Results**:
- Successful login redirects to Teacher dashboard
- Dashboard shows student count metrics
- Navigation menu shows Teacher-specific options

### 2. Student Roster Access
**Steps**:
1. From Teacher dashboard, navigate to `/teacher/students`
2. Verify roster displays assigned students
3. Check status indicators for active/inactive students
4. Test filtering by status if implemented

**Expected Results**:
- Roster shows all assigned students (3 total)
- Active students (2) and inactive students (1) clearly marked
- Students from other schools/teachers not visible

### 3. Role-Based Access Control
**Steps**:
1. While logged in as Teacher, attempt to access `/admin/dashboard`
2. Verify redirect to `/unauthorized`
3. Attempt to access other admin routes
4. Logout and login as Admin user
5. Attempt to access `/teacher/dashboard`

**Expected Results**:
- Teacher cannot access Admin routes → redirected to unauthorized
- Admin cannot access Teacher routes → redirected appropriately
- Proper role enforcement at middleware level

### 4. Empty State Handling
**Steps**:
1. Create Teacher with no student assignments
2. Login as this Teacher
3. Navigate to dashboard and student roster
4. Verify empty state messaging

**Expected Results**:
- Dashboard shows zero metrics appropriately
- Student roster displays empty state with admin contact instructions
- No errors thrown for empty data

### 5. Multi-Tenant Data Isolation
**Steps**:
1. Create Teacher in different school
2. Create students in both schools
3. Login as Teacher from school 1
4. Verify only sees students from school 1

**Expected Results**:
- Teacher only sees students from their assigned school
- No data leakage between tenants
- Database queries properly scoped

## API Testing

### Dashboard API
```bash
# Test dashboard endpoint
curl -H "Authorization: Bearer <teacher-jwt>" \
     http://localhost:3000/api/teacher/dashboard

# Expected response
{
  "teacherId": "teacher-001",
  "teacherName": "Jane Smith",
  "metrics": {
    "totalStudents": 3,
    "activeStudents": 2,
    "inactiveStudents": 1
  },
  "lastUpdated": "2025-10-02T10:00:00Z"
}
```

### Student Roster API
```bash
# Test roster endpoint
curl -H "Authorization: Bearer <teacher-jwt>" \
     http://localhost:3000/api/teacher/students

# Expected response
{
  "students": [
    {
      "id": "student-001",
      "firstName": "Alice",
      "lastName": "Johnson",
      "enrollmentStatus": "ACTIVE",
      "classGroup": "Morning Class",
      "assignedAt": "2025-10-01T08:00:00Z",
      "statusUpdatedAt": "2025-10-01T08:00:00Z"
    }
    // ... more students
  ],
  "totalCount": 3,
  "classGroups": ["Morning Class"]
}
```

## Performance Testing

### Page Load Testing
- Dashboard should load in <200ms
- Student roster should load in <300ms
- No unnecessary database queries

### Multi-User Testing
- 10+ Teachers accessing simultaneously
- Database connection pooling working
- No performance degradation

## Integration Testing

### Middleware Integration
```typescript
// Test middleware behavior
describe('Teacher Route Protection', () => {
  it('redirects unauthenticated users to sign-in', async () => {
    const response = await request('/teacher/dashboard');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/sign-in');
  });

  it('redirects non-teachers to unauthorized', async () => {
    const adminToken = await getAdminToken();
    const response = await request('/teacher/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/unauthorized');
  });
});
```

### Database Integration
```typescript
// Test database scoping
describe('Teacher Data Scoping', () => {
  it('only returns students from teacher school', async () => {
    const teacherSession = await getTeacherSession('school-001');
    const students = await getTeacherStudents(teacherSession);
    
    students.forEach(student => {
      expect(student.schoolId).toBe('school-001');
    });
  });
});
```

## Success Criteria

### ✅ Functional Requirements
- [ ] Teacher can login and access dashboard
- [ ] Student roster displays assigned students only  
- [ ] Role-based access control enforced
- [ ] Empty states handled gracefully
- [ ] Multi-tenant data isolation working

### ✅ Performance Requirements
- [ ] Dashboard loads in <200ms
- [ ] Roster loads in <300ms
- [ ] No N+1 query problems
- [ ] Efficient database queries

### ✅ Security Requirements
- [ ] RBAC middleware functioning
- [ ] JWT authentication working
- [ ] Multi-tenant scoping enforced
- [ ] Access logging implemented

### ✅ User Experience
- [ ] Intuitive navigation between pages
- [ ] Clear status indicators
- [ ] Appropriate error messages
- [ ] Responsive design working