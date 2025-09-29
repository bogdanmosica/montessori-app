'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  className?: string;
}

interface DateRangePreset {
  label: string;
  value: string;
  getRange: () => { start: Date; end: Date };
}

const DATE_PRESETS: DateRangePreset[] = [
  {
    label: 'Last 7 days',
    value: 'last-7-days',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 7)),
      end: endOfDay(new Date())
    })
  },
  {
    label: 'Last 30 days',
    value: 'last-30-days',
    getRange: () => ({
      start: startOfDay(subDays(new Date(), 30)),
      end: endOfDay(new Date())
    })
  },
  {
    label: 'Last 3 months',
    value: 'last-3-months',
    getRange: () => ({
      start: startOfDay(subMonths(new Date(), 3)),
      end: endOfDay(new Date())
    })
  },
  {
    label: 'Last 6 months',
    value: 'last-6-months',
    getRange: () => ({
      start: startOfDay(subMonths(new Date(), 6)),
      end: endOfDay(new Date())
    })
  },
  {
    label: 'Last year',
    value: 'last-year',
    getRange: () => ({
      start: startOfDay(subYears(new Date(), 1)),
      end: endOfDay(new Date())
    })
  }
];

export function DateRangeFilter({
  startDate,
  endDate,
  onDateRangeChange,
  className
}: DateRangeFilterProps) {
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const handlePresetSelect = (presetValue: string) => {
    if (presetValue === 'custom') {
      setSelectedPreset('custom');
      return;
    }

    if (presetValue === 'clear') {
      setSelectedPreset('');
      onDateRangeChange(undefined, undefined);
      return;
    }

    const preset = DATE_PRESETS.find(p => p.value === presetValue);
    if (preset) {
      const range = preset.getRange();
      setSelectedPreset(presetValue);
      onDateRangeChange(range.start, range.end);
    }
  };

  const handleStartDateSelect = (date?: Date) => {
    if (date) {
      setSelectedPreset('custom');
      onDateRangeChange(startOfDay(date), endDate);
      setStartCalendarOpen(false);
    }
  };

  const handleEndDateSelect = (date?: Date) => {
    if (date) {
      setSelectedPreset('custom');
      onDateRangeChange(startDate, endOfDay(date));
      setEndCalendarOpen(false);
    }
  };

  const hasDateRange = startDate && endDate;
  const presetLabel = DATE_PRESETS.find(p => p.value === selectedPreset)?.label;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Date Range Filter</Label>
          {hasDateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePresetSelect('clear')}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-sm">Quick Selection</Label>
          <Select value={selectedPreset} onValueChange={handlePresetSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range..." />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom range</SelectItem>
              <SelectItem value="clear">Clear selection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Start Date</Label>
            <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Select start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateSelect}
                  disabled={(date) =>
                    date > new Date() || (endDate && date > endDate)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">End Date</Label>
            <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Select end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateSelect}
                  disabled={(date) =>
                    date > new Date() || (startDate && date < startDate)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Current Selection Display */}
        {hasDateRange && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {presetLabel || 'Custom Range'}
                </Badge>
                <span className="text-sm font-medium">
                  {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days selected
            </p>
          </div>
        )}

        {!hasDateRange && (
          <div className="p-3 border-2 border-dashed border-gray-200 rounded-md text-center">
            <p className="text-sm text-muted-foreground">
              No date range selected. All historical data will be included in the report.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}