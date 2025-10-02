'use client';

import { useState, useEffect, useRef } from 'react';
import TrendsChartEnhanced from './TrendsChartEnhanced.client';
import { TrendsErrorBoundary } from './TrendsErrorBoundary';
import { TrendsSkeleton } from './TrendsSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { TrendActivityType } from '@/lib/constants/activity-types';
import { TREND_ACTIVITY_TYPES } from '@/lib/constants/activity-types';

interface TrendsWidgetProps {
  schoolId: string;
  initialTrend?: 'weekly' | 'custom';
}

export default function TrendsWidget({ schoolId, initialTrend = 'weekly' }: TrendsWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<any>({ start_date: '', end_date: '' });
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<TrendActivityType[]>(
    TREND_ACTIVITY_TYPES
  );
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const isInitialMount = useRef(true);

  const fetchTrendsData = async (isInitialLoad = false) => {
    // For initial load, show skeleton. For updates, just show refreshing state
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Build query params
      const params = new URLSearchParams();
      params.set('trend', startDate && endDate ? 'custom' : 'weekly');

      if (startDate && endDate) {
        params.set('start_date', startDate.toISOString().split('T')[0]);
        params.set('end_date', endDate.toISOString().split('T')[0]);
      }

      if (selectedActivityTypes.length < TREND_ACTIVITY_TYPES.length) {
        params.set('activity_types', selectedActivityTypes.join(','));
      }

      const response = await fetch(`/api/admin/metrics?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to fetch trends data: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Only update metrics if we got data - keeps previous data visible during errors
        const newMetrics = data.data.metrics || [];
        const newDateRange = data.data.date_range || { start_date: '', end_date: '' };

        // Use React's state updater to prevent race conditions
        setMetrics(newMetrics);
        setDateRange(newDateRange);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
      // Don't clear metrics on error - keep showing previous data
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendsData(true);
  }, [schoolId]);

  useEffect(() => {
    // Skip initial mount - only fetch when user interacts
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchTrendsData(false);
  }, [selectedActivityTypes, startDate, endDate]);

  const handleActivityTypesChange = (types: TrendActivityType[]) => {
    setSelectedActivityTypes(types);
  };

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Show skeleton only on very first load
  const showSkeleton = isLoading && metrics.length === 0;

  return (
    <TrendsErrorBoundary>
      {showSkeleton ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendsSkeleton />
          </CardContent>
        </Card>
      ) : (
        <TrendsChartEnhanced
          metrics={metrics}
          dateRange={dateRange}
          isLoading={isRefreshing}
          onActivityTypesChange={handleActivityTypesChange}
          onDateRangeChange={handleDateRangeChange}
          selectedActivityTypes={selectedActivityTypes}
        />
      )}
    </TrendsErrorBoundary>
  );
}
