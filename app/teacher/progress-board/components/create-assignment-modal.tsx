'use client';

/**
 * Create Assignment Modal
 *
 * Modal for creating new lesson assignments
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { StudentMultiSelect } from './student-multi-select';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (card: any) => void;
  schoolId: number;
  teacherId: number;
  filterOptions: {
    students: Array<{ id: string; name: string }>;
    categories: string[];
  };
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  schoolId,
  teacherId,
  filterOptions,
}: CreateAssignmentModalProps) {
  const [lessons, setLessons] = useState<Array<{ id: string; title: string; category: string }>>([]);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]); // Changed to array
  const [status, setStatus] = useState<string>('not_started');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch lessons when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLessons();
    }
  }, [isOpen]);

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/teacher/lessons');
      const data = await response.json();
      
      if (data.success) {
        setLessons(data.data.map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          category: lesson.category,
        })));
      } else {
        console.error('Failed to fetch lessons:', data.error);
        setError('Failed to load lessons');
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setError('Failed to load lessons');
    }
  };

  const handleSubmit = async () => {
    if (!selectedLesson) {
      setError('Please select a lesson');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/teacher/progress-board/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: selectedLesson,
          student_ids: selectedStudents.length === 0 ? [] : selectedStudents, // Send array
          status,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess(data.data);
        handleClose();
      } else {
        setError(data.error?.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError('Failed to create assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedLesson('');
    setSelectedStudents([]);
    setStatus('not_started');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Lesson Assignment</DialogTitle>
          <DialogDescription>
            Assign a lesson to a student or create a template for planning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lesson Selection */}
          <div className="space-y-2">
            <Label htmlFor="lesson">Lesson</Label>
            <Select value={selectedLesson} onValueChange={setSelectedLesson}>
              <SelectTrigger id="lesson">
                <SelectValue placeholder="Select a lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title} ({lesson.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="student">Students (Optional)</Label>
            <StudentMultiSelect
              students={filterOptions.students}
              value={selectedStudents}
              onValueChange={setSelectedStudents}
              placeholder="Select students..."
              includeUnassigned={true}
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
