'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { ENROLLMENT_STATUS_OPTIONS, ENROLLMENT_SORT_OPTIONS } from '../constants';
import type { GetEnrollmentsQuery } from '../types';

interface EnrollmentFiltersProps {
  onFiltersChange?: (filters: GetEnrollmentsQuery) => void;
  defaultFilters?: Partial<GetEnrollmentsQuery>;
}

export function EnrollmentFilters({
  onFiltersChange,
  defaultFilters = {},
}: EnrollmentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL params or defaults
  const [search, setSearch] = useState(
    searchParams.get('search') || defaultFilters.search || ''
  );
  const [status, setStatus] = useState(
    searchParams.get('status') || defaultFilters.status || 'all'
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get('sortBy') || defaultFilters.sortBy || 'enrollment_date'
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get('sortOrder') || defaultFilters.sortOrder || 'desc'
  );

  // Update URL params when filters change
  const updateURL = (newFilters: Partial<GetEnrollmentsQuery>) => {
    const params = new URLSearchParams(searchParams);

    // Update each parameter
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    // Reset page when filters change
    params.delete('page');

    const newURL = `${pathname}?${params.toString()}`;
    router.push(newURL);
  };

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleSearchSubmit = () => {
    const filters = { search, status, sortBy, sortOrder };
    updateURL(filters);
    onFiltersChange?.(filters);
  };

  // Handle status filter
  const handleStatusChange = (value: string) => {
    setStatus(value);
    const filters = {
      search,
      status: value === 'all' ? undefined : value,
      sortBy,
      sortOrder
    };
    updateURL(filters);
    onFiltersChange?.(filters);
  };

  // Handle sort changes
  const handleSortChange = (field: 'sortBy' | 'sortOrder', value: string) => {
    const newSortBy = field === 'sortBy' ? value : sortBy;
    const newSortOrder = field === 'sortOrder' ? value : sortOrder;

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);

    const filters = { search, status, sortBy: newSortBy, sortOrder: newSortOrder };
    updateURL(filters);
    onFiltersChange?.(filters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setSortBy('enrollment_date');
    setSortOrder('desc');

    const filters = { sortBy: 'enrollment_date', sortOrder: 'desc' };
    updateURL(filters);
    onFiltersChange?.(filters);
  };

  // Handle Enter key in search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Count active filters
  const activeFiltersCount = [
    search,
    status !== 'all' ? status : null,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search and main filters row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by child name or parent name..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ENROLLMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <Button onClick={handleSearchSubmit} className="sm:w-auto">
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>

          {/* Sort and advanced filters row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Sort By */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select value={sortBy} onValueChange={(value) => handleSortChange('sortBy', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrollment_date">Enrollment Date</SelectItem>
                    <SelectItem value="child_name">Child Name</SelectItem>
                    <SelectItem value="created_at">Created Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={(value) => handleSortChange('sortOrder', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active filters and clear button */}
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <>
                  <Badge variant="secondary" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {search && (
                <Badge variant="outline" className="text-xs">
                  Search: {search}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-2 hover:bg-transparent"
                    onClick={() => {
                      setSearch('');
                      handleSearchSubmit();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {status !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Status: {ENROLLMENT_STATUS_OPTIONS.find(opt => opt.value === status)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-2 hover:bg-transparent"
                    onClick={() => handleStatusChange('all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}