'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Clock, CreditCard, Zap } from 'lucide-react';
import useSWR from 'swr';

interface AlertDetails {
  id: string;
  parentId: string | null;
  parentName: string | null;
  paymentId: string | null;
  alertType: 'failed_payment' | 'overdue_payment' | 'expired_card' | 'webhook_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  isResolved: boolean;
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface AlertsResponse {
  alerts: AlertDetails[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PaymentAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<AlertDetails | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Get school ID from URL or context - for now using a placeholder
  const schoolId = 1; // TODO: Get from context/auth

  const { data, error, isLoading, mutate } = useSWR<AlertsResponse>(
    `/api/admin/payments/alerts?school_id=${schoolId}&is_resolved=false`,
    fetcher
  );

  const handleResolveAlert = async () => {
    if (!selectedAlert || !resolutionNotes) return;

    setIsResolving(true);
    try {
      const response = await fetch(`/api/admin/payments/alerts/${selectedAlert.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school_id: schoolId,
          resolution_notes: resolutionNotes,
        }),
      });

      if (response.ok) {
        // Refresh alerts data
        mutate();
        setSelectedAlert(null);
        setResolutionNotes('');
      } else {
        const error = await response.json();
        alert(`Failed to resolve alert: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to resolve alert');
    } finally {
      setIsResolving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'failed_payment':
        return <AlertTriangle className="h-4 w-4" />;
      case 'overdue_payment':
        return <Clock className="h-4 w-4" />;
      case 'expired_card':
        return <CreditCard className="h-4 w-4" />;
      case 'webhook_failure':
        return <Zap className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Alerts</CardTitle>
          <CardDescription>
            Issues requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
              <p>Failed to load alerts</p>
            </div>
          ) : !data?.alerts?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-500" />
              <p>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${getSeverityColor(alert.severity)}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(alert.alertType)}
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.parentName && `${alert.parentName} • `}
                          {formatDate(alert.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm mt-2 line-clamp-2">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Resolution Dialog */}
      {selectedAlert && (
        <Dialog open={true} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Resolve Alert</DialogTitle>
              <DialogDescription>
                Provide resolution details for this alert
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Alert Details */}
              <div className={`p-4 border rounded-lg ${getSeverityColor(selectedAlert.severity)}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {getAlertIcon(selectedAlert.alertType)}
                  <p className="font-medium">{selectedAlert.title}</p>
                </div>
                <p className="text-sm">{selectedAlert.message}</p>
                {selectedAlert.parentName && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Parent: {selectedAlert.parentName}
                  </p>
                )}
              </div>

              {/* Resolution Form */}
              <div>
                <Label htmlFor="resolution-notes">Resolution Notes</Label>
                <Textarea
                  id="resolution-notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this alert was resolved..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleResolveAlert}
                  disabled={isResolving || !resolutionNotes}
                  className="flex-1"
                >
                  {isResolving ? 'Resolving...' : 'Resolve Alert'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAlert(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}