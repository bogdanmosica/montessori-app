# Quickstart: Attendance & Daily Logs Testing

## Manual QA Validation Guide

### Prerequisites
- Teacher user account with assigned students
- Development environment running locally
- Access to database for verification
- Browser with developer tools

### Test Scenarios

## Scenario 1: Daily Attendance Flow
**User Story**: Teacher marks attendance for their class on current day

### Setup
1. Login as Teacher user
2. Navigate to `/teacher/attendance`
3. Verify current date is selected by default

### Test Steps
1. **Verify Roster Display**
   - [ ] Class roster loads showing all assigned students
   - [ ] Students display: First Name, Last Name, Profile Info
   - [ ] Attendance toggles show for each student (Present/Absent)
   - [ ] No attendance marked initially (neutral state)

2. **Mark Student Present**
   - [ ] Click "Present" toggle for first student
   - [ ] Toggle updates visually to show selected state
   - [ ] Other students remain unaffected
   - [ ] No API call made yet (optimistic UI)

3. **Mark Student Absent**
   - [ ] Click "Absent" toggle for second student
   - [ ] Toggle updates visually to show selected state
   - [ ] Can change from Present to Absent and vice versa

4. **Add Daily Notes**
   - [ ] Click "Add Notes" for first student
   - [ ] Notes dialog/form opens
   - [ ] Enter free-form text: "Had a great morning, participated in circle time"
   - [ ] Save notes - dialog closes
   - [ ] Visual indicator shows notes exist for student

5. **Save Attendance**
   - [ ] Click "Save Attendance" button
   - [ ] Loading state shown during save
   - [ ] Success message displayed
   - [ ] Page refreshes or updates to show saved state

### Verification
1. **Database Check**
   ```sql
   SELECT * FROM attendance 
   WHERE teacher_id = [TEACHER_ID] AND date = CURRENT_DATE;
   ```
   - [ ] Two records created (one present, one absent)
   - [ ] Notes field populated for first student
   - [ ] Teacher ID matches logged-in user
   - [ ] Tenant ID properly scoped

2. **Page Reload**
   - [ ] Refresh page
   - [ ] Previous attendance selections persist
   - [ ] Notes indicator shows for student with notes
   - [ ] Can edit existing attendance

---

## Scenario 2: Historical Attendance Entry
**User Story**: Teacher enters attendance for a previous date

### Test Steps
1. **Navigate to Previous Date**
   - [ ] Use date picker to select yesterday's date
   - [ ] Roster loads for selected date
   - [ ] No existing attendance shown (clean slate)

2. **Record Backdated Attendance**
   - [ ] Mark students as present/absent
   - [ ] Add notes: "Retroactive entry - confirmed with parent"
   - [ ] Save attendance

### Verification
1. **Database Check**
   ```sql
   SELECT * FROM attendance 
   WHERE teacher_id = [TEACHER_ID] AND date = '[YESTERDAY_DATE]';
   ```
   - [ ] Records created with correct historical date
   - [ ] `created_at` timestamp shows current time (audit trail)

---

## Scenario 3: Co-Teaching Consensus (if applicable)
**User Story**: Multiple teachers need consensus for shared student

### Setup
- Requires student assigned to multiple teachers
- Two teacher accounts for testing

### Test Steps (Teacher 1)
1. **Record Initial Attendance**
   - [ ] Login as first teacher
   - [ ] Mark shared student as "Present"
   - [ ] Status shows as "Pending" (awaiting consensus)
   - [ ] Save attendance

### Test Steps (Teacher 2)
1. **Review Pending Attendance**
   - [ ] Login as second teacher
   - [ ] Navigate to attendance for same date
   - [ ] Shared student shows "Pending Present" status
   - [ ] Option to confirm or change status

2. **Confirm Consensus**
   - [ ] Confirm "Present" status
   - [ ] Status updates to "Confirmed Present"
   - [ ] Both teachers see final status

