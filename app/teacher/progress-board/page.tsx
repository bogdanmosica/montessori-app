/**
 * Teacher Progress Board Page
 *
 * Main page component for the Kanban-style lesson progress board
 */

import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getProgressBoardData, getFilterOptions } from '@/lib/services/progress-board-service';
import { ProgressBoardClient } from './components/progress-board-client';
import { db } from '@/lib/db/drizzle';
import { teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProgressBoardPage() {
  // Verify authentication
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  // Verify teacher role
  if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get teacher record to find correct schoolId
  const teacher = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id),
  });

  if (!teacher) {
    redirect('/unauthorized');
  }

  // Fetch initial progress board data
  const columns = await getProgressBoardData(
    teacher.schoolId,
    session.user.id
  );

  // Fetch filter options
  const filterOptions = await getFilterOptions(
    teacher.schoolId,
    session.user.id
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lesson Progress Board</h1>
        <p className="mt-2 text-gray-600">
          Track and manage student lesson progress with drag-and-drop
        </p>
      </div>

      <ProgressBoardClient
        initialColumns={columns}
        filterOptions={filterOptions}
        teacherId={session.user.id}
        schoolId={teacher.schoolId}
      />
    </div>
  );
}
