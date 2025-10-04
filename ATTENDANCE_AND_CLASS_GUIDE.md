# Attendance & Class Assignment Guide

## Current Status

### ✅ Fixed Issues
1. **Attendance now shows students** - Created missing enrollment records for all active students
2. **Attendance page loads correctly** - Shows all 7 students with Present/Absent buttons

### ⚠️ Remaining Issues

## 1. Class Assignment ("No Class Assigned")

### Problem
Students show "No class assigned" in the teacher dashboard and student lists.

### Root Cause
The `teacherStudentAssignments` table has a `classGroup` field that stores class names, but:
- Seed data doesn't populate this field
- UI displays it but shows "No class assigned" when null

### Database Schema
```typescript
// lib/db/schema/teachers.ts
export const teacherStudentAssignments = pgTable('teacher_student_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').notNull().references(() => teachers.id),
  studentId: uuid('student_id').notNull().references(() => children.id),
  classGroup: varchar('class_group', { length: 100 }), // <-- This field stores class name
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### Solution Options

#### Option A: Quick Fix - Update Seed Data
Update `lib/db/seed.ts` around line 185-192:

```typescript
// Before:
await db.insert(teacherStudentAssignments).values(
  allChildren.map(child => ({
    teacherId: teacher.id,
    studentId: child.id,
    isActive: true,
    assignedAt: new Date(now.getFullYear(), 0, 1),
  }))
);

// After:
await db.insert(teacherStudentAssignments).values(
  allChildren.map((child, index) => ({
    teacherId: teacher.id,
    studentId: child.id,
    isActive: true,
    assignedAt: new Date(now.getFullYear(), 0, 1),
    classGroup: getClassGroupByAge(child.dateOfBirth), // Assign based on age
  }))
);

// Helper function to assign class by age
function getClassGroupByAge(dateOfBirth: Date): string {
  const ageInMonths = Math.floor(
    (new Date().getTime() - dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  if (ageInMonths >= 18 && ageInMonths <= 36) return 'Toddler A';
  if (ageInMonths >= 37 && ageInMonths <= 72) return 'Primary A';
  if (ageInMonths >= 73 && ageInMonths <= 144) return 'Elementary A';
  return 'Mixed Age';
}
```

#### Option B: Create Migration Script
Create `scripts/assign-class-groups.ts`:

```typescript
import { db } from '../lib/db/drizzle';
import { teacherStudentAssignments, children } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function assignClassGroups() {
  const assignments = await db
    .select({
      id: teacherStudentAssignments.id,
      studentId: teacherStudentAssignments.studentId,
      dateOfBirth: children.dateOfBirth,
    })
    .from(teacherStudentAssignments)
    .innerJoin(children, eq(teacherStudentAssignments.studentId, children.id))
    .where(eq(teacherStudentAssignments.classGroup, null));

  for (const assignment of assignments) {
    const ageInMonths = Math.floor(
      (new Date().getTime() - assignment.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    let classGroup = 'Mixed Age';
    if (ageInMonths >= 18 && ageInMonths <= 36) classGroup = 'Toddler A';
    else if (ageInMonths >= 37 && ageInMonths <= 72) classGroup = 'Primary A';
    else if (ageInMonths >= 73 && ageInMonths <= 144) classGroup = 'Elementary A';

    await db
      .update(teacherStudentAssignments)
      .set({ classGroup })
      .where(eq(teacherStudentAssignments.id, assignment.id));
  }

  console.log(`✅ Assigned class groups to ${assignments.length} students`);
}
```

#### Option C: Create Admin UI (Recommended for Production)
Create a class management page at `/admin/classes` with:

1. **Class Management**
   - Create/edit classes (name, age range, capacity)
   - View all classes and their students
   - Assign teachers to classes

2. **Student Assignment**
   - Drag-and-drop students between classes
   - Bulk assign students by age group
   - View students without class assignment

3. **Implementation Files Needed**:
   - `app/admin/classes/page.tsx` - Class list page
   - `app/admin/classes/[classId]/page.tsx` - Class details
   - `app/api/admin/classes/route.ts` - CRUD operations
   - `lib/services/class-service.ts` - Business logic

## 2. Attendance Recording

### Current Implementation
The attendance page displays students and has Present/Absent buttons, but the interaction needs verification.

### Files to Check
- `app/teacher/attendance/page.tsx` - Main attendance page
- `app/teacher/attendance/components/AttendanceTable.tsx` - Table component with buttons
- `app/api/teacher/attendance/route.ts` - API endpoint for recording attendance
- `lib/services/attendance-service.ts` - Business logic

### How to Test Attendance
1. Navigate to `/teacher/attendance` as teacher
2. Click "Present" or "Absent" for a student
3. Check if the UI updates to show the status
4. Verify the "Recorded" count increases
5. Check if notes can be added

### Database Schema
```typescript
// Attendance records stored in:
export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => children.id),
  teacherId: integer('teacher_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  status: attendanceStatusEnum('status').notNull(), // 'present', 'absent', 'excused', 'late'
  notes: text('notes'),
  // ... more fields
});
```

## 3. How to Add/View Attendance List

### Current Flow
1. **Teacher Login** → Navigate to Attendance page
2. **View Today's Roster** → See all assigned students
3. **Mark Attendance** → Click Present/Absent for each student
4. **Add Notes** → Click "Add Notes" to add details
5. **View History** → Use date picker to see past attendance

### Missing Features (if needed)
- Bulk mark all present/absent
- Export attendance reports
- Attendance statistics/trends
- Parent notification on absence
- Late arrival/early dismissal tracking

## Quick Fixes to Run Now

### 1. Assign Class Groups to Existing Students
```bash
# Create and run the script
npx tsx scripts/assign-class-groups.ts
```

### 2. Verify Attendance Works
Test in browser:
1. Login as teacher (teacher@test.com / teacher123)
2. Go to /teacher/attendance
3. Mark a student present
4. Check if status updates

## Summary

### What Works ✅
- Attendance page loads and shows all 7 students
- Present/Absent buttons are displayed
- Date picker allows selecting different dates
- Students with enrollment records appear correctly

### What Needs Fixing ⚠️
- Class assignment is null (shows "No class assigned")
- Need to verify attendance recording actually saves to database

### Recommended Next Steps
1. Run the class assignment migration script (Option B above)
2. Test attendance recording end-to-end
3. Consider building admin UI for class management (Option C)
4. Update seed data to include class groups by default
