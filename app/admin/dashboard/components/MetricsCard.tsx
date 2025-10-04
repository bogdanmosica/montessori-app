// T019: Create MetricsCard server component
import React from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, TrendingUp, TrendingDown } from 'lucide-react';
import type { DashboardMetrics } from '@/lib/types/dashboard';
import { METRIC_CARD_VARIANTS } from '../constants';
import Link from 'next/link';

interface MetricsCardProps {
  metrics: DashboardMetrics;
  className?: string;
}

export default function MetricsCard({ metrics, className }: MetricsCardProps) {
  const {
    pendingApplications,
    activeEnrollments,
    totalCapacity,
    capacityUtilization,
    teacherActivity
  } = metrics;

  const getCapacityVariant = (utilization: number) => {
    if (utilization >= 90) return METRIC_CARD_VARIANTS.DANGER;
    if (utilization >= 75) return METRIC_CARD_VARIANTS.WARNING;
    if (utilization >= 50) return METRIC_CARD_VARIANTS.SUCCESS;
    return METRIC_CARD_VARIANTS.DEFAULT;
  };

  const getEngagementScore = () => {
    if (teacherActivity.totalTeachers === 0) return 0;
    return Math.round((teacherActivity.activeTeachers / teacherActivity.totalTeachers) * 100);
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Pending Applications Card */}
      <MetricCard data-testid="metrics-card-applications">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingApplications}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting review
          </p>
          {pendingApplications > 0 && (
            <Button asChild variant="link" className="px-0 mt-2 h-auto">
              <Link href="/admin/applications">
                Review Applications
              </Link>
            </Button>
          )}
        </CardContent>
      </MetricCard>

      {/* Active Enrollments Card */}
      <MetricCard data-testid="metrics-card-enrollments">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeEnrollments}</div>
          <p className="text-xs text-muted-foreground">
            of {totalCapacity} capacity
          </p>
          <Button asChild variant="link" className="px-0 mt-2 h-auto">
            <Link href="/admin/applications">
              View Students
            </Link>
          </Button>
        </CardContent>
      </MetricCard>

      {/* Capacity Utilization Card */}
      <MetricCard data-testid="metrics-card-capacity">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
          <div className="h-4 w-4">
            {capacityUtilization >= 75 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-orange-600" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{capacityUtilization}%</div>
          <Badge
            variant={
              getCapacityVariant(capacityUtilization) === METRIC_CARD_VARIANTS.DANGER ? 'destructive' :
              getCapacityVariant(capacityUtilization) === METRIC_CARD_VARIANTS.WARNING ? 'secondary' :
              'default'
            }
            className="mt-2"
          >
            {capacityUtilization >= 90 ? 'Near Capacity' :
             capacityUtilization >= 75 ? 'Good Utilization' :
             capacityUtilization >= 50 ? 'Moderate' : 'Low Utilization'}
          </Badge>
        </CardContent>
      </MetricCard>

      {/* Teacher Engagement Card */}
      <MetricCard data-testid="metrics-card-teachers">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Teacher Engagement</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getEngagementScore()}%</div>
          <p className="text-xs text-muted-foreground">
            {teacherActivity.activeTeachers} of {teacherActivity.totalTeachers} active this week
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            <div>Avg session: {teacherActivity.avgSessionDuration}min</div>
            <div>{teacherActivity.classroomUpdates} updates this week</div>
          </div>
        </CardContent>
      </MetricCard>
    </div>
  );
}