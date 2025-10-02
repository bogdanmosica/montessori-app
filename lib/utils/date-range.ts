/**
 * Date range utility functions for trend analysis
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
  totalDays: number;
}

/**
 * Get date range for weekly trends (last 7 days)
 */
export function getWeeklyDateRange(): DateRange {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
  startDate.setHours(0, 0, 0, 0);

  return {
    startDate,
    endDate,
    totalDays: 7
  };
}

/**
 * Get custom date range with validation
 */
export function getCustomDateRange(start: Date, end: Date): DateRange {
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  // Validate date range
  if (startDate > endDate) {
    throw new Error('Start date must be before end date');
  }

  if (endDate > new Date()) {
    throw new Error('End date cannot be in the future');
  }

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (totalDays > 365) {
    throw new Error('Date range cannot exceed 365 days');
  }

  return {
    startDate,
    endDate,
    totalDays
  };
}

/**
 * Generate array of dates for a given range
 */
export function generateDateArray(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date object
 */
export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Check if date is a business day (Monday-Friday)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

/**
 * Get date at start of day (00:00:00)
 */
export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get date at end of day (23:59:59)
 */
export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Compare dates (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get days difference between two dates
 */
export function getDaysDifference(start: Date, end: Date): number {
  const startDay = getStartOfDay(start);
  const endDay = getStartOfDay(end);
  return Math.ceil((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
}
