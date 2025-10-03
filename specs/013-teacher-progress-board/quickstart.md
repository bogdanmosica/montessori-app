# Quickstart: Teacher Progress Board

## Overview
This quickstart guide walks through the complete Teacher Progress Board feature, from setup to testing all user scenarios from the specification.

## Prerequisites
- Next.js development environment running
- PostgreSQL database with montessori-app schema
- Teacher user account with appropriate permissions
- At least 2 students enrolled in the teacher's school
- Sample lesson data available

## Environment Setup

### 1. Database Migration
Run the new schema migrations:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 2. Seed Sample Data
Create test data for the feature:
```bash
# Run seed script to create:
# - 3 progress columns (Not Started, In Progress, Completed)
# - 5 sample lessons with different categories
# - 2 sample students
# - Initial lesson assignments
pnpm seed:progress-board
```

### 3. Install Dependencies
```bash
pnpm add react-dnd react-dnd-html5-backend
pnpm add -D @types/react-dnd
```

## User Journey Testing

### Journey 1: First-time Access (Empty State)
**Objective**: Verify empty state handling when teacher has no lesson assignments

**Steps**:
1. Login as a teacher with no existing progress data
2. Navigate to `/teacher/progress-board`
3. **Expected**: See empty board with clear instructions on creating first assignment
4. Click "Create First Assignment" button
5. **Expected**: Modal/form opens for lesson assignment creation

**Validation**:
- [ ] Empty state displays instructional content
- [ ] Create assignment action is prominent and accessible
- [ ] No errors or blank screens

### Journey 2: Basic Card Management
**Objective**: Test core CRUD operations for progress cards

**Steps**:
1. Create new lesson assignment:
   - Select lesson: "Addition with Manipulatives"
   - Select student: "John Doe"
   - **Expected**: New card appears in "Not Started" column
2. Create template card (no student assigned):
   - Select lesson: "Letter Recognition"
   - Leave student field empty
   - **Expected**: Card shows "Unassigned" instead of student name
3. Delete a card:
   - Click delete icon on a card
   - Confirm deletion
   - **Expected**: Card disappears, positions rebalance

**Validation**:
- [ ] Cards display correct lesson and student information
- [ ] Template cards show "Unassigned" appropriately
- [ ] Deletion works without affecting other cards
- [ ] New cards appear in correct positions

### Journey 3: Drag and Drop Operations
**Objective**: Test the core Kanban functionality

**Steps**:
1. Drag card from "Not Started" to "In Progress":
   - Grab a card by title bar
   - Drag to "In Progress" column
   - **Expected**: Card moves smoothly, change persists on page refresh
2. Drag card from "In Progress" to "Completed":
   - Perform drag operation
   - **Expected**: Status updates, timestamp changes
3. Drag card back from "Completed" to "In Progress" (correction scenario):
   - **Expected**: Reverse movement works correctly
4. Try dragging multiple cards rapidly:
   - **Expected**: All movements are tracked, no race conditions

**Validation**:
- [ ] Drag operations feel smooth and responsive
- [ ] Card positions persist after page refresh
- [ ] Status transitions are valid (per data model rules)
- [ ] Visual feedback during drag operations

### Journey 4: Filtering and Search
**Objective**: Test board filtering capabilities

**Steps**:
1. Filter by student:
   - Select "John Doe" from student filter
   - **Expected**: Only cards for John Doe are visible
   - Reset filter
   - **Expected**: All cards return
2. Filter by lesson category:
   - Select "Mathematics" category
   - **Expected**: Only math lesson cards are visible
   - Try multiple categories
   - **Expected**: Appropriate cards for each category
3. Combine filters:
   - Select both student and category filters
   - **Expected**: Cards match both criteria

**Validation**:
- [ ] Student filter works correctly
- [ ] Category filter works correctly
- [ ] Combined filters work as expected
- [ ] Filter reset functionality works
- [ ] Filter state is preserved during drag operations

### Journey 5: Concurrent Access (Lock Testing)
**Objective**: Test card locking mechanism for multi-user scenarios

**Steps**:
1. Open two browser sessions as the same teacher
2. In session 1, start dragging a card (hold without dropping)
3. In session 2, try to drag the same card
   - **Expected**: Card shows as locked, drag is prevented
   - **Expected**: Lock indicator is visible
4. Complete drag in session 1
   - **Expected**: Lock releases automatically
   - **Expected**: Session 2 can now interact with the card
5. Test lock expiration:
   - Start drag in session 1, close browser tab
   - Wait 5 minutes
   - **Expected**: Lock expires, card becomes available

**Validation**:
- [ ] Card locking prevents concurrent modifications
- [ ] Lock indicators are clearly visible
- [ ] Locks release after operations complete
- [ ] Lock expiration works correctly
- [ ] Error messages are helpful when locks are encountered

### Journey 6: Performance and Responsiveness
**Objective**: Test system performance under realistic load

**Steps**:
1. Create 50+ lesson assignments for the teacher
2. Test drag operations with large dataset:
   - **Expected**: Drag remains smooth
   - **Expected**: Page load time < 2 seconds
3. Perform rapid drag operations:
   - Move 10 cards quickly between columns
   - **Expected**: All changes are tracked correctly
   - **Expected**: No UI freezing or lag
4. Test filtering with large dataset:
   - Apply various filters with 50+ cards
   - **Expected**: Filtering is immediate
   - **Expected**: Results are accurate

**Validation**:
- [ ] Large datasets load within acceptable time
- [ ] Drag performance remains smooth with many cards
- [ ] Filtering is responsive with large datasets
- [ ] No memory leaks or performance degradation
- [ ] Database queries are optimized (check query performance)

### Journey 7: Error Handling and Edge Cases
**Objective**: Test system resilience and error recovery

