import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '@/lib/db';
import { attendance, teachers, children, users, teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/session';

/**
 * Teacher Attendance API Tests
 *
 * Tests for /api/teacher/attendance endpoints
 */

describe('Teacher Attendance API', () => {
  let teacherUserId: number;
  let teacherId: number;
  let schoolId: number;
  let studentId: string;
  let authToken: string;

  beforeEach(async () => {
    // Create test school
    const [school] = await db
      .insert(teams)
      .values({
        name: 'Test Montessori School',
      })
      .returning();
    schoolId = school.id;

    // Create teacher user
    const hashedPassword = await hashPassword('testpassword');
    const [teacherUser] = await db
      .insert(users)
      .values({
        email: 'teacher@test.com',
        passwordHash: hashedPassword,
        role: 'teacher',
        name: 'Test Teacher',
      })
      .returning();
    teacherUserId = teacherUser.id;

    // Create teacher record
    const [teacher] = await db
      .insert(teachers)
      .values({
        userId: teacherUserId,
        schoolId: schoolId,
        firstName: 'Test',
        lastName: 'Teacher',
      })
      .returning();
    teacherId = teacher.id;

    // Create test student
    const [student] = await db
      .insert(children)
      .values({
        schoolId: schoolId,
        firstName: 'Test',
        lastName: 'Student',
        dateOfBirth: new Date('2020-01-01'),
        monthlyFee: 100000, // 1000 RON in cents
      })
      .returning();
    studentId = student.id;

    // Mock auth token (in real test, would use proper JWT)
    authToken = 'mock-teacher-token';
  });

  afterEach(async () => {
    // Clean up test data
    if (studentId) {
      await db.delete(attendance).where(eq(attendance.studentId, studentId));
      await db.delete(children).where(eq(children.id, studentId));
    }
    if (teacherId) {
      await db.delete(teachers).where(eq(teachers.id, teacherId));
    }
    if (teacherUserId) {
      await db.delete(users).where(eq(users.id, teacherUserId));
    }
    if (schoolId) {
      await db.delete(teams).where(eq(teams.id, schoolId));
    }
  });

  describe('GET /api/teacher/attendance', () => {
    test('should return attendance data for a specific date', async () => {
      const testDate = '2025-10-03';

      // Create test attendance record
      await db.insert(attendance).values({
        studentId,
        teacherId,
        date: testDate,
        status: 'present',
        notes: 'Test note',
        tenantId: schoolId,
      });

      const response = await fetch(
        `http://localhost:3000/api/teacher/attendance?date=${testDate}`,
        {
          headers: {
            Cookie: `session=${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty('date', testDate);
      expect(data).toHaveProperty('attendanceRecords');
      expect(data).toHaveProperty('studentsWithoutAttendance');
      expect(data).toHaveProperty('metadata');
      expect(data.metadata).toHaveProperty('totalStudents');
      expect(data.metadata).toHaveProperty('recordedAttendance');
      expect(data.metadata).toHaveProperty('pendingConsensus');
    });

    test('should require authentication', async () => {
      const response = await fetch(
        'http://localhost:3000/api/teacher/attendance?date=2025-10-03'
      );

      expect(response.status).toBe(401);
    });

    test('should validate date parameter', async () => {
      const response = await fetch(
        'http://localhost:3000/api/teacher/attendance?date=invalid-date',
        {
          headers: {
            Cookie: `session=${authToken}`,
          },
        }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/teacher/attendance', () => {
    test('should create new attendance record', async () => {
      const testDate = '2025-10-03';
      const requestBody = {
        studentId,
        date: testDate,
        status: 'present',
        notes: 'Student participated well',
      };

      const response = await fetch('http://localhost:3000/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session=${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('studentId', studentId);
      expect(data).toHaveProperty('status', 'present');
      expect(data).toHaveProperty('notes', 'Student participated well');
    });

    test('should prevent duplicate attendance records', async () => {
      const testDate = '2025-10-03';

      // Create first record
      await db.insert(attendance).values({
        studentId,
        teacherId,
        date: testDate,
        status: 'present',
        tenantId: schoolId,
      });

      // Try to create duplicate
      const response = await fetch('http://localhost:3000/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session=${authToken}`,
        },
        body: JSON.stringify({
          studentId,
          date: testDate,
          status: 'absent',
        }),
      });

      expect(response.status).toBe(409);
    });

    test('should validate request body', async () => {
      const response = await fetch('http://localhost:3000/api/teacher/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session=${authToken}`,
        },
        body: JSON.stringify({
          // Missing required fields
          date: '2025-10-03',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/teacher/attendance/[id]', () => {
    test('should update existing attendance record', async () => {
      const testDate = '2025-10-03';

      // Create record
      const [record] = await db
        .insert(attendance)
        .values({
          studentId,
          teacherId,
          date: testDate,
          status: 'present',
          tenantId: schoolId,
        })
        .returning();

      // Update record
      const response = await fetch(
        `http://localhost:3000/api/teacher/attendance/${record.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            status: 'absent',
            notes: 'Called in sick',
          }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty('status', 'absent');
      expect(data).toHaveProperty('notes', 'Called in sick');
    });

    test('should return 404 for non-existent record', async () => {
      const response = await fetch(
        'http://localhost:3000/api/teacher/attendance/00000000-0000-0000-0000-000000000000',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session=${authToken}`,
          },
          body: JSON.stringify({
            status: 'absent',
          }),
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/teacher/attendance/[id]', () => {
    test('should delete attendance record', async () => {
      const testDate = '2025-10-03';

      // Create record
      const [record] = await db
        .insert(attendance)
        .values({
          studentId,
          teacherId,
          date: testDate,
          status: 'present',
          tenantId: schoolId,
        })
        .returning();

      // Delete record
      const response = await fetch(
        `http://localhost:3000/api/teacher/attendance/${record.id}`,
        {
          method: 'DELETE',
          headers: {
            Cookie: `session=${authToken}`,
          },
        }
      );

      expect(response.status).toBe(204);

      // Verify deletion
      const deleted = await db
        .select()
        .from(attendance)
        .where(eq(attendance.id, record.id));

      expect(deleted).toHaveLength(0);
    });

    test('should return 404 for non-existent record', async () => {
      const response = await fetch(
        'http://localhost:3000/api/teacher/attendance/00000000-0000-0000-0000-000000000000',
        {
          method: 'DELETE',
          headers: {
            Cookie: `session=${authToken}`,
          },
        }
      );

      expect(response.status).toBe(404);
    });
  });
});
