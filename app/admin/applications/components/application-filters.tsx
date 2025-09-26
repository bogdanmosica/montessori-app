'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APPLICATION_STATUS_OPTIONS } from '@/lib/constants/application-status';

interface ApplicationFiltersProps {
  currentStatus?: 'PENDING' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
}

// Extended status options - removed APPROVED since approved applications show as enrolled children
const EXTENDED_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ACTIVE', label: 'Active Students' },
  { value: 'INACTIVE', label: 'Inactive Students' },
  { value: 'WAITLISTED', label: 'Waitlisted Students' },
];

export function ApplicationFilters({ currentStatus }: ApplicationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusFilter = (status?: 'PENDING' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED') => {
    const params = new URLSearchParams(searchParams.toString());

    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }

    // Reset to first page when filtering
    params.set('page', '1');

    router.push(`?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    params.delete('search');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters = currentStatus || searchParams.get('search');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>

      {/* All Applications */}
      <Button
        variant={!currentStatus ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleStatusFilter()}
      >
        All
      </Button>

      {/* Status Filters */}
      {EXTENDED_STATUS_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={currentStatus === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilter(option.value as any)}
          className="relative"
        >
          {option.label}
          {currentStatus === option.value && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              ✓
            </Badge>
          )}
        </Button>
      ))}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}