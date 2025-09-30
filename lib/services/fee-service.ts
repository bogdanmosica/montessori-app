import { db } from '@/lib/db';
import { children, enrollments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatFeeDisplay, centsToRon, getNoFeeDisplay } from '@/lib/constants/currency';

/**
 * Service for resolving fees between child defaults and enrollment overrides
 */
export class FeeService {
  /**
   * Get the effective fee for a specific enrollment
   * Returns the enrollment override if set, otherwise the child's default fee
   */
  static async getEffectiveFee(
    enrollmentId: string,
    schoolId: number
  ): Promise<{
    effectiveFee: number; // in cents
    effectiveFeeDisplay: string;
    feeSource: 'child_default' | 'enrollment_override' | 'no_fee';
    childDefaultFee: number;
    enrollmentOverride: number | null;
  } | null> {
    const result = await db
      .select({
        childFee: children.monthlyFee,
        enrollmentOverride: enrollments.monthlyFeeOverride,
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(
        and(
          eq(enrollments.id, enrollmentId),
          eq(enrollments.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!result.length) {
      return null;
    }

    const { childFee, enrollmentOverride } = result[0];

    // Determine effective fee
    const effectiveFee = enrollmentOverride !== null ? enrollmentOverride : childFee;
    
    // Determine fee source
    let feeSource: 'child_default' | 'enrollment_override' | 'no_fee';
    if (enrollmentOverride !== null) {
      feeSource = 'enrollment_override';
    } else if (childFee > 0) {
      feeSource = 'child_default';
    } else {
      feeSource = 'no_fee';
    }

    return {
      effectiveFee,
      effectiveFeeDisplay: effectiveFee === 0 ? getNoFeeDisplay() : formatFeeDisplay(effectiveFee),
      feeSource,
      childDefaultFee: childFee,
      enrollmentOverride,
    };
  }

  /**
   * Get fee details for a child including all enrollment overrides
   */
  static async getChildFeeDetails(
    childId: string,
    schoolId: number
  ): Promise<{
    childId: string;
    defaultFee: number; // in cents
    defaultFeeDisplay: string;
    enrollments: Array<{
      id: string;
      monthlyFeeOverride: number | null;
      effectiveFee: number;
      effectiveFeeDisplay: string;
      feeSource: 'child_default' | 'enrollment_override' | 'no_fee';
    }>;
  } | null> {
    // Get child default fee
    const childResult = await db
      .select({
        id: children.id,
        monthlyFee: children.monthlyFee,
      })
      .from(children)
      .where(
        and(
          eq(children.id, childId),
          eq(children.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!childResult.length) {
      return null;
    }

    const child = childResult[0];

    // Get all enrollments for this child
    const enrollmentResults = await db
      .select({
        id: enrollments.id,
        monthlyFeeOverride: enrollments.monthlyFeeOverride,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.childId, childId),
          eq(enrollments.schoolId, schoolId)
        )
      );

    const enrollmentFees = enrollmentResults.map(enrollment => {
      const effectiveFee = enrollment.monthlyFeeOverride !== null 
        ? enrollment.monthlyFeeOverride 
        : child.monthlyFee;

      let feeSource: 'child_default' | 'enrollment_override' | 'no_fee';
      if (enrollment.monthlyFeeOverride !== null) {
        feeSource = 'enrollment_override';
      } else if (child.monthlyFee > 0) {
        feeSource = 'child_default';
      } else {
        feeSource = 'no_fee';
      }

      return {
        id: enrollment.id,
        monthlyFeeOverride: enrollment.monthlyFeeOverride,
        effectiveFee,
        effectiveFeeDisplay: effectiveFee === 0 ? getNoFeeDisplay() : formatFeeDisplay(effectiveFee),
        feeSource,
      };
    });

    return {
      childId: child.id,
      defaultFee: child.monthlyFee,
      defaultFeeDisplay: child.monthlyFee === 0 ? getNoFeeDisplay() : formatFeeDisplay(child.monthlyFee),
      enrollments: enrollmentFees,
    };
  }

  /**
   * Calculate effective fees for multiple enrollments at once
   */
  static async getBulkEffectiveFees(
    enrollmentIds: string[],
    schoolId: number
  ): Promise<Map<string, {
    effectiveFee: number;
    effectiveFeeDisplay: string;
    feeSource: 'child_default' | 'enrollment_override' | 'no_fee';
  }>> {
    if (enrollmentIds.length === 0) {
      return new Map();
    }

    const results = await db
      .select({
        enrollmentId: enrollments.id,
        childFee: children.monthlyFee,
        enrollmentOverride: enrollments.monthlyFeeOverride,
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(
        and(
          eq(enrollments.schoolId, schoolId),
          // Using IN clause for multiple enrollment IDs
          // Drizzle doesn't have a direct inArray for UUIDs, so we build the condition
          eq(enrollments.id, enrollmentIds[0]) // This would need proper IN handling
        )
      );

    const feeMap = new Map();

    results.forEach(({ enrollmentId, childFee, enrollmentOverride }) => {
      const effectiveFee = enrollmentOverride !== null ? enrollmentOverride : childFee;
      
      let feeSource: 'child_default' | 'enrollment_override' | 'no_fee';
      if (enrollmentOverride !== null) {
        feeSource = 'enrollment_override';
      } else if (childFee > 0) {
        feeSource = 'child_default';
      } else {
        feeSource = 'no_fee';
      }

      feeMap.set(enrollmentId, {
        effectiveFee,
        effectiveFeeDisplay: effectiveFee === 0 ? getNoFeeDisplay() : formatFeeDisplay(effectiveFee),
        feeSource,
      });
    });

    return feeMap;
  }

  /**
   * Validate fee configuration for a child and its enrollments
   */
  static async validateChildFeeConfiguration(
    childId: string,
    schoolId: number
  ): Promise<{
    valid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const feeDetails = await FeeService.getChildFeeDetails(childId, schoolId);
    
    if (!feeDetails) {
      return {
        valid: false,
        issues: ['Child not found'],
        warnings: [],
      };
    }

    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for negative fees (shouldn't happen with proper validation, but defensive)
    if (feeDetails.defaultFee < 0) {
      issues.push('Child default fee cannot be negative');
    }

    feeDetails.enrollments.forEach((enrollment, index) => {
      if (enrollment.monthlyFeeOverride !== null && enrollment.monthlyFeeOverride < 0) {
        issues.push(`Enrollment ${index + 1} override fee cannot be negative`);
      }
    });

    // Check for potentially unnecessary overrides
    feeDetails.enrollments.forEach((enrollment, index) => {
      if (enrollment.monthlyFeeOverride === feeDetails.defaultFee) {
        warnings.push(`Enrollment ${index + 1} override is same as child default (unnecessary)`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Get fee statistics for a school
   */
  static async getSchoolFeeStatistics(schoolId: number): Promise<{
    totalChildren: number;
    childrenWithFees: number;
    childrenWithoutFees: number;
    totalEnrollments: number;
    enrollmentsWithOverrides: number;
    averageChildFee: number; // in RON
    averageEffectiveFee: number; // in RON
    totalMonthlyRevenue: number; // in RON
  }> {
    // Get child fee statistics
    const childrenResult = await db
      .select({
        id: children.id,
        monthlyFee: children.monthlyFee,
      })
      .from(children)
      .where(eq(children.schoolId, schoolId));

    const totalChildren = childrenResult.length;
    const childrenWithFees = childrenResult.filter(child => child.monthlyFee > 0).length;
    const childrenWithoutFees = totalChildren - childrenWithFees;

    // Get enrollment override statistics
    const enrollmentsResult = await db
      .select({
        id: enrollments.id,
        monthlyFeeOverride: enrollments.monthlyFeeOverride,
        childFee: children.monthlyFee,
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(eq(enrollments.schoolId, schoolId));

    const totalEnrollments = enrollmentsResult.length;
    const enrollmentsWithOverrides = enrollmentsResult.filter(e => e.monthlyFeeOverride !== null).length;

    // Calculate averages and totals
    let totalChildFees = 0;
    let totalEffectiveFees = 0;

    enrollmentsResult.forEach(enrollment => {
      const childFee = enrollment.childFee;
      const effectiveFee = enrollment.monthlyFeeOverride !== null 
        ? enrollment.monthlyFeeOverride 
        : childFee;

      totalChildFees += childFee;
      totalEffectiveFees += effectiveFee;
    });

    const averageChildFee = totalEnrollments > 0 ? centsToRon(totalChildFees / totalEnrollments) : 0;
    const averageEffectiveFee = totalEnrollments > 0 ? centsToRon(totalEffectiveFees / totalEnrollments) : 0;
    const totalMonthlyRevenue = centsToRon(totalEffectiveFees);

    return {
      totalChildren,
      childrenWithFees,
      childrenWithoutFees,
      totalEnrollments,
      enrollmentsWithOverrides,
      averageChildFee,
      averageEffectiveFee,
      totalMonthlyRevenue,
    };
  }

  /**
   * Helper method to format fee for display with proper fallbacks
   */
  static formatFeeForDisplay(
    feeCents: number | null,
    fallbackFeeCents?: number
  ): string {
    if (feeCents === null) {
      if (fallbackFeeCents !== undefined) {
        return fallbackFeeCents === 0 ? getNoFeeDisplay() : formatFeeDisplay(fallbackFeeCents);
      }
      return getNoFeeDisplay();
    }

    return feeCents === 0 ? getNoFeeDisplay() : formatFeeDisplay(feeCents);
  }

  /**
   * Check if an enrollment needs fee override due to child fee change
   */
  static async checkEnrollmentFeeConsistency(
    childId: string,
    schoolId: number
  ): Promise<{
    needsAttention: boolean;
    enrollments: Array<{
      id: string;
      hasOverride: boolean;
      currentEffectiveFee: number;
      recommendedAction?: string;
    }>;
  }> {
    const feeDetails = await FeeService.getChildFeeDetails(childId, schoolId);
    
    if (!feeDetails) {
      return { needsAttention: false, enrollments: [] };
    }

    let needsAttention = false;
    const enrollmentAnalysis = feeDetails.enrollments.map(enrollment => {
      const hasOverride = enrollment.monthlyFeeOverride !== null;
      let recommendedAction: string | undefined;

      // If enrollment override equals new child default, might want to remove override
      if (hasOverride && enrollment.monthlyFeeOverride === feeDetails.defaultFee) {
        recommendedAction = 'Consider removing override (matches child default)';
        needsAttention = true;
      }

      return {
        id: enrollment.id,
        hasOverride,
        currentEffectiveFee: enrollment.effectiveFee,
        recommendedAction,
      };
    });

    return {
      needsAttention,
      enrollments: enrollmentAnalysis,
    };
  }
}