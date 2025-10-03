'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

/**
 * Date Picker (Client Component)
 *
 * Allows teachers to select a date for attendance viewing/recording.
 * Updates URL search params to maintain state.
 */
interface DatePickerProps {
  currentDate: string;
}

export default function DatePicker({ currentDate }: DatePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState<Date>(new Date(currentDate));

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;

    setDate(newDate);

    // Update URL with new date
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', format(newDate, 'yyyy-MM-dd'));

    router.push(`/teacher/attendance?${params.toString()}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(date, 'PPP')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
