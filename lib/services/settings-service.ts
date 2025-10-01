import { db } from '@/lib/db';
import { teams, schoolSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { SettingsUpdateRequest, AgeGroupCapacity } from '@/lib/validations/settings-schema';

/**
 * Settings data type matching database schema
 */
export interface SchoolSettings {
  schoolId: number;
  defaultMonthlyFeeRon: string; // Decimal value as string
  freeEnrollmentCount: number;
  maximumCapacity: number;
  ageGroupCapacities?: AgeGroupCapacity[];
  settingsUpdatedAt: Date | null;
}

/**
 * Settings service for school configuration management
 */
export class SettingsService {
  /**
   * Get school settings by school ID
   */
  static async getSettings(schoolId: number): Promise<SchoolSettings | null> {
    try {
      const result = await db
        .select({
          schoolId: teams.id,
          defaultMonthlyFeeRon: teams.defaultMonthlyFeeRon,
          freeEnrollmentCount: teams.freeEnrollmentCount,
          maximumCapacity: teams.maximumCapacity,
          settingsUpdatedAt: teams.settingsUpdatedAt,
        })
        .from(teams)
        .where(eq(teams.id, schoolId))
        .limit(1);

      if (!result || result.length === 0) {
        return null;
      }

      const school = result[0];

      // Get age group capacities from school_settings table
      const schoolSettingsResult = await db
        .select({
          ageGroupCapacities: schoolSettings.ageGroupCapacities,
        })
        .from(schoolSettings)
        .where(eq(schoolSettings.schoolId, schoolId))
        .limit(1);

      let ageGroupCapacities: AgeGroupCapacity[] | undefined;
      if (schoolSettingsResult.length > 0 && schoolSettingsResult[0].ageGroupCapacities) {
        try {
          ageGroupCapacities = JSON.parse(schoolSettingsResult[0].ageGroupCapacities);
        } catch (error) {
          console.warn('Failed to parse age group capacities JSON:', error);
        }
      }

      return {
        schoolId: school.schoolId,
        defaultMonthlyFeeRon: school.defaultMonthlyFeeRon ?? '0.00',
        freeEnrollmentCount: school.freeEnrollmentCount ?? 0,
        maximumCapacity: school.maximumCapacity ?? 100,
        ageGroupCapacities,
        settingsUpdatedAt: school.settingsUpdatedAt,
      };
    } catch (error) {
      console.error('Error fetching school settings:', error);
      throw new Error('Failed to retrieve school settings');
    }
  }

  /**
   * Update school settings
   */
  static async updateSettings(
    schoolId: number,
    settings: SettingsUpdateRequest,
    adminUserId: number
  ): Promise<SchoolSettings> {
    try {
      // Convert number to string for decimal column
      const defaultFeeString = settings.default_monthly_fee_ron.toFixed(2);

      const result = await db
        .update(teams)
        .set({
          defaultMonthlyFeeRon: defaultFeeString,
          freeEnrollmentCount: settings.free_enrollment_count,
          maximumCapacity: settings.maximum_capacity,
          settingsUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(teams.id, schoolId))
        .returning({
          schoolId: teams.id,
          defaultMonthlyFeeRon: teams.defaultMonthlyFeeRon,
          freeEnrollmentCount: teams.freeEnrollmentCount,
          maximumCapacity: teams.maximumCapacity,
          settingsUpdatedAt: teams.settingsUpdatedAt,
        });

      if (!result || result.length === 0) {
        throw new Error('Failed to update school settings - school not found');
      }

      // Update age group capacities in school_settings table if provided
      if (settings.age_group_capacities) {
        const ageGroupCapacitiesJson = JSON.stringify(settings.age_group_capacities);
        
        // Check if school_settings record exists
        const existingSchoolSettings = await db
          .select({ id: schoolSettings.id })
          .from(schoolSettings)
          .where(eq(schoolSettings.schoolId, schoolId))
          .limit(1);

        if (existingSchoolSettings.length > 0) {
          // Update existing record
          await db
            .update(schoolSettings)
            .set({
              ageGroupCapacities: ageGroupCapacitiesJson,
              lastUpdated: new Date(),
            })
            .where(eq(schoolSettings.schoolId, schoolId));
        } else {
          // Insert new record
          await db
            .insert(schoolSettings)
            .values({
              schoolId,
              ageGroupCapacities: ageGroupCapacitiesJson,
              lastUpdated: new Date(),
            });
        }
      }

      const updated = result[0];

      return {
        schoolId: updated.schoolId,
        defaultMonthlyFeeRon: updated.defaultMonthlyFeeRon ?? '0.00',
        freeEnrollmentCount: updated.freeEnrollmentCount ?? 0,
        maximumCapacity: updated.maximumCapacity ?? 100,
        ageGroupCapacities: settings.age_group_capacities,
        settingsUpdatedAt: updated.settingsUpdatedAt,
      };
    } catch (error) {
      console.error('Error updating school settings:', error);
      throw new Error('Failed to update school settings');
    }
  }

  /**
   * Get default monthly fee for a school (in RON)
   */
  static async getDefaultMonthlyFee(schoolId: number): Promise<number> {
    try {
      const settings = await this.getSettings(schoolId);
      if (!settings) {
        return 0;
      }
      return parseFloat(settings.defaultMonthlyFeeRon);
    } catch (error) {
      console.error('Error fetching default monthly fee:', error);
      return 0; // Fallback to 0 on error
    }
  }

  /**
   * Get free enrollment count for a school
   */
  static async getFreeEnrollmentCount(schoolId: number): Promise<number> {
    try {
      const settings = await this.getSettings(schoolId);
      if (!settings) {
        return 0;
      }
      return settings.freeEnrollmentCount;
    } catch (error) {
      console.error('Error fetching free enrollment count:', error);
      return 0; // Fallback to 0 on error
    }
  }

  /**
   * Check if school has available free enrollments
   */
  static async hasAvailableFreeEnrollments(
    schoolId: number,
    currentCount: number
  ): Promise<boolean> {
    try {
      const limit = await this.getFreeEnrollmentCount(schoolId);
      return currentCount < limit;
    } catch (error) {
      console.error('Error checking free enrollment availability:', error);
      return false; // Conservative: deny if error
    }
  }

  /**
   * Verify school exists
   */
  static async verifySchoolExists(schoolId: number): Promise<boolean> {
    try {
      const result = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.id, schoolId))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error verifying school existence:', error);
      return false;
    }
  }
}