import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Phone, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { EnrollmentActions } from './EnrollmentActions';
import { EmptyState, SearchEmptyState, FilterEmptyState } from './EmptyState';
import type { EnrollmentWithChild, GetEnrollmentsQuery } from '../types';
import { ENROLLMENT_STATUS, ENROLLMENT_STATUS_LABELS } from '../constants';

interface EnrollmentsTableProps {
  enrollments: EnrollmentWithChild[];
  isLoading?: boolean;
  filters?: GetEnrollmentsQuery;
  onEnrollmentUpdate?: (updatedEnrollment: EnrollmentWithChild) => void;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case ENROLLMENT_STATUS.ACTIVE:
      return 'default'; // Green
    case ENROLLMENT_STATUS.INACTIVE:
      return 'secondary'; // Gray
    case ENROLLMENT_STATUS.WITHDRAWN:
      return 'destructive'; // Red
    case ENROLLMENT_STATUS.ARCHIVED:
      return 'outline'; // Outlined
    default:
      return 'secondary';
  }
}

function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
}

function calculateAge(dateOfBirth: string): number {
  try {
    const birth = parseISO(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  } catch {
    return 0;
  }
}

function EnrollmentRow({
  enrollment,
  onEnrollmentUpdate,
}: {
  enrollment: EnrollmentWithChild;
  onEnrollmentUpdate?: (updatedEnrollment: EnrollmentWithChild) => void;
}) {
  const age = calculateAge(enrollment.child.dateOfBirth);

  return (
    <TableRow className="hover:bg-gray-50">
      {/* Child Information */}
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium text-gray-900">
            {enrollment.child.firstName} {enrollment.child.lastName}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <User className="h-3 w-3" />
            {age} years old
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={getStatusBadgeVariant(enrollment.status)}>
          {ENROLLMENT_STATUS_LABELS[enrollment.status]}
        </Badge>
      </TableCell>

      {/* Enrollment Date */}
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          {formatDate(enrollment.enrollmentDate)}
        </div>
      </TableCell>

      {/* Withdrawal Date */}
      <TableCell>
        {enrollment.withdrawalDate ? (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Calendar className="h-4 w-4" />
            {formatDate(enrollment.withdrawalDate)}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </TableCell>

      {/* Parent Information */}
      <TableCell>
        <div className="space-y-1">
          <div className="text-sm font-medium">{enrollment.child.parentName}</div>
          <div className="space-y-1">
            {enrollment.child.parentEmail && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {enrollment.child.parentEmail}
              </div>
            )}
            {enrollment.child.parentPhone && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {enrollment.child.parentPhone}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Notes */}
      <TableCell>
        {enrollment.notes ? (
          <div className="text-sm text-gray-600 max-w-xs truncate" title={enrollment.notes}>
            {enrollment.notes}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <EnrollmentActions
          enrollment={enrollment}
          onEnrollmentUpdate={onEnrollmentUpdate}
        />
      </TableCell>
    </TableRow>
  );
}

export function EnrollmentsTable({
  enrollments,
  isLoading = false,
  filters,
  onEnrollmentUpdate,
}: EnrollmentsTableProps) {
  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show appropriate empty state
  if (enrollments.length === 0) {
    if (filters?.search) {
      return <SearchEmptyState searchTerm={filters.search} />;
    }

    if (filters?.status && filters.status !== 'all') {
      const statusLabel = ENROLLMENT_STATUS_LABELS[filters.status] || filters.status;
      return (
        <FilterEmptyState
          filterType="status"
          filterValue={statusLabel.toLowerCase()}
        />
      );
    }

    return <EmptyState />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Enrollments</span>
          <Badge variant="secondary" className="text-xs">
            {enrollments.length} enrollment{enrollments.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Withdrawn</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <EnrollmentRow
                  key={enrollment.id}
                  enrollment={enrollment}
                  onEnrollmentUpdate={onEnrollmentUpdate}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}