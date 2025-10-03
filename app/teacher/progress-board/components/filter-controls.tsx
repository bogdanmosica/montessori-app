'use client';

/**
 * Filter Controls Component
 *
 * Controls for filtering the progress board
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface FilterControlsProps {
  filters: {
    student_id?: string;
    category?: string;
  };
  filterOptions: {
    students: Array<{ id: string; name: string }>;
    categories: string[];
  };
  onFilterChange: (filters: { student_id?: string; category?: string }) => void;
}

export function FilterControls({
  filters,
  filterOptions,
  onFilterChange,
}: FilterControlsProps) {
  const hasActiveFilters = filters.student_id || filters.category;

  const handleStudentChange = (value: string) => {
    if (value === 'all') {
      onFilterChange({ ...filters, student_id: undefined });
    } else {
      onFilterChange({ ...filters, student_id: value });
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      onFilterChange({ ...filters, category: undefined });
    } else {
      onFilterChange({ ...filters, category: value });
    }
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Student Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Student:</span>
        <Select
          value={filters.student_id || 'all'}
          onValueChange={handleStudentChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            {filterOptions.students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Category:</span>
        <Select
          value={filters.category || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {filterOptions.categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
