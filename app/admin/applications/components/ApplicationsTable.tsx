'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { ApplicationWithRelations, ApplicationsSearchFilters } from '../../../../lib/types/applications';
import { ApplicationActions } from './ApplicationActions';

interface ApplicationsTableProps {
  applications: ApplicationWithRelations[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: ApplicationsSearchFilters;
  onFilterChange: (filters: ApplicationsSearchFilters) => void;
  onPageChange: (page: number) => void;
  onApplicationAction: (applicationId: string, action: 'approve' | 'reject' | 'view') => void;
  loading?: boolean;
}

export function ApplicationsTable({
  applications,
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  onApplicationAction,
  loading = false
}: ApplicationsTableProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [sortBy, setSortBy] = useState<'createdAt' | 'parentName' | 'childName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get status badge color (moved from server)
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Format applications for display (client-side formatting)
  const formattedApplications = useMemo(() => {
    return applications.map(app => ({
      ...app,
      displayName: `${app.parentName} (${app.childName})`,
      formattedDate: new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(app.createdAt),
      statusBadgeColor: getStatusBadgeColor(app.status),
    }));
  }, [applications]);

  // Handle search input with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Simple debounce implementation
    setTimeout(() => {
      onFilterChange({ ...filters, search: value || undefined });
    }, 500);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    onFilterChange({
      ...filters,
      status: status === 'all' ? undefined : (status as 'pending' | 'approved' | 'rejected')
    });
  };

  // Handle program filter change
  const handleProgramFilterChange = (program: string) => {
    onFilterChange({
      ...filters,
      programRequested: program === 'all' ? undefined : program
    });
  };

  // Handle sort change
  const handleSortChange = (field: 'createdAt' | 'parentName' | 'childName') => {
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newSortOrder);

    // Update URL with sort parameters
    onFilterChange({ ...filters, sortBy: field, sortOrder: newSortOrder });
  };

  // Get unique programs for filter dropdown
  const uniquePrograms = useMemo(() => {
    const programs = [...new Set(applications.map(app => app.programRequested))];
    return programs.filter(Boolean);
  }, [applications]);

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Applications</CardTitle>
        <CardDescription>
          Manage and process school applications from prospective families
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by parent name, child name, or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Program Filter */}
            <Select
              value={filters.programRequested || 'all'}
              onValueChange={handleProgramFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {uniquePrograms.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-500">
            Showing {applications.length} of {pagination.totalItems} applications
            {filters.status && ` • Filtered by: ${filters.status}`}
            {filters.search && ` • Search: "${filters.search}"`}
            {filters.programRequested && ` • Program: ${filters.programRequested}`}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSortChange('parentName')}>
                  <div className="flex items-center gap-2">
                    Parent Name
                    {getSortIcon('parentName')}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSortChange('childName')}>
                  <div className="flex items-center gap-2">
                    Child Name
                    {getSortIcon('childName')}
                  </div>
                </TableHead>
                <TableHead>Child Age</TableHead>
                <TableHead>Program Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSortChange('createdAt')}>
                  <div className="flex items-center gap-2">
                    Applied Date
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : formattedApplications.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-8 h-8" />
                      <p>No applications found</p>
                      <p className="text-sm">
                        {filters.search || filters.status || filters.programRequested
                          ? 'Try adjusting your filters'
                          : 'Applications will appear here once families submit them'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Application rows
                formattedApplications.map((application) => {
                  const childAge = Math.floor(
                    (new Date().getTime() - new Date(application.childDateOfBirth).getTime()) /
                    (1000 * 60 * 60 * 24 * 365.25)
                  );

                  return (
                    <TableRow key={application.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          <div>{application.parentName}</div>
                          <div className="text-sm text-gray-500">{application.parentEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{application.childName}</div>
                          <div className="text-sm text-gray-500">
                            Born: {new Intl.DateTimeFormat('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }).format(new Date(application.childDateOfBirth))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {childAge} years old
                      </TableCell>
                      <TableCell>{application.programRequested}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(application.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(application.status)}
                          {application.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{application.formattedDate}</TableCell>
                      <TableCell className="text-right">
                        <ApplicationActions
                          application={application}
                          onAction={onApplicationAction}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange(pagination.currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}