'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Edit, Trash2, Eye, Archive, UserX } from 'lucide-react';
import Link from 'next/link';
import type { EnrollmentWithChild } from '../types';
import { ENROLLMENT_STATUS, ENROLLMENT_STATUS_LABELS } from '../constants';

interface EnrollmentActionsProps {
  enrollment: EnrollmentWithChild;
  onEnrollmentUpdate?: (updatedEnrollment: EnrollmentWithChild) => void;
}

export function EnrollmentActions({
  enrollment,
  onEnrollmentUpdate,
}: EnrollmentActionsProps) {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canEdit = enrollment.status !== ENROLLMENT_STATUS.ARCHIVED;
  const canWithdraw = enrollment.status === ENROLLMENT_STATUS.ACTIVE || enrollment.status === ENROLLMENT_STATUS.INACTIVE;
  const canArchive = enrollment.status === ENROLLMENT_STATUS.WITHDRAWN;

  const handleWithdraw = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalDate: new Date().toISOString(),
          notes: 'Enrollment withdrawn via admin action',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to withdraw enrollment');
      }

      const result = await response.json();

      toast({
        title: 'Enrollment Withdrawn',
        description: `${enrollment.child.firstName} ${enrollment.child.lastName} has been withdrawn successfully.`,
      });

      onEnrollmentUpdate?.(result.data);
      setIsWithdrawDialogOpen(false);
    } catch (error) {
      console.error('Withdraw enrollment error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to withdraw enrollment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment: {
            status: ENROLLMENT_STATUS.ARCHIVED,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to archive enrollment');
      }

      const result = await response.json();

      toast({
        title: 'Enrollment Archived',
        description: `${enrollment.child.firstName} ${enrollment.child.lastName} enrollment has been archived.`,
      });

      onEnrollmentUpdate?.(result.data);
      setIsArchiveDialogOpen(false);
    } catch (error) {
      console.error('Archive enrollment error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive enrollment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = enrollment.status === ENROLLMENT_STATUS.ACTIVE
      ? ENROLLMENT_STATUS.INACTIVE
      : ENROLLMENT_STATUS.ACTIVE;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/enrollments/${enrollment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment: {
            status: newStatus,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update enrollment status');
      }

      const result = await response.json();

      toast({
        title: 'Status Updated',
        description: `${enrollment.child.firstName} ${enrollment.child.lastName} enrollment is now ${ENROLLMENT_STATUS_LABELS[newStatus].toLowerCase()}.`,
      });

      onEnrollmentUpdate?.(result.data);
    } catch (error) {
      console.error('Toggle status error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update enrollment status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            disabled={isLoading}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href={`/admin/enrollments/${enrollment.id}`}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/enrollments/${enrollment.id}/edit`}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Enrollment
              </Link>
            </DropdownMenuItem>
          )}

          {(enrollment.status === ENROLLMENT_STATUS.ACTIVE || enrollment.status === ENROLLMENT_STATUS.INACTIVE) && (
            <DropdownMenuItem
              onClick={handleToggleStatus}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              {enrollment.status === ENROLLMENT_STATUS.ACTIVE ? 'Mark Inactive' : 'Mark Active'}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {canWithdraw && (
            <DropdownMenuItem
              onClick={() => setIsWithdrawDialogOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
            >
              <Trash2 className="h-4 w-4" />
              Withdraw Enrollment
            </DropdownMenuItem>
          )}

          {canArchive && (
            <DropdownMenuItem
              onClick={() => setIsArchiveDialogOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
            >
              <Archive className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw the enrollment for{' '}
              <strong>{enrollment.child.firstName} {enrollment.child.lastName}</strong>?
              This action will mark the enrollment as withdrawn and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdraw}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? 'Withdrawing...' : 'Withdraw Enrollment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive the enrollment for{' '}
              <strong>{enrollment.child.firstName} {enrollment.child.lastName}</strong>?
              Archived enrollments cannot be modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isLoading}
              className="bg-gray-600 hover:bg-gray-700"
            >
              {isLoading ? 'Archiving...' : 'Archive Enrollment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}