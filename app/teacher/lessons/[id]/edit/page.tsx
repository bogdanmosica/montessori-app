'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LessonForm } from '@/app/admin/lessons/components/lesson-form';
import { CreateLessonInput } from '@/lib/validations/lesson-schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function EditTeacherLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await fetch(`/api/lessons/${lessonId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch lesson');
        }
        const result = await response.json();
        setLesson(result.data);
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast.error('Failed to load lesson');
        router.push('/teacher/lessons');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, router]);

  const handleSubmit = async (data: CreateLessonInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update lesson');
      }

      toast.success('Lesson updated successfully');
      router.push('/teacher/lessons');
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/teacher/lessons');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-muted-foreground">Lesson not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonForm
              defaultValues={{
                title: lesson.title,
                description: lesson.description || '',
                category: lesson.category,
                visibility: lesson.visibility,
                estimatedDuration: lesson.estimatedDuration,
                difficultyLevel: lesson.difficultyLevel,
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              userRole="teacher"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
