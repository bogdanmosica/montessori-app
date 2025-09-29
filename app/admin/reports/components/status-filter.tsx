'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { APPLICATION_STATUS_OPTIONS } from '@/lib/constants/application-status';
import { ENROLLMENT_STATUS_OPTIONS } from '@/lib/constants/enrollment-status';
import { PAYMENT_STATUS_OPTIONS } from '@/lib/constants/payment-status';
import { ACTIVITY_TYPE_OPTIONS } from '@/lib/constants/activity-types';
import { REPORT_TYPES } from '@/lib/constants/report-constants';

interface StatusFilterProps {
  reportType: string;
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  className?: string;
}

interface StatusOption {
  value: string;
  label: string;
}

export function StatusFilter({
  reportType,
  selectedStatuses,
  onStatusChange,
  className
}: StatusFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get status options based on report type
  const getStatusOptions = (): StatusOption[] => {
    switch (reportType) {
      case REPORT_TYPES.APPLICATIONS:
        return APPLICATION_STATUS_OPTIONS;
      case REPORT_TYPES.ENROLLMENTS:
        return ENROLLMENT_STATUS_OPTIONS;
      case REPORT_TYPES.PAYMENTS:
        return PAYMENT_STATUS_OPTIONS;
      case REPORT_TYPES.ACTIVITY:
        return ACTIVITY_TYPE_OPTIONS;
      default:
        return [];
    }
  };

  const getFilterLabel = (): string => {
    switch (reportType) {
      case REPORT_TYPES.APPLICATIONS:
        return 'Application Status';
      case REPORT_TYPES.ENROLLMENTS:
        return 'Enrollment Status';
      case REPORT_TYPES.PAYMENTS:
        return 'Payment Status';
      case REPORT_TYPES.ACTIVITY:
        return 'Activity Type';
      default:
        return 'Status Filter';
    }
  };

  const statusOptions = getStatusOptions();
  const filterLabel = getFilterLabel();

  const handleStatusToggle = (statusValue: string, checked: boolean) => {
    if (checked) {
      onStatusChange([...selectedStatuses, statusValue]);
    } else {
      onStatusChange(selectedStatuses.filter(s => s !== statusValue));
    }
  };

  const handleSelectAll = () => {
    onStatusChange(statusOptions.map(option => option.value));
  };

  const handleClearAll = () => {
    onStatusChange([]);
  };

  const allSelected = selectedStatuses.length === statusOptions.length;
  const noneSelected = selectedStatuses.length === 0;

  // Don't render if no report type is selected
  if (!reportType || statusOptions.length === 0) {
    return null;
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <Label className="text-base font-semibold">{filterLabel}</Label>
          </div>
          <div className="flex items-center space-x-2">
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedStatuses.length} selected
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={allSelected}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={noneSelected}
              >
                Clear All
              </Button>
            </div>

            {/* Status Checkboxes */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {statusOptions.map((option) => {
                const isChecked = selectedStatuses.includes(option.value);

                return (
                  <div key={option.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleStatusToggle(option.value, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`status-${option.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                    {isChecked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusToggle(option.value, false)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Status Summary */}
            {selectedStatuses.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-blue-900">
                    Selected {filterLabel.toLowerCase()}:
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-blue-600 hover:text-blue-800 h-6 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedStatuses.map((status) => {
                    const option = statusOptions.find(opt => opt.value === status);
                    return (
                      <Badge
                        key={status}
                        variant="secondary"
                        className="text-xs bg-blue-100 text-blue-800"
                      >
                        {option?.label || status}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {noneSelected && (
              <div className="p-3 border-2 border-dashed border-gray-200 rounded-md text-center">
                <p className="text-sm text-muted-foreground">
                  No {filterLabel.toLowerCase()} selected. All statuses will be included in the report.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}