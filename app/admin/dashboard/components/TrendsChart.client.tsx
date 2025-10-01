// T024: Create TrendsChart client component
'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { TrendData } from '@/lib/types/dashboard';
import { CHART_COLORS, EMPTY_STATE_MESSAGES } from '../constants';
import EmptyState from './EmptyState';

interface TrendsChartProps {
  trends: TrendData;
  className?: string;
}

export default function TrendsChart({ trends, className }: TrendsChartProps) {
  const { period, dataPoints, trends: trendChanges } = trends;

  // Format data for recharts
  const chartData = dataPoints.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    applications: point.applications,
    enrollments: point.enrollments,
    engagement: point.teacherEngagement,
    revenue: point.revenue,
    capacity: point.capacityUtilization,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${
                entry.dataKey === 'revenue'
                  ? formatCurrency(entry.value)
                  : entry.dataKey === 'capacity' || entry.dataKey === 'engagement'
                  ? formatPercentage(entry.value)
                  : entry.value
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Show empty state if no data
  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div data-testid="trends-empty-state" className={className}>
        <EmptyState type="trends" />
      </div>
    );
  }

  return (
    <Card data-testid="trends-chart" className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            {period === 'week' ? 'Weekly' : period === 'month' ? 'Monthly' : 'Quarterly'} Trends
          </div>
          <Badge variant="outline" className="capitalize">
            {period}ly View
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Applications Trend */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              {getTrendIcon(trendChanges.applicationsChange)}
              <span className={`text-xs font-medium ml-1 ${getTrendColor(trendChanges.applicationsChange)}`}>
                {trendChanges.applicationsChange > 0 ? '+' : ''}{trendChanges.applicationsChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Applications</p>
          </div>

          {/* Enrollments Trend */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              {getTrendIcon(trendChanges.enrollmentsChange)}
              <span className={`text-xs font-medium ml-1 ${getTrendColor(trendChanges.enrollmentsChange)}`}>
                {trendChanges.enrollmentsChange > 0 ? '+' : ''}{trendChanges.enrollmentsChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Enrollments</p>
          </div>

          {/* Engagement Trend */}
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              {getTrendIcon(trendChanges.engagementChange)}
              <span className={`text-xs font-medium ml-1 ${getTrendColor(trendChanges.engagementChange)}`}>
                {trendChanges.engagementChange > 0 ? '+' : ''}{trendChanges.engagementChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>

          {/* Revenue Trend */}
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              {getTrendIcon(trendChanges.revenueChange)}
              <span className={`text-xs font-medium ml-1 ${getTrendColor(trendChanges.revenueChange)}`}>
                {trendChanges.revenueChange > 0 ? '+' : ''}{trendChanges.revenueChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>

          {/* Capacity Trend */}
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              {getTrendIcon(trendChanges.capacityChange)}
              <span className={`text-xs font-medium ml-1 ${getTrendColor(trendChanges.capacityChange)}`}>
                {trendChanges.capacityChange > 0 ? '+' : ''}{trendChanges.capacityChange.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Capacity</p>
          </div>
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

              <Line
                type="monotone"
                dataKey="applications"
                stroke={CHART_COLORS.PRIMARY}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Applications"
              />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke={CHART_COLORS.SUCCESS}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Enrollments"
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke={CHART_COLORS.INFO}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Teacher Engagement (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart (Separate for better scaling) */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Revenue Trend</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.WARNING}
                  fill={CHART_COLORS.WARNING}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Data from the last {period === 'week' ? '7 days' : period === 'month' ? '30 days' : '90 days'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}