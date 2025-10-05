import { Suspense } from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getLessonById } from '@/lib/services/lesson-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PageProps = {
  params: Promise<{ id: string }>;
};

async function LessonDetailContent({ lessonId }: { lessonId: string }) {
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

  const lesson = await getLessonById(
    lessonId,
    session.user.teamId,
    session.user.id,
    session.user.role
  );

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lesson not found</p>
        <Link href="/teacher/lessons" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>
        </Link>
      </div>
    );
  }

  const getVisibilityBadge = (visibility: string) => {
    return visibility === 'admin_global' ? (
      <Badge variant="default">Global</Badge>
    ) : (
      <Badge variant="secondary">Private</Badge>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      beginner: 'secondary',
      intermediate: 'default',
      advanced: 'destructive',
    };

    return <Badge variant={variants[difficulty] || 'default'}>{difficulty}</Badge>;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Link href="/teacher/lessons">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>
        </Link>
        {lesson.visibility === 'teacher_private' && (
          <Link href={`/teacher/lessons/${lessonId}/edit`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Lesson
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              <div className="flex gap-2 mt-2">
                {getVisibilityBadge(lesson.visibility)}
                {getDifficultyBadge(lesson.difficultyLevel)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Category</h3>
            <p className="text-muted-foreground">{lesson.category}</p>
          </div>

          {lesson.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {lesson.description}
              </p>
            </div>
          )}

          {lesson.estimatedDuration && (
            <div>
              <h3 className="font-semibold mb-2">Estimated Duration</h3>
              <p className="text-muted-foreground">
                {lesson.estimatedDuration} minutes
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h3 className="font-semibold mb-2">Created</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(lesson.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Last Updated</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(lesson.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default async function TeacherLessonDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading lesson...</div>}>
        <LessonDetailContent lessonId={id} />
      </Suspense>
    </div>
  );
}
