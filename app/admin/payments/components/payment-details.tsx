'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, DollarSign, AlertTriangle } from 'lucide-react';
import useSWR from 'swr';

interface PaymentDetailsProps {
  paymentId: string;
  schoolId: number;
  onClose: () => void;
}

interface PaymentDetails {
  id: string;
  schoolId: number;
  parentId: string;
  childId: string;
  stripePaymentId: string | null;
  amount: string;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentDate: string;
  completedDate: string | null;
  failureReason: string | null;
  description: string;
  parentName: string;
  childName: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PaymentDetails({ paymentId, schoolId, onClose }: PaymentDetailsProps) {
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showRefundForm, setShowRefundForm] = useState(false);

  const { data: payment, error, isLoading, mutate } = useSWR<PaymentDetails>(
    `/api/admin/payments/payments/${paymentId}?school_id=${schoolId}`,
    fetcher
  );

  const handleRefund = async () => {
    if (!payment || !refundAmount || !refundReason) return;

    setIsRefunding(true);
    try {
      const response = await fetch(`/api/admin/payments/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school_id: schoolId,
          amount: parseFloat(refundAmount),
          reason: refundReason,
        }),
      });

      if (response.ok) {
        // Refresh payment data
        mutate();
        setShowRefundForm(false);
        setRefundAmount('');
        setRefundReason('');
      } else {
        const error = await response.json();
        alert(`Refund failed: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to process refund');
    } finally {
      setIsRefunding(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            View and manage payment information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            Failed to load payment details
          </div>
        ) : payment ? (
          <div className="space-y-6">
            {/* Payment Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment Overview</CardTitle>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                    <p className="text-2xl font-bold">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Payment Date</Label>
                    <p className="text-lg">{formatDate(payment.paymentDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Parent</Label>
                    <p className="text-lg">{payment.parentName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Child</Label>
                    <p className="text-lg">{payment.childName}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="mt-1">{payment.description}</p>
                </div>

                {payment.completedDate && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Completed Date</Label>
                    <p className="mt-1">{formatDate(payment.completedDate)}</p>
                  </div>
                )}

                {payment.failureReason && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Failure Reason</Label>
                    <p className="mt-1 text-red-600">{payment.failureReason}</p>
                  </div>
                )}

                {payment.stripePaymentId && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Stripe Payment ID</Label>
                    <p className="mt-1 font-mono text-sm">{payment.stripePaymentId}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {payment.status === 'completed' && !showRefundForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>
                    Available actions for this payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowRefundForm(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Process Refund
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Refund Form */}
            {showRefundForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Process Refund</CardTitle>
                  <CardDescription>
                    Enter refund details for this payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="refund-amount">Refund Amount</Label>
                    <Input
                      id="refund-amount"
                      type="number"
                      step="0.01"
                      max={payment.amount}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={`Max: ${formatCurrency(payment.amount)}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="refund-reason">Reason for Refund</Label>
                    <Textarea
                      id="refund-reason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Explain why this refund is being processed..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefund}
                      disabled={isRefunding || !refundAmount || !refundReason}
                      className="flex-1"
                    >
                      {isRefunding && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                      Process Refund
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRefundForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}