// T012: Create cashflow calculation helpers
import { db } from '@/lib/db/drizzle';
import { families, children, payments, schoolSettings } from '@/lib/db/schema';
import { eq, and, sum, count, gte } from 'drizzle-orm';
import type { CashflowMetrics, RevenueBreakdown } from '@/lib/types/dashboard';

export async function getCashflowMetrics(schoolId: string): Promise<CashflowMetrics> {
  try {
    // Get school settings for base fee
    const schoolSettingsData = await db
      .select()
      .from(schoolSettings)
      .where(eq(schoolSettings.schoolId, parseInt(schoolId)))
      .limit(1);

    const baseFeePerChild = schoolSettingsData[0]?.baseFeePerChild || 65000; // cents

    // Get families and their children for revenue calculations
    const familiesWithChildren = await db
      .select({
        familyId: families.id,
        totalMonthlyFee: families.totalMonthlyFee,
        discountRate: families.discountRate,
        paymentStatus: families.paymentStatus,
        childCount: count(children.id),
      })
      .from(families)
      .leftJoin(children, and(
        eq(children.familyId, families.id),
        eq(children.enrollmentStatus, 'enrolled')
      ))
      .where(eq(families.schoolId, parseInt(schoolId)))
      .groupBy(families.id, families.totalMonthlyFee, families.discountRate, families.paymentStatus);

    const totalFamilies = familiesWithChildren.length;
    const totalChildren = familiesWithChildren.reduce((sum, family) => sum + family.childCount, 0);

    // Calculate current month revenue
    const currentMonthRevenue = familiesWithChildren.reduce((sum, family) => {
      return sum + family.totalMonthlyFee;
    }, 0);

    // Calculate projected revenue (includes pending enrollments)
    const pendingChildrenCount = await db
      .select({ count: count() })
      .from(children)
      .leftJoin(families, eq(families.id, children.familyId))
      .where(and(
        eq(families.schoolId, parseInt(schoolId)),
        eq(children.enrollmentStatus, 'pending')
      ));

    const projectedAdditionalRevenue = (pendingChildrenCount[0]?.count || 0) * baseFeePerChild * 0.8; // Estimate with discounts
    const projectedMonthlyRevenue = currentMonthRevenue + projectedAdditionalRevenue;

    // Calculate average revenue per family
    const averageRevenuePerFamily = totalFamilies > 0 ? currentMonthRevenue / totalFamilies : 0;

    // Calculate total discounts given
    const totalPotentialRevenue = totalChildren * baseFeePerChild;
    const discountsSavings = totalPotentialRevenue - currentMonthRevenue;

    // Build revenue breakdown
    const revenueBreakdown = await calculateRevenueBreakdown(schoolId, familiesWithChildren);

    return {
      currentMonthRevenue: currentMonthRevenue / 100, // Convert cents to dollars
      projectedMonthlyRevenue: projectedMonthlyRevenue / 100,
      baseFeePerChild: baseFeePerChild / 100,
      totalFamilies,
      totalChildren,
      averageRevenuePerFamily: averageRevenuePerFamily / 100,
      discountsSavings: discountsSavings / 100,
      revenueBreakdown: {
        ...revenueBreakdown,
        singleChildFamilies: {
          ...revenueBreakdown.singleChildFamilies,
          revenue: revenueBreakdown.singleChildFamilies.revenue / 100,
        },
        multiChildFamilies: {
          ...revenueBreakdown.multiChildFamilies,
          revenue: revenueBreakdown.multiChildFamilies.revenue / 100,
          totalSavingsFromDiscounts: revenueBreakdown.multiChildFamilies.totalSavingsFromDiscounts / 100,
        },
        pendingPayments: revenueBreakdown.pendingPayments / 100,
        overduePayments: revenueBreakdown.overduePayments / 100,
      },
    };
  } catch (error) {
    console.error('Error calculating cashflow metrics:', error);
    throw new Error('Failed to calculate cashflow metrics');
  }
}

async function calculateRevenueBreakdown(
  schoolId: string,
  familiesData: any[]
): Promise<RevenueBreakdown> {
  const singleChildFamilies = familiesData.filter(f => f.childCount === 1);
  const multiChildFamilies = familiesData.filter(f => f.childCount > 1);

  const singleChildRevenue = singleChildFamilies.reduce((sum, f) => sum + f.totalMonthlyFee, 0);
  const multiChildRevenue = multiChildFamilies.reduce((sum, f) => sum + f.totalMonthlyFee, 0);

  // Calculate potential revenue without discounts for multi-child families
  const schoolSettingsData = await db
    .select()
    .from(schoolSettings)
    .where(eq(schoolSettings.schoolId, parseInt(schoolId)))
    .limit(1);

  const baseFeePerChild = schoolSettingsData[0]?.baseFeePerChild || 65000;

  const multiChildPotentialRevenue = multiChildFamilies.reduce((sum, f) => {
    return sum + (f.childCount * baseFeePerChild);
  }, 0);

  const totalSavingsFromDiscounts = multiChildPotentialRevenue - multiChildRevenue;

  // Get payment status breakdown
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const paymentBreakdown = await db
    .select({
      status: payments.status,
      totalAmount: sum(payments.amount),
    })
    .from(payments)
    .leftJoin(families, eq(families.id, payments.familyId))
    .where(and(
      eq(families.schoolId, parseInt(schoolId)),
      gte(payments.paymentDate, currentMonth)
    ))
    .groupBy(payments.status);

  const pendingPayments = Number(paymentBreakdown.find(p => p.status === 'pending')?.totalAmount || 0);
  const overduePayments = Number(paymentBreakdown.find(p => p.status === 'overdue')?.totalAmount || 0);

  return {
    singleChildFamilies: {
      count: singleChildFamilies.length,
      revenue: singleChildRevenue,
    },
    multiChildFamilies: {
      count: multiChildFamilies.length,
      revenue: multiChildRevenue,
      totalSavingsFromDiscounts,
    },
    pendingPayments,
    overduePayments,
  };
}

export async function calculateSiblingDiscount(
  childCount: number,
  baseFeePerChild: number,
  discountRules: any[]
): Promise<{ totalFee: number; discountApplied: number }> {
  if (childCount <= 1) {
    return {
      totalFee: baseFeePerChild,
      discountApplied: 0,
    };
  }

  let totalFee = baseFeePerChild; // First child always full price
  let totalDiscount = 0;

  // Apply discounts to additional children
  for (let i = 2; i <= childCount; i++) {
    const applicableRule = discountRules.find(rule => rule.childCount === i) ||
                          discountRules.find(rule => rule.childCount >= i);

    if (applicableRule) {
      const discountAmount = applicableRule.discountType === 'percentage'
        ? baseFeePerChild * (applicableRule.discountValue / 100)
        : applicableRule.discountValue;

      const childFee = baseFeePerChild - discountAmount;
      totalFee += childFee;
      totalDiscount += discountAmount;
    } else {
      totalFee += baseFeePerChild;
    }
  }

  return {
    totalFee,
    discountApplied: totalDiscount,
  };
}