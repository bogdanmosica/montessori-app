'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Eye, Copy } from 'lucide-react';
import { LESSON_CATEGORIES } from '@/lib/constants/lessons';

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: 'admin_global' | 'teacher_private';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number | null;
};

type LessonsTableProps = {
  lessons: Lesson[];
  userRole: string;
  basePath?: string;
};

export function LessonsTable({
  lessons,
  userRole,
  basePath = '/admin/lessons',
}: LessonsTableProps) {
  const router = useRouter();

  const handleView = (lessonId: string) => {
    router.push(`${basePath}/${lessonId}`);
  };

  const handleEdit = (lessonId: string) => {
    router.push(`${basePath}/${lessonId}/edit`);
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lesson');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    }
  };

  const handleClone = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/clone`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to clone lesson');
      }

      router.refresh();
    } catch (error) {
      console.error('Error cloning lesson:', error);
      alert('Failed to clone lesson');
    }
  };

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

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No lessons found. Create your first lesson to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((lesson) => (
            <TableRow key={lesson.id}>
              <TableCell className="font-medium">{lesson.title}</TableCell>
              <TableCell>{lesson.category}</TableCell>
              <TableCell>{getDifficultyBadge(lesson.difficultyLevel)}</TableCell>
              <TableCell>
                {lesson.estimatedDuration
                  ? `${lesson.estimatedDuration} min`
                  : '-'}
              </TableCell>
              <TableCell>{getVisibilityBadge(lesson.visibility)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(lesson.id)}
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(lesson.id)}
                    title="Edit lesson"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {lesson.visibility === 'admin_global' && userRole === 'teacher' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleClone(lesson.id)}
                      title="Clone lesson"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(lesson.id)}
                    title="Delete lesson"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
