'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Check } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  isAssignedToTeacher?: boolean;
}

interface StudentAssignmentFormProps {
  teacherId: string;
}

export function StudentAssignmentForm({ teacherId }: StudentAssignmentFormProps) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [teacherId]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/admin/students/available?teacherId=${teacherId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data.students);

      // Pre-select already assigned students
      const assignedIds = new Set(
        data.students
          .filter((s: Student) => s.isAssignedToTeacher)
          .map((s: Student) => s.id)
      );
      setSelectedIds(assignedIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedIds(newSelection);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get initial assigned student IDs
      const initialAssignedIds = new Set(
        students
          .filter((s) => s.isAssignedToTeacher)
          .map((s) => s.id)
      );

      // Determine which students to add and which to remove
      const toAdd = Array.from(selectedIds).filter(id => !initialAssignedIds.has(id));
      const toRemove = Array.from(initialAssignedIds).filter(id => !selectedIds.has(id));

      // Add new assignments
      if (toAdd.length > 0) {
        const response = await fetch(`/api/admin/teachers/${teacherId}/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentIds: toAdd,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to assign students');
        }
      }

      // Remove old assignments
      for (const studentId of toRemove) {
        const response = await fetch(`/api/admin/teachers/${teacherId}/assignments/${studentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove student assignment');
        }
      }

      const totalChanges = toAdd.length + toRemove.length;
      setSuccess(`Successfully updated ${totalChanges} student assignment${totalChanges !== 1 ? 's' : ''}`);

      // Refresh to get updated data
      await fetchStudents();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assign Students
        </CardTitle>
        <CardDescription>
          Select students to assign to this teacher. Multiple teachers can be assigned to the same student.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students available for assignment.
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                  >
                    <Checkbox
                      id={student.id}
                      checked={selectedIds.has(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={student.id}
                      className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {student.name}
                    </label>
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
              </div>

              <Button type="submit" disabled={isSubmitting || selectedIds.size === 0}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Assignments
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
