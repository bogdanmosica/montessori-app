'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LessonForm } from '../components/lesson-form';
import { CreateLessonInput } from '@/lib/validations/lesson-schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AdminNavigation from '@/components/admin/admin-navigation';

export default function NewLessonPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateLessonInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create lesson');
      }

      const result = await response.json();
      toast.success('Lesson created successfully');
      router.push('/admin/lessons');
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/lessons');
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <LessonForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                userRole="admin"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
