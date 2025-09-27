// T025: Create main dashboard page composition
import React, { Suspense } from 'react';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { getDashboardContext, requireAdminPermissions } from '@/lib/auth/dashboard-context';
import { getDashboardMetrics } from './server/metrics';
import { getSuperAdminMetrics } from './server/super-admin-metrics';

// Server Components
import MetricsCard from './components/MetricsCard';
import CashflowCard from './components/CashflowCard';
import CapacityCard from './components/CapacityCard';
import AlertsBanner from './components/AlertsBanner';
import EmptyState from './components/EmptyState';

// Client Components
import TrendsChart from './components/TrendsChart.client';

// Admin Components
import AdminNavigation from '@/components/admin/admin-navigation';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  BarChart3,
  Users,
  Shield,
  RefreshCw,
  ExternalLink,
  Settings
} from 'lucide-react';
import Link from 'next/link';

// Loading components
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
        <div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}

// Super Admin Dashboard
async function SuperAdminDashboard() {
  try {
    const systemMetrics = await getSuperAdminMetrics();

    return (
      <div className="space-y-8">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="total-schools-metric">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.totalSchools}</div>
              <p className="text-xs text-muted-foreground">Across all regions</p>
            </CardContent>
          </Card>

          <Card data-testid="total-students-metric">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.totalStudents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {systemMetrics.systemCapacityUtilization.toFixed(1)}% system capacity
              </p>
            </CardContent>
          </Card>

          <Card data-testid="total-revenue-metric">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${systemMetrics.totalMonthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ${systemMetrics.averageRevenuePerSchool.toLocaleString()} avg per school
              </p>
            </CardContent>
          </Card>

          <Card data-testid="system-health-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {systemMetrics.systemHealth.uptime.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {systemMetrics.systemHealth.avgResponseTime}ms avg response
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription Breakdown */}
          <Card data-testid="subscription-breakdown">
            <CardHeader>
              <CardTitle>Subscription Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(systemMetrics.subscriptionBreakdown).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {tier}
                    </Badge>
                    <span className="text-sm">
                      <span data-testid={`${tier}-tier-count`}>{count}</span> schools
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {((count / systemMetrics.totalSchools) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(systemMetrics.securitySummary).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={severity === 'critical' || severity === 'high' ? 'destructive' : 'secondary'}
                      className="capitalize"
                    >
                      {severity}
                    </Badge>
                    <span className="text-sm">{count} alerts</span>
                  </div>
                  {count > 0 && severity === 'critical' && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/security">
                        Review
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
              {Object.values(systemMetrics.securitySummary).every(count => count === 0) && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  All systems secure
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Metrics */}
        <Card data-testid="system-uptime">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemMetrics.systemHealth.uptime.toFixed(2)}%
              </div>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center" data-testid="avg-response-time">
              <div className="text-2xl font-bold">
                {systemMetrics.systemHealth.avgResponseTime}ms
              </div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
            </div>
            <div className="text-center" data-testid="error-rate">
              <div className="text-2xl font-bold text-orange-600">
                {systemMetrics.systemHealth.errorRate.toFixed(2)}%
              </div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error loading Super Admin dashboard:', error);
    return <EmptyState type="established_school" />;
  }
}

// Regular School Dashboard
async function SchoolDashboard({ schoolId, context }: { schoolId: string; context: any }) {
  try {
    const dashboardData = await getDashboardMetrics(schoolId, {
      period: 'week',
      includeAlerts: true,
      includeTrends: true,
    });

    const { school, metrics, securityAlerts, trends } = dashboardData;
    const hasData = metrics.activeEnrollments > 0 || metrics.pendingApplications > 0;

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back to {school.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-xs">
              Last updated: {new Date(school.lastUpdated).toLocaleTimeString()}
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Security Alerts - Always show if present */}
        {securityAlerts && securityAlerts.length > 0 && (
          <AlertsBanner alerts={securityAlerts} />
        )}

        {/* Main Metrics */}
        <MetricsCard metrics={metrics} />

        <Separator />

        {/* School-specific content based on data availability */}
        {!hasData ? (
          <EmptyState type="new_school" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Charts and Trends */}
            <div className="lg:col-span-2 space-y-6">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                {trends && trends.dataPoints.length > 0 ? (
                  <TrendsChart trends={trends} />
                ) : (
                  <EmptyState type="trends" />
                )}
              </Suspense>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cashflow Card */}
              <CashflowCard cashflowMetrics={metrics.cashflowMetrics} />

              {/* Capacity Card */}
              <CapacityCard
                capacityByAgeGroup={metrics.capacityByAgeGroup}
                totalCapacity={metrics.totalCapacity}
                activeEnrollments={metrics.activeEnrollments}
                capacityUtilization={metrics.capacityUtilization}
              />
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading school dashboard:', error);
    return <EmptyState type="established_school" />;
  }
}

// Main Page Component
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  try {
    requireAdminPermissions(session.user.role);
  } catch {
    redirect('/unauthorized');
  }

  const context = await getDashboardContext();

  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          {context.isSuper ? (
            <SuperAdminDashboard />
          ) : context.schoolId ? (
            <SchoolDashboard schoolId={context.schoolId} context={context} />
          ) : (
            <EmptyState type="established_school" />
          )}
        </Suspense>
      </div>
    </div>
  );
}