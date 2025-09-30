// T020: Create CashflowCard server component
import React from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import type { CashflowMetrics } from '@/lib/types/dashboard';
import Link from 'next/link';

interface CashflowCardProps {
  cashflowMetrics: CashflowMetrics;
  className?: string;
}

export default function CashflowCard({ cashflowMetrics, className }: CashflowCardProps) {
  const {
    currentMonthRevenue,
    projectedMonthlyRevenue,
    baseFeePerChild,
    totalFamilies,
    totalChildren,
    averageRevenuePerFamily,
    discountsSavings,
    revenueBreakdown
  } = cashflowMetrics;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const revenueGrowth = currentMonthRevenue > 0
    ? ((projectedMonthlyRevenue - currentMonthRevenue) / currentMonthRevenue) * 100
    : 0;

  const hasPaymentIssues = revenueBreakdown.pendingPayments > 0 || revenueBreakdown.overduePayments > 0;

  return (
    <MetricCard data-testid="cashflow-card" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Monthly Cashflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Current Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(currentMonthRevenue)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Projected</p>
            <p className="text-2xl font-bold">
              {formatCurrency(projectedMonthlyRevenue)}
            </p>
            {revenueGrowth > 0 && (
              <Badge variant="default" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{revenueGrowth.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Family & Child Breakdown */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalFamilies}</p>
            <p className="text-muted-foreground">Families</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{totalChildren}</p>
            <p className="text-muted-foreground">Children</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{formatCurrency(averageRevenuePerFamily)}</p>
            <p className="text-muted-foreground">Avg/Family</p>
          </div>
        </div>

        <Separator />

        {/* Revenue Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Revenue Breakdown</h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Single Child Families ({revenueBreakdown.singleChildFamilies.count})</span>
              <span className="font-medium">{formatCurrency(revenueBreakdown.singleChildFamilies.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Multi-Child Families ({revenueBreakdown.multiChildFamilies.count})</span>
              <span className="font-medium">{formatCurrency(revenueBreakdown.multiChildFamilies.revenue)}</span>
            </div>
          </div>

          {discountsSavings > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Sibling Discounts</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Families saved {formatCurrency(discountsSavings)} this month through sibling discounts
              </p>
            </div>
          )}
        </div>

        {/* Payment Issues Alert */}
        {hasPaymentIssues && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Payment Issues</span>
            </div>
            <div className="mt-2 text-xs text-orange-700">
              {revenueBreakdown.pendingPayments > 0 && (
                <div>Pending: {formatCurrency(revenueBreakdown.pendingPayments)}</div>
              )}
              {revenueBreakdown.overduePayments > 0 && (
                <div>Overdue: {formatCurrency(revenueBreakdown.overduePayments)}</div>
              )}
            </div>
            <Button asChild variant="link" className="px-0 mt-2 h-auto text-orange-700">
              <Link href="/admin/payments">
                Manage Payments
              </Link>
            </Button>
          </div>
        )}

        {/* Base Fee Information */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Base fee: {formatCurrency(baseFeePerChild)} per child per month
        </div>
      </CardContent>
    </MetricCard>
  );
}