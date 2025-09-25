'use client';

import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';
import {
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  Loader2,
} from 'lucide-react';

import { ApplicationWithRelations } from '../../../../lib/types/applications';

interface ApplicationActionsProps {
  application: ApplicationWithRelations;
  onAction: (applicationId: string, action: 'approve' | 'reject' | 'view') => void;
  disabled?: boolean;
}

export function ApplicationActions({
  application,
  onAction,
  disabled = false
}: ApplicationActionsProps) {
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if application can be processed
  const canProcess = application.status === 'pending';
  const canView = true; // All admins can view applications

  // Handle approval confirmation
  const handleApprovalConfirm = async () => {
    setIsProcessing(true);
    try {
      await onAction(application.id, 'approve');
      setIsApprovalDialogOpen(false);
    } catch (error) {
      console.error('Error approving application:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle rejection confirmation
  const handleRejectionConfirm = async () => {
    setIsProcessing(true);
    try {
      await onAction(application.id, 'reject');
      setIsRejectionDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting application:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle view action
  const handleView = () => {
    onAction(application.id, 'view');
  };

  return (
    <>
      {/* Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || isProcessing}
            className="h-8 w-8 p-0"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
            <span className="sr-only">Open actions menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* View Application */}
          {canView && (
            <DropdownMenuItem onClick={handleView} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          )}

          {canProcess && (
            <>
              <DropdownMenuSeparator />

              {/* Approve Application */}
              <DropdownMenuItem
                onClick={() => setIsApprovalDialogOpen(true)}
                className="cursor-pointer text-green-600 focus:text-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Application
              </DropdownMenuItem>

              {/* Reject Application */}
              <DropdownMenuItem
                onClick={() => setIsRejectionDialogOpen(true)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Application
              </DropdownMenuItem>
            </>
          )}

          {!canProcess && application.status !== 'pending' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-sm text-gray-500">
                Application already {application.status}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve Application
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Are you sure you want to approve the application for{' '}
                <span className="font-semibold">{application.childName}</span>?
              </div>
              <div className="text-sm bg-blue-50 p-3 rounded border">
                <div className="font-medium text-blue-800 mb-1">This will:</div>
                <ul className="text-blue-700 space-y-1 list-disc list-inside">
                  <li>Create a parent user account for {application.parentName}</li>
                  <li>Create a child record for {application.childName}</li>
                  <li>Create an active enrollment record</li>
                  <li>Send a welcome email to the parent</li>
                </ul>
              </div>
              <div className="text-sm text-gray-600">
                You'll be able to review and customize the parent account details before final approval.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprovalConfirm}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Proceed to Approve
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Confirmation Dialog */}
      <AlertDialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Application
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Are you sure you want to reject the application for{' '}
                <span className="font-semibold">{application.childName}</span>?
              </div>
              <div className="text-sm bg-amber-50 p-3 rounded border">
                <div className="font-medium text-amber-800 mb-1">This will:</div>
                <ul className="text-amber-700 space-y-1 list-disc list-inside">
                  <li>Mark the application as rejected</li>
                  <li>No parent or child accounts will be created</li>
                  <li>Send a rejection notification to the parent</li>
                </ul>
              </div>
              <div className="text-sm text-gray-600">
                You'll be able to provide a reason for rejection and customize the notification.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectionConfirm}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Proceed to Reject
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Quick Actions Component (alternative layout for table rows)
export function QuickApplicationActions({
  application,
  onAction,
  disabled = false,
  compact = false
}: ApplicationActionsProps & { compact?: boolean }) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if application can be processed
  const canProcess = application.status === 'pending';

  // Handle quick actions
  const handleQuickAction = async (action: 'approve' | 'reject' | 'view') => {
    if (action === 'view') {
      onAction(application.id, action);
      return;
    }

    setIsProcessing(true);
    try {
      await onAction(application.id, action);
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!canProcess) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={() => handleQuickAction('view')}
          disabled={disabled}
        >
          <Eye className="h-4 w-4" />
          {!compact && <span className="ml-1">View</span>}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* View Button */}
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => handleQuickAction('view')}
        disabled={disabled || isProcessing}
      >
        <Eye className="h-4 w-4" />
        {!compact && <span className="ml-1">View</span>}
      </Button>

      {/* Approve Button */}
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => handleQuickAction('approve')}
        disabled={disabled || isProcessing}
        className="text-green-600 border-green-300 hover:bg-green-50"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        {!compact && <span className="ml-1">Approve</span>}
      </Button>

      {/* Reject Button */}
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => handleQuickAction('reject')}
        disabled={disabled || isProcessing}
        className="text-red-600 border-red-300 hover:bg-red-50"
      >
        <XCircle className="h-4 w-4" />
        {!compact && <span className="ml-1">Reject</span>}
      </Button>
    </div>
  );
}