### Verification
1. **Database Check**
   ```sql
   SELECT * FROM attendance 
   WHERE student_id = '[SHARED_STUDENT_ID]' AND date = CURRENT_DATE;
   ```
   - [ ] Records show consensus workflow completion
   - [ ] Final status is `confirmed_present`

---

## Scenario 4: Empty State Handling
**User Story**: Teacher with no assigned students

### Test Steps
1. **Access with No Students**
   - [ ] Login as teacher with empty class roster
   - [ ] Navigate to `/teacher/attendance`
   - [ ] Empty state message displayed
   - [ ] Appropriate messaging: "No students assigned to your class"
   - [ ] No error states or broken UI

---

## Scenario 5: Error Handling
**User Story**: System handles errors gracefully

### Test Steps
1. **Network Error Simulation**
   - [ ] Mark attendance for students
   - [ ] Disconnect network or block API calls
   - [ ] Attempt to save attendance
   - [ ] Error message displayed appropriately
   - [ ] User can retry operation

2. **Invalid Date Handling**
   - [ ] Manually navigate to `/teacher/attendance?date=invalid`
   - [ ] System handles invalid date gracefully
   - [ ] Redirects to current date or shows error

3. **Permission Verification**
   - [ ] Login as non-teacher user (Parent/Admin)
   - [ ] Attempt to access `/teacher/attendance`
   - [ ] Properly redirected or access denied
   - [ ] No attendance data exposed

---

## Performance Validation

### Load Testing
1. **Large Class Size**
   - [ ] Test with 30+ students in class
   - [ ] Page loads within 2 seconds
   - [ ] Attendance toggles respond quickly
   - [ ] Save operation completes within 5 seconds

2. **Database Performance**
   - [ ] Check query execution time for roster load
   - [ ] Verify indexes are being used effectively
   - [ ] Batch save operations perform well

### UI Responsiveness
1. **Interaction Feedback**
   - [ ] Attendance toggles respond immediately
   - [ ] Loading states shown during API calls
   - [ ] Form validation provides immediate feedback

---

## Security Validation

### Multi-Tenant Isolation
1. **Teacher Scoping**
   - [ ] Teacher can only see their assigned students
   - [ ] Cannot access other teachers' attendance data
   - [ ] URL manipulation doesn't expose other data

2. **Role-Based Access**
   - [ ] Only teachers can access attendance features
   - [ ] API endpoints reject non-teacher requests
   - [ ] Session validation works correctly

### Data Protection
1. **Audit Trail**
   - [ ] All attendance changes logged appropriately
   - [ ] Timestamps accurate for compliance
   - [ ] User attribution correct

---

## Browser Compatibility

### Desktop Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Testing
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design works on tablets

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] Tab order logical

---

## Success Criteria

### Functional Requirements Met
- [ ] Teachers can mark attendance for assigned students
- [ ] Daily notes can be added and edited
- [ ] Attendance persists and can be reviewed
- [ ] Backdated entries work as specified
- [ ] Co-teaching consensus workflow functions (if implemented)

### Non-Functional Requirements Met
- [ ] Page loads within 2 seconds
- [ ] Works on mobile devices
- [ ] Meets accessibility standards
- [ ] Secure multi-tenant data isolation
- [ ] Audit trail maintained for compliance

### User Experience Quality
- [ ] Interface is intuitive for teachers
- [ ] Error messages are helpful
- [ ] Loading states provide feedback
- [ ] Empty states guide user appropriately

## Troubleshooting Common Issues

### Database Connection Errors
```
Check: Database connection pool status
Fix: Restart application or check connection string
```

### Session/Authentication Issues
```
Check: Session cookie validity and role assignment
Fix: Clear cookies and re-login
```

### Missing Students in Roster
```
Check: Teacher-student enrollment relationships
Fix: Verify enrollment records in database
```

### Performance Issues
```
Check: Database query performance and indexing
Fix: Analyze slow queries and optimize indexes
```

---

**Testing Complete**: All scenarios passed = Ready for production deployment