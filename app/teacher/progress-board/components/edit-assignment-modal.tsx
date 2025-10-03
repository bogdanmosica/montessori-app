'use client';

/**
 * Edit Assignment Modal
 *
 * Modal for editing existing lesson assignments
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
import { ProgressCard } from '@/lib/services/progress-board-service';
import { StudentCombobox } from './student-combobox';

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  card: ProgressCard | null;
  filterOptions: {
    students: Array<{ id: string; name: string }>;
    categories: string[];
  };
}

export function EditAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  card,
  filterOptions,
}: EditAssignmentModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialize form when card changes
  useEffect(() => {
    if (card) {
      setSelectedStudent(card.student_id || 'unassigned');
      setStatus(card.status);
      setError('');
    }
  }, [card]);

  const handleSubmit = async () => {
    if (!card) return;

    setIsLoading(true);
    setError('');

    try {
      // Update student assignment if changed
      if (selectedStudent !== (card.student_id || 'unassigned')) {
        const response = await fetch(`/api/teacher/progress-board/cards/${card.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent === 'unassigned' ? null : selectedStudent,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error?.message || 'Failed to update assignment');
          setIsLoading(false);
          return;
        }
      }

      // Update status if changed
      if (status !== card.status) {
        const response = await fetch(`/api/teacher/progress-board/cards/${card.id}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_status: status,
            new_position: 0,
            version: card.updated_at.toString(),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error?.message || 'Failed to update status');
          setIsLoading(false);
          return;
        }
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating assignment:', error);
      setError('Failed to update assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStudent('');
    setStatus('');
    setError('');
    onClose();
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update the student assignment or status for this lesson
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lesson Info (Read-only) */}
          <div className="space-y-2">
            <Label>Lesson</Label>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
              <p className="text-sm font-medium">{card.lesson_title}</p>
              <p className="text-xs text-gray-500">{card.lesson_category}</p>
            </div>
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student">Student</Label>
            <StudentCombobox
              students={filterOptions.students}
              value={selectedStudent}
              onValueChange={setSelectedStudent}
              placeholder="Select student"
              includeUnassigned={true}
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
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
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
