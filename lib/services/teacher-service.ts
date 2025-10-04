import { db } from '@/lib/db';
import { teachers, teacherStudentAssignments, children, users } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, sql, inArray } from 'drizzle-orm';
import type { Teacher, NewTeacher } from '@/lib/db/schema/teachers';

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

/**
 * Admin Teacher Management Service
 */
export class TeacherService {
  /**
   * Get all teachers for a school with student counts
   */
  static async getTeachers(
    schoolId: number,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      includeInactive?: boolean;
      includeStudentDetails?: boolean;
    }
  ) {
    const { page = 1, limit = 20, search, includeInactive = true, includeStudentDetails = false } = options || {};
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [eq(teachers.schoolId, schoolId)];

    if (!includeInactive) {
      conditions.push(eq(teachers.isActive, true));
    }

    // Build search condition if provided
    let searchCondition;
    if (search && search.trim()) {
      const searchPattern = `%${search.toLowerCase()}%`;
      searchCondition = or(
        ilike(users.name, searchPattern),
        ilike(users.email, searchPattern)
      );
    }

    // Get teachers with user info and student counts
    const teachersData = await db
      .select({
        id: teachers.id,
        userId: teachers.userId,
        wage: teachers.wage,
        nationality: teachers.nationality,
        isActive: teachers.isActive,
        createdAt: teachers.createdAt,
        updatedAt: teachers.updatedAt,
        userName: users.name,
        userEmail: users.email,
        studentCount: sql<number>`COALESCE(COUNT(DISTINCT ${teacherStudentAssignments.studentId}), 0)`,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .leftJoin(
        teacherStudentAssignments,
        and(
          eq(teachers.id, teacherStudentAssignments.teacherId),
          eq(teacherStudentAssignments.isActive, true)
        )
      )
      .where(searchCondition ? and(...conditions, searchCondition) : and(...conditions))
      .groupBy(teachers.id, users.id)
      .orderBy(desc(teachers.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${teachers.id})` })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(searchCondition ? and(...conditions, searchCondition) : and(...conditions));

    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // If student details are requested, fetch them for each teacher
    let teachersWithDetails = teachersData.map(t => ({
      id: t.id,
      user: {
        id: t.userId,
        name: t.userName || '',
        email: t.userEmail,
      },
      wage: t.wage,
      nationality: t.nationality,
      isActive: t.isActive,
      studentCount: Number(t.studentCount),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      students: [] as Array<{ id: string; firstName: string; lastName: string }>,
      lessonStats: { opened: 0, completed: 0 },
    }));

    if (includeStudentDetails) {
      // Fetch student details for all teachers
      for (const teacher of teachersWithDetails) {
        const assignments = await db.query.teacherStudentAssignments.findMany({
          where: and(
            eq(teacherStudentAssignments.teacherId, teacher.id),
            eq(teacherStudentAssignments.isActive, true)
          ),
          with: {
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          limit: 10, // Limit to avoid performance issues
        });

        teacher.students = assignments.map(a => ({
          id: a.student.id,
          firstName: a.student.firstName,
          lastName: a.student.lastName,
        }));
      }
    }

    return {
      teachers: teachersWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get teacher by ID with assigned students
   */
  static async getTeacherById(teacherId: string, schoolId: number) {
    const teacher = await db.query.teachers.findFirst({
      where: and(
        eq(teachers.id, teacherId),
        eq(teachers.schoolId, schoolId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        studentAssignments: {
          where: eq(teacherStudentAssignments.isActive, true),
          with: {
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return null;
    }

    return {
      teacher: {
        id: teacher.id,
        user: teacher.user,
        wage: teacher.wage,
        nationality: teacher.nationality,
        isActive: teacher.isActive,
        createdAt: teacher.createdAt.toISOString(),
        updatedAt: teacher.updatedAt.toISOString(),
      },
      assignedStudents: teacher.studentAssignments.map(a => ({
        id: a.student.id,
        name: `${a.student.firstName} ${a.student.lastName}`,
        assignedAt: a.assignedAt.toISOString(),
      })),
    };
  }

  /**
   * Create a new teacher
   */
  static async createTeacher(
    data: {
      name: string;
      email: string;
      password: string;
      wage?: number | null;
      nationality?: string | null;
    },
    schoolId: number
  ) {
    // Create user account first
    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        passwordHash: data.password, // Should be hashed before calling this
        role: 'teacher',
      })
      .returning();

    // Create teacher record
    const [teacher] = await db
      .insert(teachers)
      .values({
        userId: user.id,
        schoolId,
        wage: data.wage?.toString(),
        nationality: data.nationality || null,
        isActive: true,
      })
      .returning();

    return {
      id: teacher.id,
      user: {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: 'TEACHER' as const,
      },
      wage: teacher.wage,
      nationality: teacher.nationality,
      isActive: teacher.isActive,
      studentCount: 0,
      createdAt: teacher.createdAt.toISOString(),
      updatedAt: teacher.updatedAt.toISOString(),
    };
  }

  /**
   * Update teacher information
   */
  static async updateTeacher(
    teacherId: string,
    schoolId: number,
    data: {
      name?: string;
      email?: string;
      wage?: number | null;
      nationality?: string | null;
    }
  ) {
    // Get teacher first to verify school ownership
    const teacher = await db.query.teachers.findFirst({
      where: and(
        eq(teachers.id, teacherId),
        eq(teachers.schoolId, schoolId)
      ),
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Update user info if provided
    if (data.name || data.email) {
      await db
        .update(users)
        .set({
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, teacher.userId));
    }

    // Update teacher info
    const [updatedTeacher] = await db
      .update(teachers)
      .set({
        ...(data.wage !== undefined && { wage: data.wage?.toString() || null }),
        ...(data.nationality !== undefined && { nationality: data.nationality }),
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId))
      .returning();

    // Get updated user info and student count
    const result = await db
      .select({
        teacher: teachers,
        user: users,
        studentCount: sql<number>`COALESCE(COUNT(DISTINCT ${teacherStudentAssignments.studentId}), 0)`,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .leftJoin(
        teacherStudentAssignments,
        and(
          eq(teachers.id, teacherStudentAssignments.teacherId),
          eq(teacherStudentAssignments.isActive, true)
        )
      )
      .where(eq(teachers.id, teacherId))
      .groupBy(teachers.id, users.id);

    const updated = result[0];

    return {
      id: updated.teacher.id,
      user: {
        id: updated.user.id,
        name: updated.user.name || '',
        email: updated.user.email,
      },
      wage: updated.teacher.wage,
      nationality: updated.teacher.nationality,
      isActive: updated.teacher.isActive,
      studentCount: Number(updated.studentCount),
      createdAt: updated.teacher.createdAt.toISOString(),
      updatedAt: updated.teacher.updatedAt.toISOString(),
    };
  }

  /**
   * Soft delete teacher (mark as inactive)
   */
  static async deleteTeacher(teacherId: string, schoolId: number) {
    // Verify teacher belongs to school
    const teacher = await db.query.teachers.findFirst({
      where: and(
        eq(teachers.id, teacherId),
        eq(teachers.schoolId, schoolId)
      ),
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Soft delete by setting isActive to false
    const [updated] = await db
      .update(teachers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId))
      .returning();

    return {
      id: updated.id,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Get available students for assignment
   */
  static async getAvailableStudents(schoolId: number, teacherId?: string) {
    // Get all active students in the school
    const allStudents = await db.query.children.findMany({
      where: and(
        eq(children.schoolId, schoolId),
        eq(children.enrollmentStatus, 'ACTIVE')
      ),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!teacherId) {
      return allStudents.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
      }));
    }

    // Get assigned students for this teacher
    const assignments = await db.query.teacherStudentAssignments.findMany({
      where: and(
        eq(teacherStudentAssignments.teacherId, teacherId),
        eq(teacherStudentAssignments.isActive, true)
      ),
      columns: {
        studentId: true,
      },
    });

    const assignedIds = new Set(assignments.map(a => a.studentId));

    return allStudents.map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      isAssignedToTeacher: assignedIds.has(s.id),
    }));
  }

  /**
   * Assign students to teacher
   */
  static async assignStudents(
    teacherId: string,
    studentIds: string[],
    schoolId: number
  ) {
    // Verify teacher belongs to school
    const teacher = await db.query.teachers.findFirst({
      where: and(
        eq(teachers.id, teacherId),
        eq(teachers.schoolId, schoolId)
      ),
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Verify all students belong to school
    const students = await db.query.children.findMany({
      where: and(
        eq(children.schoolId, schoolId),
        inArray(children.id, studentIds)
      ),
    });

    if (students.length !== studentIds.length) {
      throw new Error('Some students not found in school');
    }

    // Create assignments (ignore duplicates)
    const assignments = await db
      .insert(teacherStudentAssignments)
      .values(
        studentIds.map(studentId => ({
          teacherId,
          studentId,
          isActive: true,
        }))
      )
      .onConflictDoNothing()
      .returning();

    return assignments.map(a => ({
      id: a.id,
      teacherId: a.teacherId,
      studentId: a.studentId,
      studentName: students.find(s => s.id === a.studentId)?.firstName + ' ' +
                   students.find(s => s.id === a.studentId)?.lastName,
      assignedAt: a.assignedAt.toISOString(),
    }));
  }

  /**
   * Remove student assignment from teacher
   */
  static async removeAssignment(
    teacherId: string,
    studentId: string,
    schoolId: number
  ) {
    // Verify teacher belongs to school
    const teacher = await db.query.teachers.findFirst({
      where: and(
        eq(teachers.id, teacherId),
        eq(teachers.schoolId, schoolId)
      ),
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Soft delete assignment
    await db
      .update(teacherStudentAssignments)
      .set({
        isActive: false,
      })
      .where(
        and(
          eq(teacherStudentAssignments.teacherId, teacherId),
          eq(teacherStudentAssignments.studentId, studentId)
        )
      );

    return { success: true };
  }
}
