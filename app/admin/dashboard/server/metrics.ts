// T016: Create consolidated metrics service
import { getCashflowMetrics } from './cashflow-metrics';
import { getCapacityMetrics } from './capacity-metrics';
import { getSecurityAlerts } from './security-alerts';
import { getTeacherActivityMetrics } from './teacher-metrics';
import { db } from '@/lib/db/drizzle';
import { teams, schoolSettings, subscriptionTierEnum, subscriptionStateEnum } from '@/lib/db/schema';
import { eq, count, sum } from 'drizzle-orm';
import type { DashboardMetrics, TrendData, TrendDataPoint } from '@/lib/types/dashboard';

export async function getDashboardMetrics(
  schoolId: string,
  options: {
    period?: 'week' | 'month' | 'quarter';
    includeAlerts?: boolean;
    includeTrends?: boolean;
  } = {}
): Promise<{
  school: {
    id: string;
    name: string;
    lastUpdated: string;
  };
  metrics: DashboardMetrics;
  securityAlerts: any[];
  trends?: TrendData;
}> {
  try {
    const {
      period = 'week',
      includeAlerts = true,
      includeTrends = true
    } = options;

    // Get school information
    const schoolData = await db
      .select()
      .from(teams)
      .where(eq(teams.id, parseInt(schoolId)))
      .limit(1);

    if (!schoolData[0]) {
      throw new Error('School not found');
    }

    const school = {
      id: schoolId,
      name: schoolData[0].name,
      lastUpdated: new Date().toISOString(),
    };

    // Get all metrics in parallel for performance
    const [
      cashflowMetrics,
      capacityMetrics,
      teacherActivity,
      subscriptionStatus,
      securityAlerts,
      trends
    ] = await Promise.all([
      getCashflowMetrics(schoolId),
      getCapacityMetrics(schoolId),
      getTeacherActivityMetrics(schoolId),
      getSubscriptionStatus(schoolId),
      includeAlerts ? getSecurityAlerts(schoolId, { includeResolved: false, limit: 10 }) : [],
      includeTrends ? getTrendData(schoolId, period) : null
    ]);

    // Combine all metrics
    const metrics: DashboardMetrics = {
      schoolId,
      timestamp: new Date(),
      pendingApplications: capacityMetrics.pendingApplications,
      activeEnrollments: capacityMetrics.activeEnrollments,
      totalCapacity: capacityMetrics.totalCapacity,
      capacityUtilization: capacityMetrics.capacityUtilization,
      teacherActivity,
      subscriptionStatus,
      securityAlerts,
      cashflowMetrics,
      capacityByAgeGroup: capacityMetrics.capacityByAgeGroup,
    };

    return {
      school,
      metrics,
      securityAlerts,
      trends: trends || undefined,
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw new Error('Failed to get dashboard metrics');
  }
}

async function getSubscriptionStatus(schoolId: string) {
  try {
    const schoolData = await db
      .select()
      .from(teams)
      .where(eq(teams.id, parseInt(schoolId)))
      .limit(1);

    if (!schoolData[0]) {
      throw new Error('School not found');
    }

    // Get current enrollment count to check against limits
    const capacityMetrics = await getCapacityMetrics(schoolId);

    // Default subscription for demo purposes
    // In production, this would come from Stripe or subscription management system
    const subscriptionStatus = {
      tier: schoolData[0].planName as any || 'premium',
      state: schoolData[0].subscriptionStatus as any || 'active',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      studentsUsed: capacityMetrics.activeEnrollments,
      studentsLimit: getTierLimit(schoolData[0].planName || 'premium'),
      daysUntilExpiry: undefined,
    };

    return subscriptionStatus;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    // Return default status on error
    return {
      tier: 'premium' as const,
      state: 'active' as const,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      studentsUsed: 0,
      studentsLimit: 200,
      daysUntilExpiry: undefined,
    };
  }
}

function getTierLimit(planName: string): number {
  switch (planName) {
    case 'basic':
      return 50;
    case 'premium':
      return 200;
    case 'enterprise':
      return 999999; // Unlimited
    default:
      return 200;
  }
}

async function getTrendData(
  schoolId: string,
  period: 'week' | 'month' | 'quarter'
): Promise<TrendData> {
  try {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // For demo purposes, generate sample trend data
    // In production, this would query historical data tables
    const dataPoints: TrendDataPoint[] = [];
    const currentMetrics = await getDashboardMetrics(schoolId, {
      includeAlerts: false,
      includeTrends: false
    });

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate realistic trend data with some variation
      const baseApplications = currentMetrics.metrics.pendingApplications;
      const baseEnrollments = currentMetrics.metrics.activeEnrollments;
      const baseEngagement = currentMetrics.metrics.teacherActivity.activeTeachers > 0
        ? (currentMetrics.metrics.teacherActivity.activeTeachers / currentMetrics.metrics.teacherActivity.totalTeachers) * 100
        : 75;
      const baseRevenue = currentMetrics.metrics.cashflowMetrics.currentMonthRevenue;
      const baseCapacity = currentMetrics.metrics.capacityUtilization;

      dataPoints.push({
        date,
        applications: Math.max(0, baseApplications + Math.floor(Math.random() * 6) - 3),
        enrollments: Math.max(0, baseEnrollments + Math.floor(Math.random() * 4) - 2),
        teacherEngagement: Math.max(0, baseEngagement + Math.floor(Math.random() * 20) - 10),
        revenue: Math.max(0, baseRevenue + (Math.random() * 1000) - 500),
        capacityUtilization: Math.max(0, baseCapacity + (Math.random() * 10) - 5),
      });
    }

    // Calculate percentage changes
    const firstPoint = dataPoints[0];
    const lastPoint = dataPoints[dataPoints.length - 1];

    const trends = {
      applicationsChange: firstPoint.applications > 0
        ? ((lastPoint.applications - firstPoint.applications) / firstPoint.applications) * 100
        : 0,
      enrollmentsChange: firstPoint.enrollments > 0
        ? ((lastPoint.enrollments - firstPoint.enrollments) / firstPoint.enrollments) * 100
        : 0,
      engagementChange: firstPoint.teacherEngagement > 0
        ? ((lastPoint.teacherEngagement - firstPoint.teacherEngagement) / firstPoint.teacherEngagement) * 100
        : 0,
      revenueChange: firstPoint.revenue > 0
        ? ((lastPoint.revenue - firstPoint.revenue) / firstPoint.revenue) * 100
        : 0,
      capacityChange: firstPoint.capacityUtilization > 0
        ? ((lastPoint.capacityUtilization - firstPoint.capacityUtilization) / firstPoint.capacityUtilization) * 100
        : 0,
    };

    return {
      period,
      dataPoints,
      trends,
    };
  } catch (error) {
    console.error('Error getting trend data:', error);
    // Return empty trend data on error
    return {
      period,
      dataPoints: [],
      trends: {
        applicationsChange: 0,
        enrollmentsChange: 0,
        engagementChange: 0,
        revenueChange: 0,
        capacityChange: 0,
      },
    };
  }
}

export async function validateSchoolAccess(schoolId: string, userSchoolId?: string, userRole?: string): Promise<boolean> {
  // Super Admin can access any school
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Regular admin can only access their own school
  if (userRole === 'ADMIN' || userRole === 'admin') {
    return schoolId === userSchoolId;
  }

  return false;
}