**Steps**:
1. Test network interruption:
   - Disable network while dragging a card
   - **Expected**: Graceful error handling, card reverts
   - Re-enable network
   - **Expected**: System recovers, allows retry
2. Test invalid operations:
   - Try creating duplicate lesson-student assignments
   - **Expected**: Clear error message, no duplicate created
3. Test data integrity:
   - Delete a lesson that has progress cards
   - **Expected**: Progress cards are handled appropriately
   - Delete a student with progress cards
   - **Expected**: Cards show appropriate state

**Validation**:
- [ ] Network errors are handled gracefully
- [ ] Duplicate assignments are prevented with clear messaging
- [ ] Data cascading works correctly
- [ ] Error messages are user-friendly
- [ ] System recovers from error states

## API Testing Commands

### Test Progress Board Data Loading
```bash
# Get all progress cards for authenticated teacher
curl -X GET "http://localhost:3000/api/teacher/progress-board" \
  -H "Authorization: Bearer <teacher-jwt-token>" \
  -H "Content-Type: application/json"

# Get filtered progress cards
curl -X GET "http://localhost:3000/api/teacher/progress-board?student_id=<uuid>&category=Mathematics" \
  -H "Authorization: Bearer <teacher-jwt-token>"
```

### Test Card Creation
```bash
# Create assigned lesson card
curl -X POST "http://localhost:3000/api/teacher/progress-board/cards" \
  -H "Authorization: Bearer <teacher-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "<lesson-uuid>",
    "student_id": "<student-uuid>",
    "status": "not_started"
  }'

# Create template card (no student)
curl -X POST "http://localhost:3000/api/teacher/progress-board/cards" \
  -H "Authorization: Bearer <teacher-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lesson_id": "<lesson-uuid>",
    "student_id": null,
    "status": "not_started"
  }'
```

### Test Card Movement
```bash
# Move single card
curl -X PATCH "http://localhost:3000/api/teacher/progress-board/cards/<card-uuid>/move" \
  -H "Authorization: Bearer <teacher-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "new_status": "in_progress",
    "new_position": 0,
    "version": "2025-10-02T10:00:00Z"
  }'

# Batch move cards
curl -X POST "http://localhost:3000/api/teacher/progress-board/batch-move" \
  -H "Authorization: Bearer <teacher-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "moves": [
      {
        "card_id": "<card1-uuid>",
        "new_status": "in_progress",
        "new_position": 0,
        "version": "2025-10-02T10:00:00Z"
      },
      {
        "card_id": "<card2-uuid>",
        "new_status": "completed",
        "new_position": 1,
        "version": "2025-10-02T10:01:00Z"
      }
    ]
  }'
```

### Test Card Locking
```bash
# Lock card
curl -X POST "http://localhost:3000/api/teacher/progress-board/cards/<card-uuid>/lock" \
  -H "Authorization: Bearer <teacher-jwt-token>"

# Unlock card
curl -X DELETE "http://localhost:3000/api/teacher/progress-board/cards/<card-uuid>/lock" \
  -H "Authorization: Bearer <teacher-jwt-token>"
```

## Success Criteria Verification

### Functional Requirements Checklist
- [ ] **FR-001**: Only Teachers can access `/teacher/progress-board` (test with other roles)
- [ ] **FR-002**: Board displays admin-configured column templates
- [ ] **FR-003**: Cards show lesson title, student name (or "Unassigned"), and status
- [ ] **FR-004**: Drag and drop works between columns
- [ ] **FR-005**: Card positions persist immediately
- [ ] **FR-005b**: Card locking prevents concurrent access
- [ ] **FR-006**: Student name filtering works
- [ ] **FR-007**: Lesson category filtering works
- [ ] **FR-008**: Empty state shows helpful instructions
- [ ] **FR-009**: Status change timestamps are tracked
- [ ] **FR-010**: Unauthorized access shows appropriate error
- [ ] **FR-011**: Both admin templates and teacher customizations supported
- [ ] **FR-012**: Teachers can select from column template presets
- [ ] **FR-013**: Template/planning cards (no student assignment) supported

### Performance Benchmarks
- [ ] Initial page load: < 2 seconds with 100 cards
- [ ] Drag operation response: < 200ms
- [ ] Filter application: < 100ms
- [ ] Batch move operation: < 500ms for 10 cards
- [ ] Database query performance: < 100ms for typical queries

### Security Validation
- [ ] Multi-tenant data isolation (teacher only sees their school's data)
- [ ] RBAC enforcement at middleware level
- [ ] All operations logged to access_logs
- [ ] SQL injection prevention (parameterized queries)
- [ ] CSRF protection on state-changing operations

## Troubleshooting Common Issues

### Cards Not Loading
1. Check database connection and migrations
2. Verify teacher has appropriate role and school assignment
3. Check console for JavaScript errors
4. Verify API endpoints are responding correctly

### Drag and Drop Not Working
1. Verify react-dnd dependencies are installed
2. Check for JavaScript errors in browser console
3. Ensure `use client` directive is only on drag components
4. Test with different browsers/devices

### Performance Issues
1. Check database query performance with EXPLAIN
2. Verify proper indexing on query columns
3. Monitor network requests for excessive API calls
4. Check for memory leaks in drag-and-drop operations

### Lock-related Problems
1. Check lock expiration logic is working
2. Verify lock cleanup job is running
3. Test lock release on session end
4. Monitor for stuck locks in database

## Next Steps
After successful quickstart completion:
1. Run full test suite: `pnpm test:progress-board`
2. Review accessibility compliance: `pnpm test:a11y`
3. Performance testing: `pnpm test:performance`
4. Security audit: `pnpm audit`
5. Document any discovered issues for backlog