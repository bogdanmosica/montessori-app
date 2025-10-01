'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import useSWR from 'swr';

interface DashboardData {
  totalRevenue: number;
  totalPayments: number;
  pendingAmount: number;
  successfulPayments: number;
  activeAlertsCount: number;
  recentPayments: any[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardOverview() {
  // Get school ID from URL or context - for now using a placeholder
  const schoolId = 1; // TODO: Get from context/auth

  const { data, error, isLoading } = useSWR<DashboardData>(
    `/api/admin/payments/dashboard-v2?school_id=${schoolId}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Failed to load dashboard data
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    // Convert from cents to RON
    const ron = amount / 100;
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(ron);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Revenue This Month */}
      <MetricCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data ? formatCurrency(data.totalRevenue) : '$0.00'}
          </div>
          <p className="text-xs text-muted-foreground">
            +12% from last month
          </p>
        </CardContent>
      </MetricCard>

      {/* Pending Payments */}
      <MetricCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data ? formatCurrency(data.pendingAmount) : '$0.00'}
          </div>
          <p className="text-xs text-muted-foreground">
            Awaiting collection
          </p>
        </CardContent>
      </MetricCard>

      {/* Failed Payments */}
      <MetricCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {data?.successfulPayments || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </MetricCard>

      {/* Active Alerts */}
      <MetricCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data?.activeAlertsCount || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            System notifications
          </p>
        </CardContent>
      </MetricCard>
    </div>
  );
}