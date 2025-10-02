import { db } from '@/lib/db';
import { teachers, teacherStudentAssignments, children, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface TeacherDashboardData {
  teacherId: string;
  teacherName: string;
  metrics: {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
  };
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    enrollmentStatus: string;
    classGroup: string | null;
    dateOfBirth: Date;
  }>;
}

/**
 * Get teacher dashboard data by user ID
 */
export async function getTeacherDashboardData(userId: number): Promise<TeacherDashboardData | null> {
  try {
    // Find teacher record
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, userId),
      with: {
        user: true,
      },
    });

    if (!teacher) {
      return null;
    }

    // Get all student assignments for this teacher
    const assignments = await db.query.teacherStudentAssignments.findMany({
      where: and(
        eq(teacherStudentAssignments.teacherId, teacher.id),
        eq(teacherStudentAssignments.isActive, true)
      ),
      with: {
        student: true,
      },
    });

    // Calculate metrics
    const students = assignments.map(a => ({
      id: a.student.id,
      firstName: a.student.firstName,
      lastName: a.student.lastName,
      enrollmentStatus: a.student.enrollmentStatus,
      classGroup: a.classGroup,
      dateOfBirth: a.student.dateOfBirth,
    }));

    const activeStudents = students.filter(s => s.enrollmentStatus === 'ACTIVE').length;
    const inactiveStudents = students.filter(s => s.enrollmentStatus === 'INACTIVE').length;

    return {
      teacherId: teacher.id,
      teacherName: teacher.user.name || teacher.user.email,
      metrics: {
        totalStudents: students.length,
        activeStudents,
        inactiveStudents,
      },
      students,
    };

  } catch (error) {
    console.error('Error fetching teacher dashboard data:', error);
    throw error;
  }
}

/**
 * Get teacher's student roster with optional filters
 */
export async function getTeacherStudentRoster(
  userId: number,
  filters?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
    classGroup?: string;
  }
) {
  try {
    // Find teacher record
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, userId),
    });

    if (!teacher) {
      return null;
    }

    // Get all student assignments
    const assignments = await db.query.teacherStudentAssignments.findMany({
      where: and(
        eq(teacherStudentAssignments.teacherId, teacher.id),
        eq(teacherStudentAssignments.isActive, true)
      ),
      with: {
        student: true,
      },
    });

    let students = assignments.map(a => ({
      id: a.student.id,
      firstName: a.student.firstName,
      lastName: a.student.lastName,
      enrollmentStatus: a.student.enrollmentStatus,
      classGroup: a.classGroup,
      dateOfBirth: a.student.dateOfBirth,
      gender: a.student.gender,
      assignedAt: a.assignedAt,
    }));

    // Apply filters
    if (filters?.status && filters.status !== 'ALL') {
      students = students.filter(s => s.enrollmentStatus === filters.status);
    }

    if (filters?.classGroup) {
      students = students.filter(s => s.classGroup === filters.classGroup);
    }

    // Get unique class groups
    const classGroups = [...new Set(students.map(s => s.classGroup).filter(Boolean))];

    return {
      students,
      classGroups,
      totalCount: students.length,
    };

  } catch (error) {
    console.error('Error fetching teacher student roster:', error);
    throw error;
  }
}
