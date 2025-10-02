'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { DailyActivityMetric } from '@/lib/types/dashboard';
import { TREND_ACTIVITY_COLORS, TREND_ACTIVITY_LABELS, type TrendActivityType } from '@/lib/constants/activity-types';
import { ActivityTypeSelector } from './ActivityTypeSelector';
import { DateRangePicker } from './DateRangePicker';
import { TrendsSkeleton } from './TrendsSkeleton';
import EmptyState from './EmptyState';

interface TrendsChartEnhancedProps {
  metrics: DailyActivityMetric[];
  dateRange: { start_date: string; end_date: string };
  isLoading?: boolean;
  onActivityTypesChange: (types: TrendActivityType[]) => void;
  onDateRangeChange: (start: Date | undefined, end: Date | undefined) => void;
  selectedActivityTypes: TrendActivityType[];
  className?: string;
}

export default function TrendsChartEnhanced({
  metrics,
  dateRange,
  isLoading = false,
  onActivityTypesChange,
  onDateRangeChange,
  selectedActivityTypes,
  className,
}: TrendsChartEnhancedProps) {
  // Format data for recharts
  const chartData = metrics.map(metric => ({
    date: new Date(metric.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    applications: metric.applications.count,
    enrollments: metric.enrollments.count,
    payments: metric.payments.count,
    staff_activities: metric.staff_activities.count,
    events: metric.events.count,
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Show empty state if no data
  if (!metrics || metrics.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Activity Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState type="trends" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Activity Trends
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Updating...
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DateRangePicker
            startDate={dateRange.start_date ? new Date(dateRange.start_date) : undefined}
            endDate={dateRange.end_date ? new Date(dateRange.end_date) : undefined}
            onDateChange={onDateRangeChange}
          />
          <ActivityTypeSelector
            selectedTypes={selectedActivityTypes}
            onChange={onActivityTypesChange}
          />
        </div>

        {/* Main Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {selectedActivityTypes.includes('applications') && (
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke={TREND_ACTIVITY_COLORS.applications}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={TREND_ACTIVITY_LABELS.applications}
                />
              )}
              {selectedActivityTypes.includes('enrollments') && (
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke={TREND_ACTIVITY_COLORS.enrollments}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={TREND_ACTIVITY_LABELS.enrollments}
                />
              )}
              {selectedActivityTypes.includes('payments') && (
                <Line
                  type="monotone"
                  dataKey="payments"
                  stroke={TREND_ACTIVITY_COLORS.payments}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={TREND_ACTIVITY_LABELS.payments}
                />
              )}
              {selectedActivityTypes.includes('staff_activities') && (
                <Line
                  type="monotone"
                  dataKey="staff_activities"
                  stroke={TREND_ACTIVITY_COLORS.staff_activities}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={TREND_ACTIVITY_LABELS.staff_activities}
                />
              )}
              {selectedActivityTypes.includes('events') && (
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke={TREND_ACTIVITY_COLORS.events}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name={TREND_ACTIVITY_LABELS.events}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
          {selectedActivityTypes.map(type => {
            const total = metrics.reduce((sum, m) => sum + (m[type]?.count || 0), 0);
            return (
              <div key={type} className="text-center p-3 rounded-lg" style={{
                backgroundColor: `${TREND_ACTIVITY_COLORS[type]}15`
              }}>
                <p className="text-2xl font-bold" style={{ color: TREND_ACTIVITY_COLORS[type] }}>
                  {total}
                </p>
                <p className="text-xs text-muted-foreground">{TREND_ACTIVITY_LABELS[type]}</p>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Showing data from {new Date(dateRange.start_date).toLocaleDateString()} to {new Date(dateRange.end_date).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
