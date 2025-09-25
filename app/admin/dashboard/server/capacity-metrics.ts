// T013: Create capacity utilization helpers
import { db } from '@/lib/db/drizzle';
import { children, families, schoolSettings, applicationsNew } from '@/lib/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import type { AgeGroupCapacity } from '@/lib/types/dashboard';
import { DEFAULT_AGE_GROUPS } from '../constants';

export async function getCapacityMetrics(schoolId: string) {
  try {
    // Get school capacity settings
    const schoolSettingsData = await db
      .select()
      .from(schoolSettings)
      .where(eq(schoolSettings.schoolId, parseInt(schoolId)))
      .limit(1);

    const totalCapacity = schoolSettingsData[0]?.totalCapacity || 100;
    const ageGroupCapacitiesRaw = schoolSettingsData[0]?.ageGroupCapacities;

    // Parse age group capacities or use defaults
    let ageGroupCapacities;
    try {
      ageGroupCapacities = ageGroupCapacitiesRaw
        ? JSON.parse(ageGroupCapacitiesRaw)
        : DEFAULT_AGE_GROUPS.map(group => ({
            ageGroup: group.displayName,
            minAge: group.minAge,
            maxAge: group.maxAge,
            capacity: Math.floor(totalCapacity / 3), // Distribute evenly by default
          }));
    } catch {
      ageGroupCapacities = DEFAULT_AGE_GROUPS.map(group => ({
        ageGroup: group.displayName,
        minAge: group.minAge,
        maxAge: group.maxAge,
        capacity: Math.floor(totalCapacity / 3),
      }));
    }

    // Get current enrollments
    const activeEnrollments = await db
      .select({ count: count() })
      .from(children)
      .leftJoin(families, eq(families.id, children.familyId))
      .where(and(
        eq(families.schoolId, parseInt(schoolId)),
        eq(children.enrollmentStatus, 'enrolled')
      ));

    const activeEnrollmentCount = activeEnrollments[0]?.count || 0;
    const capacityUtilization = totalCapacity > 0 ? (activeEnrollmentCount / totalCapacity) * 100 : 0;

    // Get capacity by age group
    const capacityByAgeGroup = await getCapacityByAgeGroup(schoolId, ageGroupCapacities);

    // Get pending applications count
    const pendingApplications = await db
      .select({ count: count() })
      .from(applicationsNew)
      .where(and(
        eq(applicationsNew.schoolId, parseInt(schoolId)),
        eq(applicationsNew.status, 'pending')
      ));

    return {
      totalCapacity,
      activeEnrollments: activeEnrollmentCount,
      capacityUtilization: Math.round(capacityUtilization * 10) / 10, // Round to 1 decimal
      capacityByAgeGroup,
      pendingApplications: pendingApplications[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error calculating capacity metrics:', error);
    throw new Error('Failed to calculate capacity metrics');
  }
}

async function getCapacityByAgeGroup(
  schoolId: string,
  ageGroupCapacities: any[]
): Promise<AgeGroupCapacity[]> {
  const results: AgeGroupCapacity[] = [];

  for (const ageGroup of ageGroupCapacities) {
    // Calculate age in months from date of birth
    const enrollmentsByAge = await db
      .select({ count: count() })
      .from(children)
      .leftJoin(families, eq(families.id, children.familyId))
      .where(and(
        eq(families.schoolId, parseInt(schoolId)),
        eq(children.enrollmentStatus, 'enrolled'),
        sql`EXTRACT(YEAR FROM age(${children.dateOfBirth})) * 12 + EXTRACT(MONTH FROM age(${children.dateOfBirth})) BETWEEN ${ageGroup.minAge} AND ${ageGroup.maxAge}`
      ));

    const currentEnrollment = enrollmentsByAge[0]?.count || 0;
    const availableSpots = Math.max(0, ageGroup.capacity - currentEnrollment);

    results.push({
      ageGroup: ageGroup.ageGroup,
      minAge: ageGroup.minAge,
      maxAge: ageGroup.maxAge,
      capacity: ageGroup.capacity,
      currentEnrollment,
      availableSpots,
    });
  }

  return results;
}

export async function getCapacityAlerts(schoolId: string) {
  try {
    const metrics = await getCapacityMetrics(schoolId);
    const alerts = [];

    // Check overall capacity utilization
    if (metrics.capacityUtilization >= 95) {
      alerts.push({
        type: 'capacity_warning',
        severity: 'critical',
        message: `School is at ${metrics.capacityUtilization}% capacity - immediate action required`,
        metadata: { utilization: metrics.capacityUtilization }
      });
    } else if (metrics.capacityUtilization >= 90) {
      alerts.push({
        type: 'capacity_warning',
        severity: 'high',
        message: `School is approaching capacity limit at ${metrics.capacityUtilization}%`,
        metadata: { utilization: metrics.capacityUtilization }
      });
    } else if (metrics.capacityUtilization >= 75) {
      alerts.push({
        type: 'capacity_warning',
        severity: 'medium',
        message: `School capacity utilization is ${metrics.capacityUtilization}%`,
        metadata: { utilization: metrics.capacityUtilization }
      });
    }

    // Check age group specific capacity issues
    for (const ageGroup of metrics.capacityByAgeGroup) {
      const ageGroupUtilization = (ageGroup.currentEnrollment / ageGroup.capacity) * 100;

      if (ageGroupUtilization >= 95) {
        alerts.push({
          type: 'age_group_capacity',
          severity: 'high',
          message: `${ageGroup.ageGroup} is at ${Math.round(ageGroupUtilization)}% capacity`,
          metadata: { ageGroup: ageGroup.ageGroup, utilization: ageGroupUtilization }
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error generating capacity alerts:', error);
    return [];
  }
}

export async function getWaitlistMetrics(schoolId: string) {
  try {
    // Get school waitlist settings
    const schoolSettingsData = await db
      .select()
      .from(schoolSettings)
      .where(eq(schoolSettings.schoolId, parseInt(schoolId)))
      .limit(1);

    const waitlistLimit = schoolSettingsData[0]?.waitlistLimit || 50;

    // Get total waitlisted children
    const totalWaitlisted = await db
      .select({ count: count() })
      .from(children)
      .leftJoin(families, eq(families.id, children.familyId))
      .where(and(
        eq(families.schoolId, parseInt(schoolId)),
        eq(children.enrollmentStatus, 'waitlisted')
      ));

    const totalWaitlistedCount = totalWaitlisted[0]?.count || 0;

    // Get waitlist by age group
    const ageGroupCapacitiesRaw = schoolSettingsData[0]?.ageGroupCapacities;
    let ageGroupCapacities;
    try {
      ageGroupCapacities = ageGroupCapacitiesRaw
        ? JSON.parse(ageGroupCapacitiesRaw)
        : DEFAULT_AGE_GROUPS.map(group => ({
            ageGroup: group.displayName,
            minAge: group.minAge,
            maxAge: group.maxAge,
          }));
    } catch {
      ageGroupCapacities = DEFAULT_AGE_GROUPS.map(group => ({
        ageGroup: group.displayName,
        minAge: group.minAge,
        maxAge: group.maxAge,
      }));
    }

    const waitlistByAgeGroup = [];
    for (const ageGroup of ageGroupCapacities) {
      const waitlistedByAge = await db
        .select({ count: count() })
        .from(children)
        .leftJoin(families, eq(families.id, children.familyId))
        .where(and(
          eq(families.schoolId, parseInt(schoolId)),
          eq(children.enrollmentStatus, 'waitlisted'),
          sql`EXTRACT(YEAR FROM age(${children.dateOfBirth})) * 12 + EXTRACT(MONTH FROM age(${children.dateOfBirth})) BETWEEN ${ageGroup.minAge} AND ${ageGroup.maxAge}`
        ));

      const waitlisted = waitlistedByAge[0]?.count || 0;

      waitlistByAgeGroup.push({
        ageGroup: ageGroup.ageGroup,
        waitlisted,
      });
    }

    return {
      totalWaitlisted: totalWaitlistedCount,
      waitlistLimit,
      waitlistByAgeGroup,
    };
  } catch (error) {
    console.error('Error getting waitlist metrics:', error);
    throw new Error('Failed to get waitlist metrics');
  }
}

export async function calculateAgeGroupPlacement(dateOfBirth: Date) {
  const ageInMonths = calculateAgeInMonths(dateOfBirth);

  for (const group of DEFAULT_AGE_GROUPS) {
    if (ageInMonths >= group.minAge && ageInMonths <= group.maxAge) {
      return {
        ageGroup: group.name,
        displayName: group.displayName,
        ageInMonths,
      };
    }
  }

  // Fallback for children outside defined ranges
  if (ageInMonths < DEFAULT_AGE_GROUPS[0].minAge) {
    return {
      ageGroup: 'Infant',
      displayName: 'Infant (under 18 months)',
      ageInMonths,
    };
  }

  return {
    ageGroup: 'Youth',
    displayName: 'Youth (over 12 years)',
    ageInMonths,
  };
}

function calculateAgeInMonths(dateOfBirth: Date): number {
  const today = new Date();
  const years = today.getFullYear() - dateOfBirth.getFullYear();
  const months = today.getMonth() - dateOfBirth.getMonth();
  return years * 12 + months;
}