import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentReportRow } from '@/lib/types/report-types';
import { PAYMENT_STATUS_LABELS } from '@/lib/constants/payment-status';
import { format } from 'date-fns';

interface PaymentsReportTableProps {
  data: PaymentReportRow[];
  isLoading?: boolean;
  className?: string;
}

export function PaymentsReportTable({
  data,
  isLoading = false,
  className
}: PaymentsReportTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'refunded':
        return 'outline';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTransactionTypeBadgeVariant = (type: string) => {
    if (!type) return 'secondary';
    switch (type.toLowerCase()) {
      case 'payment':
        return 'default';
      case 'refund':
        return 'outline';
      case 'failed_charge':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: string) => {
    return PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] || status;
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const formatTransactionType = (type: string): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No payments found for the selected criteria.</p>
        </div>
      </Card>
    );
  }

  // Calculate summary metrics
  const totalAmount = data.reduce((sum, payment) => sum + payment.amount, 0);
  const successfulPayments = data.filter(payment => payment.status === 'completed');
  const totalSuccessfulAmount = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const failedPayments = data.filter(payment => payment.status === 'failed').length;

  return (
    <Card className={`${className}`}>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Payments Report</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {data.length} {data.length === 1 ? 'transaction' : 'transactions'} found
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Amount: </span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Successful: </span>
              <span className="font-semibold text-green-600">{formatCurrency(totalSuccessfulAmount)}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Failed: </span>
              <span className="font-semibold text-red-600">{failedPayments}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Parent Name</TableHead>
              <TableHead className="min-w-[200px]">Parent Email</TableHead>
              <TableHead className="min-w-[120px]">Child Name</TableHead>
              <TableHead className="min-w-[120px]">Type</TableHead>
              <TableHead className="min-w-[100px]">Amount</TableHead>
              <TableHead className="min-w-[120px]">Payment Method</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Transaction Date</TableHead>
              <TableHead className="min-w-[150px]">Stripe ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((payment) => (
              <TableRow key={payment.paymentId}>
                <TableCell className="font-medium">
                  {payment.parentName}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={payment.parentEmail}>
                    {payment.parentEmail}
                  </div>
                </TableCell>
                <TableCell>
                  {payment.childName || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={getTransactionTypeBadgeVariant(payment.transactionType)}>
                    {formatTransactionType(payment.transactionType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>
                  <div className="max-w-[120px] truncate" title={payment.paymentMethod}>
                    {payment.paymentMethod}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                    {formatStatus(payment.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(payment.transactionDate, 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  {payment.stripeTransactionId ? (
                    <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                      {payment.stripeTransactionId.substring(0, 12)}...
                    </code>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.length >= 100 && (
        <div className="p-4 border-t bg-amber-50">
          <p className="text-sm text-amber-800">
            Showing first {data.length} payments. Use date filters to narrow results for better performance.
          </p>
        </div>
      )}
    </Card>
  );
}