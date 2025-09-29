// T016: Create consolidated metrics service
import { getCapacityMetrics } from './capacity-metrics';
import { getSecurityAlerts } from './security-alerts';
import { getTeacherActivityMetrics } from './teacher-metrics';
import { TrendsService } from '@/lib/services/trends-service';
import { db } from '@/lib/db';
import { teams, schoolSettings, children, payments, families } from '@/lib/db/schema';
import { eq, and, sum, count, gte, lt } from 'drizzle-orm';
import type { DashboardMetrics, TrendData, TrendDataPoint, CashflowMetrics, RevenueBreakdown } from '@/lib/types/dashboard';
import { UserRole } from '@/lib/constants/user-roles';

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

    // Get capacity metrics first
    const capacityMetrics = await getCapacityMetrics(schoolId);

    // Get real cashflow metrics using actual database data
    const cashflowMetrics = await calculateCashflowMetrics(schoolId);

    // Get remaining metrics in parallel
    const [
      teacherActivity,
      subscriptionStatus,
      securityAlerts,
      trends
    ] = await Promise.all([
      getTeacherActivityMetrics(schoolId),
      getSubscriptionStatus(schoolId),
      includeAlerts ? getSecurityAlerts(schoolId, { includeResolved: false, limit: 10 }) : [],
      includeTrends ? TrendsService.getTrendData(schoolId, period) : null
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



export async function validateSchoolAccess(schoolId: string, userSchoolId?: string, userRole?: string): Promise<boolean> {
  // Regular admin can only access their own school
  if (userRole === UserRole.ADMIN) {
    return schoolId === userSchoolId;
  }

  return false;
}

async function getMockTrendDataWithRealCalculations(
  schoolId: string,
  period: 'week' | 'month' | 'quarter'
): Promise<TrendData> {
  try {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const dataPoints: TrendDataPoint[] = [];
    
    // Get current metrics to base trends on
    const currentMetrics = await getDashboardMetrics(schoolId, {
      includeAlerts: false,
      includeTrends: false
    });

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Create realistic trend data with meaningful progression
      const dayFactor = (days - i) / days; // 0 to 1 progression
      const baseApplications = currentMetrics.metrics.pendingApplications;
      const baseEnrollments = currentMetrics.metrics.activeEnrollments;
      const baseRevenue = currentMetrics.metrics.cashflowMetrics.currentMonthRevenue;
      
      dataPoints.push({
        date,
        applications: Math.round(Math.max(0, dayFactor * baseApplications + Math.random() * 2)),
        enrollments: Math.round(Math.max(0, dayFactor * baseEnrollments + Math.random() * 1)),
        teacherEngagement: Math.round(70 + dayFactor * 25 + Math.random() * 10),
        revenue: Math.round(dayFactor * baseRevenue + Math.random() * 200),
        capacityUtilization: Math.round(Math.max(0, currentMetrics.metrics.capacityUtilization + (Math.random() - 0.5) * 5)),
      });
    }

    // Calculate trends with improvement
    const firstHalf = dataPoints.slice(0, Math.floor(days / 2));
    const secondHalf = dataPoints.slice(Math.floor(days / 2));
    
    const calculateTrend = (first: number[], second: number[]): number => {
      const firstAvg = first.reduce((a, b) => a + b, 0) / first.length || 1;
      const secondAvg = second.reduce((a, b) => a + b, 0) / second.length || 1;
      return ((secondAvg - firstAvg) / firstAvg) * 100;
    };

    const trends = {
      applicationsChange: calculateTrend(
        firstHalf.map(p => p.applications), 
        secondHalf.map(p => p.applications)
      ),
      enrollmentsChange: calculateTrend(
        firstHalf.map(p => p.enrollments), 
        secondHalf.map(p => p.enrollments)
      ),
      engagementChange: calculateTrend(
        firstHalf.map(p => p.teacherEngagement), 
        secondHalf.map(p => p.teacherEngagement)
      ),
      revenueChange: calculateTrend(
        firstHalf.map(p => p.revenue), 
        secondHalf.map(p => p.revenue)
      ),
      capacityChange: calculateTrend(
        firstHalf.map(p => p.capacityUtilization), 
        secondHalf.map(p => p.capacityUtilization)
      ),
    };

    return {
      period,
      dataPoints,
      trends,
    };
  } catch (error) {
    console.error('Error getting mock trend data:', error);
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

async function calculateCashflowMetrics(schoolId: string): Promise<CashflowMetrics> {
  try {
    console.log('🔄 Calculating real cashflow metrics for school:', schoolId);
    // Get school settings for base fee
    const schoolSettingsData = await db
      .select()
      .from(schoolSettings)
      .where(eq(schoolSettings.schoolId, parseInt(schoolId)))
      .limit(1);

    const baseFeePerChild = schoolSettingsData[0]?.baseFeePerChild || 65000; // cents

    // Get all children with their actual monthly fees
    const childrenWithFees = await db
      .select({
        id: children.id,
        monthlyFee: children.monthlyFee,
        enrollmentStatus: children.enrollmentStatus,
      })
      .from(children)
      .where(and(
        eq(children.schoolId, parseInt(schoolId)),
        eq(children.enrollmentStatus, 'ACTIVE')
      ));

    const totalChildren = childrenWithFees.length;

    // Calculate current monthly revenue from actual child fees
    const currentMonthRevenue = childrenWithFees.reduce((sum, child) => {
      return sum + (child.monthlyFee || 0);
    }, 0);

    // Estimate families (assuming average of 1.5 children per family)
    const estimatedFamilies = Math.max(1, Math.round(totalChildren / 1.5));

    // Calculate average revenue per family
    const averageRevenuePerFamily = estimatedFamilies > 0 ? currentMonthRevenue / estimatedFamilies : 0;

    // Calculate discounts savings (difference between full price and actual fees)
    const fullPriceRevenue = totalChildren * baseFeePerChild;
    const discountsSavings = Math.max(0, fullPriceRevenue - currentMonthRevenue);

    // Estimate single vs multi-child families based on discounts
    const averageFeePerChild = totalChildren > 0 ? currentMonthRevenue / totalChildren : baseFeePerChild;
    const discountPerChild = baseFeePerChild - averageFeePerChild;
    const estimatedMultiChildFamilies = Math.round((discountPerChild * totalChildren) / (baseFeePerChild * 0.2)); // Assume 20% discount
    const estimatedSingleChildFamilies = Math.max(0, estimatedFamilies - estimatedMultiChildFamilies);

    const revenueBreakdown: RevenueBreakdown = {
      singleChildFamilies: {
        count: estimatedSingleChildFamilies,
        revenue: (estimatedSingleChildFamilies * baseFeePerChild) / 100, // Convert to dollars
      },
      multiChildFamilies: {
        count: estimatedMultiChildFamilies,
        revenue: (currentMonthRevenue - (estimatedSingleChildFamilies * baseFeePerChild)) / 100, // Convert to dollars
        totalSavingsFromDiscounts: discountsSavings / 100, // Convert to dollars
      },
      pendingPayments: 0, // TODO: Calculate based on payment status
      overduePayments: 0, // TODO: Calculate based on payment due dates
    };

    return {
      currentMonthRevenue: currentMonthRevenue / 100, // Convert cents to dollars
      projectedMonthlyRevenue: currentMonthRevenue / 100, // Same as current for now
      baseFeePerChild: baseFeePerChild / 100, // Convert to dollars
      totalFamilies: estimatedFamilies,
      totalChildren,
      averageRevenuePerFamily: Math.round(averageRevenuePerFamily) / 100, // Convert to dollars
      discountsSavings: discountsSavings / 100, // Convert to dollars
      revenueBreakdown,
    };
  } catch (error) {
    console.error('Error calculating cashflow metrics:', error);

    // Return default values on error
    return {
      currentMonthRevenue: 0,
      projectedMonthlyRevenue: 0,
      baseFeePerChild: 650, // $650 in dollars
      totalFamilies: 0,
      totalChildren: 0,
      averageRevenuePerFamily: 0,
      discountsSavings: 0,
      revenueBreakdown: {
        singleChildFamilies: { count: 0, revenue: 0 },
        multiChildFamilies: { count: 0, revenue: 0, totalSavingsFromDiscounts: 0 },
        pendingPayments: 0,
        overduePayments: 0,
      },
    };
  }
}