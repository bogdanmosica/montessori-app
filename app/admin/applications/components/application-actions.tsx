'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
// import { toast } from 'sonner';

interface ApplicationActionsProps {
  application: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    child_first_name: string;
    child_last_name: string;
  };
  adminUserId: number;
  schoolId: number;
}

export function ApplicationActions({ application, adminUserId, schoolId }: ApplicationActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const isPending = application.status === 'PENDING';

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/admin/applications/${application.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      // toast.success('Application approved successfully!', {
      //   description: `${application.child_first_name} ${application.child_last_name} has been enrolled.`,
      // });
      console.log('Application approved successfully!');

      // Refresh the page to show updated status
      router.refresh();

    } catch (error) {
      console.error('Approval error:', error);
      // toast.error('Failed to approve application', {
      //   description: error instanceof Error ? error.message : 'Please try again.',
      // });
      console.error('Failed to approve application:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const response = await fetch(`/api/admin/applications/${application.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectionReason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      // toast.success('Application rejected', {
      //   description: 'The application status has been updated.',
      // });
      console.log('Application rejected successfully');

      // Clear the rejection reason
      setRejectionReason('');

      // Refresh the page to show updated status
      router.refresh();

    } catch (error) {
      console.error('Rejection error:', error);
      // toast.error('Failed to reject application', {
      //   description: error instanceof Error ? error.message : 'Please try again.',
      // });
      console.error('Failed to reject application:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  if (!isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-muted rounded-md">
            {application.status === 'APPROVED' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                Application {application.status.toLowerCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                This application has been processed and cannot be modified.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            This application is pending review
          </p>
        </div>

        {/* Approve Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" disabled={isApproving || isRejecting}>
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Application
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Application</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve the application for {application.child_first_name} {application.child_last_name} and automatically:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Create a child profile</li>
                  <li>Create or link parent profiles</li>
                  <li>Set up parent-child relationships</li>
                  <li>Log the approval action</li>
                </ul>
                <p className="mt-3 font-medium">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                Approve Application
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Button and Reason */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="rejection-reason" className="text-sm font-medium">
              Rejection Reason (Optional)
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-1"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {rejectionReason.length}/500 characters
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={isApproving || isRejecting}
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Application</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reject the application for {application.child_first_name} {application.child_last_name}.
                  {rejectionReason.trim() && (
                    <>
                      <p className="mt-2 font-medium">Rejection reason:</p>
                      <p className="mt-1 p-2 bg-muted rounded text-sm">
                        "{rejectionReason.trim()}"
                      </p>
                    </>
                  )}
                  <p className="mt-3 font-medium">This action cannot be undone.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
                  Reject Application
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            All actions are logged for audit purposes and cannot be reversed once completed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}