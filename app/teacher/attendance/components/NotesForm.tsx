'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Notes Form (Client Component)
 *
 * Dialog for adding/editing daily notes for students.
 * Uses dialog component for better UX.
 */
interface NotesFormProps {
  studentId: string;
  studentName: string;
  currentNotes: string | null;
  attendanceId?: string;
  date: string;
}

export default function NotesForm({
  studentId,
  studentName,
  currentNotes,
  attendanceId,
  date,
}: NotesFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(currentNotes || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      if (attendanceId) {
        // Update existing record with notes
        const response = await fetch(`/api/teacher/attendance/${attendanceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: notes || null }),
        });

        if (!response.ok) {
          throw new Error('Failed to update notes');
        }
      } else {
        // Create new record with notes (needs a status too)
        // For now, we'll default to present when adding notes without attendance
        const response = await fetch('/api/teacher/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            date,
            status: 'present',
            notes: notes || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save notes');
        }
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasNotes = currentNotes && currentNotes.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={hasNotes ? 'default' : 'outline'} size="sm">
          {hasNotes ? (
            <>
              <FileText className="h-4 w-4 mr-1" />
              View Notes
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Add Notes
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Daily Notes</DialogTitle>
          <DialogDescription>
            Add notes for {studentName} on {new Date(date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Enter daily notes (activities, behavior, meals, etc.)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px]"
            maxLength={10000}
          />
          <p className="text-sm text-muted-foreground">
            {notes.length} / 10,000 characters
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
