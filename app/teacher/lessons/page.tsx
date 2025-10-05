import { Suspense } from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getLessons } from '@/lib/services/lesson-service';
import { LessonsTable } from '@/app/admin/lessons/components/lessons-table';
import { LessonsFilter } from '@/app/admin/lessons/components/lessons-filter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function LessonsContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  if (!session.user.teamId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No school associated with your account</p>
      </div>
    );
  }

  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;

  const lessons = await getLessons(
    session.user.teamId,
    session.user.id,
    session.user.role,
    { category, search }
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lessons</h1>
          <p className="text-muted-foreground mt-1">
            Browse curriculum and create your own lessons
          </p>
        </div>
        <Link href="/teacher/lessons/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Lesson
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <LessonsFilter />
      </div>

      <LessonsTable lessons={lessons} userRole={session.user.role} basePath="/teacher/lessons" />
    </>
  );
}

export default async function TeacherLessonsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading lessons...</div>}>
        <LessonsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
