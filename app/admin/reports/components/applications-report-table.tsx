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
import { ApplicationReportRow } from '@/lib/types/report-types';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants/application-status';
import { format } from 'date-fns';

interface ApplicationsReportTableProps {
  data: ApplicationReportRow[];
  isLoading?: boolean;
  className?: string;
}

export function ApplicationsReportTable({
  data,
  isLoading = false,
  className
}: ApplicationsReportTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'under_review':
        return 'secondary';
      case 'waitlisted':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: string) => {
    return APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS] || status;
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
          <p className="text-muted-foreground">No applications found for the selected criteria.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Applications Report</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {data.length} {data.length === 1 ? 'application' : 'applications'} found
        </p>
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
              <TableHead className="min-w-[120px]">Applied Date</TableHead>
              <TableHead className="min-w-[120px]">Reviewed By</TableHead>
              <TableHead className="min-w-[120px]">Review Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((application) => (
              <TableRow key={application.applicationId}>
                <TableCell className="font-medium">
                  {application.childName}
                </TableCell>
                <TableCell>
                  {format(application.childDateOfBirth, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {application.parentName}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={application.parentEmail}>
                    {application.parentEmail}
                  </div>
                </TableCell>
                <TableCell>
                  {application.parentPhone || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(application.applicationStatus)}>
                    {formatStatus(application.applicationStatus)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(application.applicationDate, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {application.reviewedBy || 'Pending'}
                </TableCell>
                <TableCell>
                  {application.reviewedAt
                    ? format(application.reviewedAt, 'MMM d, yyyy')
                    : 'N/A'
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
            Showing first {data.length} applications. Use date filters to narrow results for better performance.
          </p>
        </div>
      )}
    </Card>
  );
}