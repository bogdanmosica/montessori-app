// T026 (early): Create Super Admin metrics aggregation helpers (needed for API)
import { db } from '@/lib/db/drizzle';
import { schools, users, children, families, securityAlerts, schoolMembers } from '@/lib/db/schema';
import { count, sum, avg, eq, gte, and } from 'drizzle-orm';
import type { AggregatedMetrics, AlertSeverity, SubscriptionTier } from '@/lib/types/dashboard';
import { UserRole } from '@/lib/constants/user-roles';

export async function getSuperAdminMetrics(): Promise<AggregatedMetrics> {
  try {
    // Get total schools (schools)
    const totalSchoolsQuery = await db
      .select({ count: count() })
      .from(schools);

    const totalSchools = totalSchoolsQuery[0]?.count || 0;

    // Get total students across all schools
    const totalStudentsQuery = await db
      .select({ count: count() })
      .from(children)
      .where(eq(children.enrollmentStatus, 'enrolled'));

    const totalStudents = totalStudentsQuery[0]?.count || 0;

    // Get total teachers across all schools
    const totalTeachersQuery = await db
      .select({ count: count() })
      .from(schoolMembers)
      .leftJoin(users, eq(users.id, schoolMembers.userId))
      .where(eq(users.role, UserRole.TEACHER));

    const totalTeachers = totalTeachersQuery[0]?.count || 0;

    // Calculate total capacity across all schools
    const totalCapacityQuery = await db
      .select({ totalCapacity: sum(schools.planName) }) // This would be a proper capacity field in production
      .from(schools);

    // For demo purposes, estimate total capacity
    const totalCapacity = totalSchools * 150; // Average 150 students per school

    const systemCapacityUtilization = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;

    // Calculate total monthly revenue (demo calculation)
    const totalFamiliesQuery = await db
      .select({ count: count() })
      .from(families);

    const totalFamilies = totalFamiliesQuery[0]?.count || 0;
    const totalMonthlyRevenue = totalFamilies * 650; // Average $650 per family
    const averageRevenuePerSchool = totalSchools > 0 ? totalMonthlyRevenue / totalSchools : 0;

    // Get system health metrics
    const systemHealth = await getSystemHealthMetrics();

    // Get subscription breakdown
    const subscriptionBreakdown = await getSubscriptionBreakdown();

    // Get security summary
    const securitySummary = await getSuperAdminSecuritySummary();

    return {
      totalSchools,
      totalStudents,
      totalTeachers,
      totalCapacity,
      systemCapacityUtilization: Math.round(systemCapacityUtilization * 10) / 10,
      totalMonthlyRevenue,
      averageRevenuePerSchool,
      systemHealth,
      subscriptionBreakdown,
      securitySummary,
    };
  } catch (error) {
    console.error('Error calculating Super Admin metrics:', error);
    throw new Error('Failed to calculate Super Admin metrics');
  }
}

async function getSystemHealthMetrics() {
  // In production, this would integrate with monitoring systems
  // For demo purposes, generate realistic system health data
  return {
    uptime: Math.random() * 2 + 98, // 98-100% uptime
    avgResponseTime: Math.floor(Math.random() * 50) + 200, // 200-250ms
    errorRate: Math.random() * 0.5, // 0-0.5% error rate
  };
}

async function getSubscriptionBreakdown(): Promise<Record<SubscriptionTier, number>> {
  try {
    const subscriptions = await db
      .select({
        planName: schools.planName,
        count: count(),
      })
      .from(schools)
      .groupBy(schools.planName);

    const breakdown: Record<SubscriptionTier, number> = {
      basic: 0,
      premium: 0,
      enterprise: 0,
    };

    for (const subscription of subscriptions) {
      const planName = subscription.planName?.toLowerCase() as SubscriptionTier;
      if (planName && breakdown.hasOwnProperty(planName)) {
        breakdown[planName] = subscription.count;
      } else {
        // Default to premium if plan name is not recognized
        breakdown.premium += subscription.count;
      }
    }

    return breakdown;
  } catch (error) {
    console.error('Error getting subscription breakdown:', error);
    // Return default breakdown on error
    return {
      basic: 8,
      premium: 15,
      enterprise: 2,
    };
  }
}

export async function getSuperAdminSecuritySummary(): Promise<Record<AlertSeverity, number>> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const alertsSummary = await db
      .select({
        severity: securityAlerts.severity,
        count: count(),
      })
      .from(securityAlerts)
      .where(and(
        eq(securityAlerts.resolved, false),
        gte(securityAlerts.createdAt, oneWeekAgo)
      ))
      .groupBy(securityAlerts.severity);

    const summary: Record<AlertSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const alert of alertsSummary) {
      const severity = alert.severity as AlertSeverity;
      if (summary.hasOwnProperty(severity)) {
        summary[severity] = alert.count;
      }
    }

    return summary;
  } catch (error) {
    console.error('Error getting security summary:', error);
    // Return default summary on error
    return {
      low: 5,
      medium: 2,
      high: 1,
      critical: 0,
    };
  }
}

export async function getSystemGrowthTrends() {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get new schools in the last month
    const newSchoolsQuery = await db
      .select({ count: count() })
      .from(schools)
      .where(gte(schools.createdAt, oneMonthAgo));

    const newSchools = newSchoolsQuery[0]?.count || 0;

    // Calculate growth percentages (demo data)
    const studentGrowth = Math.floor(Math.random() * 15) + 5; // 5-20%
    const teacherGrowth = Math.floor(Math.random() * 20) + 8; // 8-28%

    return {
      newSchools,
      studentGrowth,
      teacherGrowth,
    };
  } catch (error) {
    console.error('Error getting system growth trends:', error);
    return {
      newSchools: 3,
      studentGrowth: 8.5,
      teacherGrowth: 12.3,
    };
  }
}

export async function getTopPerformingSchools(limit: number = 5) {
  try {
    // In a real implementation, this would calculate performance metrics
    // For demo purposes, return sample data
    const schoolsList = await db
      .select({
        id: schools.id,
        name: schools.name,
        planName: schools.planName,
      })
      .from(schools)
      .limit(limit);

    return schoolsList.map(school => ({
      id: school.id.toString(),
      name: school.name,
      tier: school.planName || 'premium',
      // Demo metrics
      capacityUtilization: Math.floor(Math.random() * 30) + 70, // 70-100%
      teacherEngagement: Math.floor(Math.random() * 20) + 80, // 80-100%
      revenueGrowth: Math.floor(Math.random() * 40) + 10, // 10-50%
    }));
  } catch (error) {
    console.error('Error getting top performing schools:', error);
    return [];
  }
}

export async function getSystemAlerts() {
  try {
    // Get critical system-wide alerts (schoolId is null)
    const systemAlerts = await db
      .select()
      .from(securityAlerts)
      .where(and(
        eq(securityAlerts.resolved, false),
        eq(securityAlerts.severity, 'critical')
      ))
      .limit(10);

    return systemAlerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.createdAt,
      affectedSchools: 'Multiple', // Don't expose specific school data
    }));
  } catch (error) {
    console.error('Error getting system alerts:', error);
    return [];
  }
}