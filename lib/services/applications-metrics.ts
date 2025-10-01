import { db } from '../db/drizzle';
import { applications, children, schoolSettings, enrollments, teams } from '../db/schema';
import { eq, count, and, or } from 'drizzle-orm';

export interface ApplicationsMetrics {
  pendingApplications: number;
  activeEnrollments: number;
  totalApplications: number;
  capacityUsed: {
    percentage: number;
    enrolled: number;
    totalCapacity: number;
  };
}

/**
 * Get metrics for the applications page
 */
export async function getApplicationsMetrics(schoolId: number): Promise<ApplicationsMetrics> {
  try {
    // Get pending applications count
    const pendingApplicationsResult = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          eq(applications.schoolId, schoolId),
          eq(applications.status, 'PENDING')
        )
      );

    const pendingApplications = pendingApplicationsResult[0]?.count || 0;

    // Get active enrollments count (from enrollment records, not children)
    const activeEnrollmentsResult = await db
      .select({ count: count() })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.schoolId, schoolId),
          eq(enrollments.status, 'active')
        )
      );

    const activeEnrollments = activeEnrollmentsResult[0]?.count || 0;

    // Get total applications count (all statuses)
    const totalApplicationsResult = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.schoolId, schoolId));

    const totalApplications = totalApplicationsResult[0]?.count || 0;

    // Get school capacity settings
    const schoolResult = await db
      .select({
        totalCapacity: teams.maximumCapacity,
      })
      .from(teams)
      .where(eq(teams.id, schoolId))
      .limit(1);

    const totalCapacity = schoolResult[0]?.totalCapacity || 200; // Default fallback
    const capacityPercentage = totalCapacity > 0 ? Math.round((activeEnrollments / totalCapacity) * 100 * 10) / 10 : 0;

    return {
      pendingApplications,
      activeEnrollments,
      totalApplications,
      capacityUsed: {
        percentage: capacityPercentage,
        enrolled: activeEnrollments,
        totalCapacity,
      },
    };
  } catch (error) {
    console.error('Error fetching applications metrics:', error);
    
    // Return fallback metrics in case of error
    return {
      pendingApplications: 0,
      activeEnrollments: 0,
      totalApplications: 0,
      capacityUsed: {
        percentage: 0,
        enrolled: 0,
        totalCapacity: 200,
      },
    };
  }
}