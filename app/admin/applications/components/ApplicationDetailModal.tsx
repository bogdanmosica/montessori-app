'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import {
  User,
  Mail,
  Phone,
  Baby,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
} from 'lucide-react';

import { ApplicationWithRelations } from '../../../../lib/types/applications';

interface ApplicationDetailModalProps {
  application: ApplicationWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onAction: (applicationId: string, action: 'approve' | 'reject' | 'view') => void;
}

export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onAction
}: ApplicationDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate child's age
  const childAge = Math.floor(
    (new Date().getTime() - new Date(application.childDateOfBirth).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  );

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-yellow-100 text-yellow-800',
          label: 'Pending Review'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800',
          label: 'Approved'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-red-100 text-red-800',
          label: 'Rejected'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-800',
          label: status
        };
    }
  };

  const statusInfo = getStatusInfo(application.status);
  const canProcess = application.status === 'pending';

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      await onAction(application.id, action);
      onClose();
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Application Details
            <Badge className={`${statusInfo.color} flex items-center gap-1`}>
              {statusInfo.icon}
              {statusInfo.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete application information for {application.childName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500">Application ID</div>
                  <div className="font-mono text-sm">{application.id.slice(0, 8)}...</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Submitted</div>
                  <div>
                    {new Intl.DateTimeFormat('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(application.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Last Updated</div>
                  <div>
                    {new Intl.DateTimeFormat('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(application.updatedAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Parent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Full Name</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{application.parentName}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Email Address</div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{application.parentEmail}</span>
                  </div>
                </div>
              </div>

              {application.parentPhone && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Phone Number</div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{application.parentPhone}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Child Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Child Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Full Name</div>
                  <div className="flex items-center gap-2">
                    <Baby className="h-4 w-4 text-gray-400" />
                    <span>{application.childName}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Age</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{childAge} years old</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Date of Birth</div>
                  <div>
                    {new Intl.DateTimeFormat('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }).format(new Date(application.childDateOfBirth))}
                  </div>
                </div>
                {application.childGender && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Gender</div>
                    <div className="capitalize">{application.childGender}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Program Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Program Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Requested Program</div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>{application.programRequested}</span>
                  </div>
                </div>
                {application.preferredStartDate && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Preferred Start Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }).format(new Date(application.preferredStartDate))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {application.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700 whitespace-pre-wrap">{application.notes}</div>
              </CardContent>
            </Card>
          )}

          {/* Application Status Details */}
          {application.status !== 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.status === 'approved' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Approved Date</div>
                      <div>
                        {application.approvedAt &&
                          new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(application.approvedAt))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Approved By</div>
                      <div>
                        {application.approvedByUser?.name || 'System'}
                      </div>
                    </div>
                  </div>
                )}

                {application.status === 'rejected' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Rejected Date</div>
                        <div>
                          {application.rejectedAt &&
                            new Intl.DateTimeFormat('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(application.rejectedAt))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Rejected By</div>
                        <div>
                          {application.rejectedByUser?.name || 'System'}
                        </div>
                      </div>
                    </div>
                    {application.rejectionReason && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-2">Rejection Reason</div>
                        <div className="text-gray-700 p-3 bg-red-50 border border-red-200 rounded">
                          {application.rejectionReason}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {canProcess && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction('reject')}
                disabled={isProcessing}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}