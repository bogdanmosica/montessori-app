// Simple cashflow metrics calculation// T012: Create cashflow calculation helpers - Fixed for current schema// T012: Create cashflow calculation helpers - Fixed for current schema

import { db } from '@/lib/db/drizzle';

import { children, schoolSettings } from '@/lib/db/schema';import { db } from '@/lib/db/drizzle';import { db } from '@/lib/db/drizzle';

import { eq, and, count } from 'drizzle-orm';

import type { CashflowMetrics } from '@/lib/types/dashboard';import { children, payments, schoolSettings, families } from '@/lib/db/schema';import { children, payments, schoolSettings, families } from '@/lib/db/schema';



export async function getCashflowMetrics(schoolId: string): Promise<CashflowMetrics> {import { eq, and, sum, count, gte, lt } from 'drizzle-orm';import { eq, and, sum, count, gte, lt } from 'drizzle-orm';

  try {

    // Get school settings for base feeimport type { CashflowMetrics, RevenueBreakdown } from '@/lib/types/dashboard';import type { CashflowMetrics, RevenueBreakdown } from '@/lib/types/dashboard';

    const schoolSettingsData = await db

      .select()

      .from(schoolSettings)

      .where(eq(schoolSettings.schoolId, parseInt(schoolId)))export async function getCashflowMetrics(schoolId: string): Promise<CashflowMetrics> {export async function getCashflowMetrics(schoolId: string): Promise<CashflowMetrics> {

      .limit(1);

  try {  try {

    const baseFeePerChild = schoolSettingsData[0]?.baseFeePerChild || 65000; // cents

    // Get school settings for base fee    // Get school settings for base fee

    // Get active children count

    const activeChildren = await db    const schoolSettingsData = await db    const schoolSettingsData = await db

      .select({ count: count() })

      .from(children)      .select()      .select()

      .where(and(

        eq(children.schoolId, parseInt(schoolId)),      .from(schoolSettings)      .from(schoolSettings)

        eq(children.enrollmentStatus, 'ACTIVE')

      ));      .where(eq(schoolSettings.schoolId, parseInt(schoolId)))      .where(eq(schoolSettings.schoolId, parseInt(schoolId)))



    const totalChildren = activeChildren[0]?.count || 0;      .limit(1);      .limit(1);

    const estimatedMonthlyRevenue = totalChildren * baseFeePerChild;



    return {

      currentMonthRevenue: estimatedMonthlyRevenue,    const baseFeePerChild = schoolSettingsData[0]?.baseFeePerChild || 65000; // cents    const baseFeePerChild = schoolSettingsData[0]?.baseFeePerChild || 65000; // cents

      projectedMonthlyRevenue: estimatedMonthlyRevenue,

      baseFeePerChild,

      totalFamilies: Math.ceil(totalChildren * 0.8), // Estimate

      totalChildren,    // Get active children count    // Get active children count

      averageRevenuePerFamily: Math.round(estimatedMonthlyRevenue / Math.max(1, Math.ceil(totalChildren * 0.8))),

      discountsSavings: 0,    const activeChildren = await db    const activeChildren = await db

      revenueBreakdown: {

        singleChildFamilies: { count: totalChildren, revenue: estimatedMonthlyRevenue },      .select({ count: count() })      .select({ count: count() })

        multiChildFamilies: { count: 0, revenue: 0, totalSavingsFromDiscounts: 0 },

        pendingPayments: 0,      .from(children)      .from(children)

        overduePayments: 0,

      },      .where(and(      .where(and(

    };

  } catch (error) {        eq(children.schoolId, parseInt(schoolId)),        eq(children.schoolId, parseInt(schoolId)),

    console.error('Error calculating cashflow metrics:', error);

            eq(children.enrollmentStatus, 'ACTIVE')        eq(children.enrollmentStatus, 'ACTIVE')

    return {

      currentMonthRevenue: 0,      ));      ));

      projectedMonthlyRevenue: 0,

      baseFeePerChild: 65000,

      totalFamilies: 0,

      totalChildren: 0,    const totalChildren = activeChildren[0]?.count || 0;    const totalChildren = activeChildren[0]?.count || 0;

      averageRevenuePerFamily: 0,

      discountsSavings: 0,

      revenueBreakdown: {

        singleChildFamilies: { count: 0, revenue: 0 },    // Calculate estimated revenue based on active children    // Calculate estimated revenue based on active children

        multiChildFamilies: { count: 0, revenue: 0, totalSavingsFromDiscounts: 0 },

        pendingPayments: 0,    const estimatedMonthlyRevenue = totalChildren * baseFeePerChild;    const estimatedMonthlyRevenue = totalChildren * baseFeePerChild;

        overduePayments: 0,

      },

    };

  }    // Get payment data if available    // Get payment data if available

}
    const currentMonth = new Date();    const currentMonth = new Date();

    currentMonth.setDate(1); // First day of current month    currentMonth.setDate(1); // First day of current month

    const nextMonth = new Date(currentMonth);    const nextMonth = new Date(currentMonth);

    nextMonth.setMonth(nextMonth.getMonth() + 1);    nextMonth.setMonth(nextMonth.getMonth() + 1);



    // Get actual payments this month    // Get actual payments this month

    const currentMonthPayments = await db    const currentMonthPayments = await db

      .select({       .select({ 

        total: sum(payments.amount),        total: sum(payments.amount),

        count: count(payments.id)        count: count(payments.id)

      })      })

      .from(payments)      .from(payments)

      .leftJoin(families, eq(families.id, payments.familyId))      .leftJoin(families, eq(families.id, payments.familyId))

      .where(and(      .where(and(

        eq(families.schoolId, parseInt(schoolId)),        eq(families.schoolId, parseInt(schoolId)),

        gte(payments.paymentDate, currentMonth),        gte(payments.paymentDate, currentMonth),

        lt(payments.paymentDate, nextMonth)        lt(payments.paymentDate, nextMonth)

      ));      ));



    const actualCurrentMonthRevenue = Number(currentMonthPayments[0]?.total || 0);    const actualCurrentMonthRevenue = Number(currentMonthPayments[0]?.total || 0);



    // Get total families count    // Get total families count

    const familiesCount = await db    const familiesCount = await db

      .select({ count: count() })      .select({ count: count() })

      .from(families)      .from(families)

      .where(eq(families.schoolId, parseInt(schoolId)));      .where(eq(families.schoolId, parseInt(schoolId)));



    const totalFamilies = familiesCount[0]?.count || 0;    const totalFamilies = familiesCount[0]?.count || 0;



    // Calculate metrics    // Calculate metrics

    const averageRevenuePerFamily = totalFamilies > 0 ? estimatedMonthlyRevenue / totalFamilies : 0;    const averageRevenuePerFamily = totalFamilies > 0 ? estimatedMonthlyRevenue / totalFamilies : 0;



    // Get revenue breakdown matching the expected type    // Get revenue breakdown matching the expected type

    const revenueBreakdown: RevenueBreakdown = {    const revenueBreakdown: RevenueBreakdown = {

      singleChildFamilies: {      singleChildFamilies: {

        count: Math.max(0, totalFamilies - Math.floor(totalChildren / 2)), // Rough estimate        count: Math.max(0, totalFamilies - Math.floor(totalChildren / 2)), // Rough estimate

        revenue: baseFeePerChild * Math.max(0, totalFamilies - Math.floor(totalChildren / 2)),        revenue: baseFeePerChild * Math.max(0, totalFamilies - Math.floor(totalChildren / 2)),

      },      },

      multiChildFamilies: {      multiChildFamilies: {

        count: Math.floor(totalChildren / 2), // Rough estimate        count: Math.floor(totalChildren / 2), // Rough estimate

        revenue: baseFeePerChild * Math.floor(totalChildren / 2),        revenue: baseFeePerChild * Math.floor(totalChildren / 2),

        totalSavingsFromDiscounts: 0, // Default        totalSavingsFromDiscounts: 0, // Default

      },      },

      pendingPayments: 0, // Default      pendingPayments: 0, // Default

      overduePayments: Math.max(0, estimatedMonthlyRevenue - actualCurrentMonthRevenue),      overduePayments: Math.max(0, estimatedMonthlyRevenue - actualCurrentMonthRevenue),

    };    };



    return {    return {

      currentMonthRevenue: actualCurrentMonthRevenue || estimatedMonthlyRevenue,      currentMonthRevenue: actualCurrentMonthRevenue || estimatedMonthlyRevenue,

      projectedMonthlyRevenue: estimatedMonthlyRevenue,      projectedMonthlyRevenue: estimatedMonthlyRevenue,

      baseFeePerChild,      baseFeePerChild,

      totalFamilies,      totalFamilies,

      totalChildren,      totalChildren,

      averageRevenuePerFamily: Math.round(averageRevenuePerFamily),      averageRevenuePerFamily: Math.round(averageRevenuePerFamily),

      discountsSavings: 0, // Default      discountsSavings: 0, // Default

      revenueBreakdown,      revenueBreakdown,

    };    };

  } catch (error) {  } catch (error) {

    console.error('Error calculating cashflow metrics:', error);    console.error('Error calculating cashflow metrics:', error);

        

    // Return default values on error    // Return default values on error

    return {    return {

      currentMonthRevenue: 0,      currentMonthRevenue: 0,

      projectedMonthlyRevenue: 0,      projectedMonthlyRevenue: 0,

      baseFeePerChild: 65000,      baseFeePerChild: 65000,

      totalFamilies: 0,      totalFamilies: 0,

      totalChildren: 0,      totalChildren: 0,

      averageRevenuePerFamily: 0,      averageRevenuePerFamily: 0,

      discountsSavings: 0,      discountsSavings: 0,

      revenueBreakdown: {      revenueBreakdown: {

        singleChildFamilies: { count: 0, revenue: 0 },        singleChildFamilies: { count: 0, revenue: 0 },

        multiChildFamilies: { count: 0, revenue: 0, totalSavingsFromDiscounts: 0 },        multiChildFamilies: { count: 0, revenue: 0, totalSavingsFromDiscounts: 0 },

        pendingPayments: 0,        pendingPayments: 0,

        overduePayments: 0,        overduePayments: 0,

      },      },

    };    };

  }  }

}}

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

  const pendingPayments = paymentBreakdown.find(p => p.status === 'pending')?.totalAmount || 0;
  const overduePayments = paymentBreakdown.find(p => p.status === 'overdue')?.totalAmount || 0;

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