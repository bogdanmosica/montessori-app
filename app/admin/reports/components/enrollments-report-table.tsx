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
import { EnrollmentReportRow } from '@/lib/types/report-types';
import { ENROLLMENT_STATUS_LABELS } from '@/lib/constants/enrollment-status';
import { format } from 'date-fns';

interface EnrollmentsReportTableProps {
  data: EnrollmentReportRow[];
  isLoading?: boolean;
  className?: string;
}

export function EnrollmentsReportTable({
  data,
  isLoading = false,
  className
}: EnrollmentsReportTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'withdrawn':
        return 'destructive';
      case 'graduated':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: string) => {
    return ENROLLMENT_STATUS_LABELS[status as keyof typeof ENROLLMENT_STATUS_LABELS] || status;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          <p className="text-muted-foreground">No enrollments found for the selected criteria.</p>
        </div>
      </Card>
    );
  }

  // Calculate summary metrics
  const totalMonthlyRevenue = data
    .filter(enrollment => enrollment.enrollmentStatus === 'active')
    .reduce((sum, enrollment) => sum + enrollment.monthlyFee, 0);

  const activeEnrollments = data.filter(enrollment => enrollment.enrollmentStatus === 'active').length;

  return (
    <Card className={`${className}`}>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Enrollments Report</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {data.length} {data.length === 1 ? 'enrollment' : 'enrollments'} found
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Active: </span>
              <span className="font-semibold">{activeEnrollments}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Monthly Revenue: </span>
              <span className="font-semibold">{formatCurrency(totalMonthlyRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Child Name</TableHead>
              <TableHead className="min-w-[120px]">Date of Birth</TableHead>
              <TableHead className="min-w-[150px]">Parent Name</TableHead>
              <TableHead className="min-w-[200px]">Parent Email</TableHead>
              <TableHead className="min-w-[120px]">Phone</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Program</TableHead>
              <TableHead className="min-w-[100px]">Monthly Fee</TableHead>
              <TableHead className="min-w-[120px]">Start Date</TableHead>
              <TableHead className="min-w-[120px]">End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((enrollment) => (
              <TableRow key={enrollment.enrollmentId}>
                <TableCell className="font-medium">
                  {enrollment.childName}
                </TableCell>
                <TableCell>
                  {format(enrollment.childDateOfBirth, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {enrollment.parentName}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={enrollment.parentEmail}>
                    {enrollment.parentEmail}
                  </div>
                </TableCell>
                <TableCell>
                  {enrollment.parentPhone || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(enrollment.enrollmentStatus)}>
                    {formatStatus(enrollment.enrollmentStatus)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[120px] truncate" title={enrollment.programType}>
                    {enrollment.programType}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(enrollment.monthlyFee)}
                </TableCell>
                <TableCell>
                  {format(enrollment.startDate, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {enrollment.endDate
                    ? format(enrollment.endDate, 'MMM d, yyyy')
                    : 'Ongoing'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.length >= 100 && (
        <div className="p-4 border-t bg-amber-50">
          <p className="text-sm text-amber-800">
            Showing first {data.length} enrollments. Use date filters to narrow results for better performance.
          </p>
        </div>
      )}
    </Card>
  );
}