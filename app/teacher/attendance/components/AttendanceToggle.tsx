'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { AttendanceStatus, ATTENDANCE_STATUS } from '@/lib/constants/attendance-status';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Attendance Toggle (Client Component)
 *
 * Interactive toggle buttons for marking student presence/absence.
 * Implements optimistic updates for better UX.
 */
interface AttendanceToggleProps {
  studentId: string;
  studentName: string;
  currentStatus?: AttendanceStatus;
  attendanceId?: string;
  date: string;
}

export default function AttendanceToggle({
  studentId,
  studentName,
  currentStatus,
  attendanceId,
  date,
}: AttendanceToggleProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<AttendanceStatus | undefined>(currentStatus);

  const handleToggle = async (newStatus: AttendanceStatus) => {
    setIsLoading(true);
    setOptimisticStatus(newStatus); // Optimistic update

    try {
      if (attendanceId) {
        // Update existing record
        const response = await fetch(`/api/teacher/attendance/${attendanceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update attendance');
        }
      } else {
        // Create new record
        const response = await fetch('/api/teacher/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            date,
            status: newStatus,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create attendance');
        }
      }

      // Refresh to get updated data
      router.refresh();
    } catch (error) {
      console.error('Error updating attendance:', error);
      // Revert optimistic update
      setOptimisticStatus(currentStatus);
      toast.error('Failed to update attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPresentActive = optimisticStatus?.includes('present') || false;
  const isAbsentActive = optimisticStatus?.includes('absent') || false;

  return (
    <div className="flex gap-2">
      <Button
        variant={isPresentActive ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleToggle(ATTENDANCE_STATUS.PRESENT)}
        disabled={isLoading}
        className="w-24"
      >
        <Check className="h-4 w-4 mr-1" />
        Present
      </Button>
      <Button
        variant={isAbsentActive ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => handleToggle(ATTENDANCE_STATUS.ABSENT)}
        disabled={isLoading}
        className="w-24"
      >
        <X className="h-4 w-4 mr-1" />
        Absent
      </Button>
    </div>
  );
}
