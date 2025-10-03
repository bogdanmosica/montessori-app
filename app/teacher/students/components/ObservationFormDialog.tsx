'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ObservationForm } from './ObservationForm';
import type { Observation } from '@/lib/db/schema/observations';

interface ObservationFormDialogProps {
  studentId: string;
  teacherId: number;
  existingObservation?: Observation;
  children: React.ReactNode;
}

export function ObservationFormDialog({
  studentId,
  teacherId,
  existingObservation,
  children,
}: ObservationFormDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    // Refresh the page to show updated observations
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {existingObservation ? 'Edit Observation' : 'Add New Observation'}
          </DialogTitle>
          <DialogDescription>
            {existingObservation
              ? 'Update your observation about this student.'
              : 'Record an observation about this student\'s progress or activity.'}
          </DialogDescription>
        </DialogHeader>
        <ObservationForm
          studentId={studentId}
          teacherId={teacherId}
          existingObservation={existingObservation}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
