// T012: Create cashflow calculation helpers - Fixed for current schema
import { db } from '@/lib/db/drizzle';
import { children, payments, schoolSettings, families } from '@/lib/db/schema';
import { eq, and, sum, count, gte, lt } from 'drizzle-orm';
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

    // Get active children count
    const activeChildren = await db
      .select({ count: count() })
      .from(children)
      .where(and(
        eq(children.schoolId, parseInt(schoolId)),
        eq(children.enrollmentStatus, 'ACTIVE')
      ));

    const totalChildren = activeChildren[0]?.count || 0;

    // Calculate estimated revenue based on active children
    const estimatedMonthlyRevenue = totalChildren * baseFeePerChild;

    // Get payment data if available
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Get actual payments this month
    const currentMonthPayments = await db
      .select({ 
        total: sum(payments.amount),
        count: count(payments.id)
      })
      .from(payments)
      .leftJoin(families, eq(families.id, payments.familyId))
      .where(and(
        eq(families.schoolId, parseInt(schoolId)),
        gte(payments.paymentDate, currentMonth),
        lt(payments.paymentDate, nextMonth)
      ));

    const actualCurrentMonthRevenue = Number(currentMonthPayments[0]?.total || 0);

    // Get total families count
    const familiesCount = await db
      .select({ count: count() })
      .from(families)
      .where(eq(families.schoolId, parseInt(schoolId)));

    const totalFamilies = familiesCount[0]?.count || 0;

    // Calculate metrics
    const averageRevenuePerChild = totalChildren > 0 ? estimatedMonthlyRevenue / totalChildren : 0;
    const averageRevenuePerFamily = totalFamilies > 0 ? estimatedMonthlyRevenue / totalFamilies : 0;

    // Get revenue breakdown
    const revenueBreakdown: RevenueBreakdown = {
      baseRevenue: totalChildren * baseFeePerChild,
      discountApplied: 0, // Calculate if needed
      totalCollected: actualCurrentMonthRevenue,
      outstanding: Math.max(0, estimatedMonthlyRevenue - actualCurrentMonthRevenue),
    };

    return {
      currentMonthRevenue: actualCurrentMonthRevenue || estimatedMonthlyRevenue,
      projectedMonthlyRevenue: estimatedMonthlyRevenue,
      totalChildren,
      totalFamilies,
      averageRevenuePerChild: Math.round(averageRevenuePerChild),
      averageRevenuePerFamily: Math.round(averageRevenuePerFamily),
      revenueBreakdown,
      cashflowTrend: 'stable', // Default value
      upcomingPayments: 0, // Default value
      overdueAmount: Math.max(0, estimatedMonthlyRevenue - actualCurrentMonthRevenue),
      collectionRate: estimatedMonthlyRevenue > 0 ? (actualCurrentMonthRevenue / estimatedMonthlyRevenue) * 100 : 100,
    };
  } catch (error) {
    console.error('Error calculating cashflow metrics:', error);
    
    // Return default values on error
    return {
      currentMonthRevenue: 0,
      projectedMonthlyRevenue: 0,
      totalChildren: 0,
      totalFamilies: 0,
      averageRevenuePerChild: 0,
      averageRevenuePerFamily: 0,
      revenueBreakdown: {
        baseRevenue: 0,
        discountApplied: 0,
        totalCollected: 0,
        outstanding: 0,
      },
      cashflowTrend: 'stable',
      upcomingPayments: 0,
      overdueAmount: 0,
      collectionRate: 100,
    };
  }
}

// Helper function for revenue breakdown calculation
export async function calculateRevenueBreakdown(schoolId: string): Promise<RevenueBreakdown> {
  try {
    const schoolSettingsData = await db
      .select()
      .from(schoolSettings)
      .where(eq(schoolSettings.schoolId, parseInt(schoolId)))
      .limit(1);

    const baseFeePerChild = schoolSettingsData[0]?.baseFeePerChild || 65000;

    const activeChildren = await db
      .select({ count: count() })
      .from(children)
      .where(and(
        eq(children.schoolId, parseInt(schoolId)),
        eq(children.enrollmentStatus, 'ACTIVE')
      ));

    const totalChildren = activeChildren[0]?.count || 0;
    const baseRevenue = totalChildren * baseFeePerChild;

    // Get current month payments
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const paymentsData = await db
      .select({
        total: sum(payments.amount),
        discounts: sum(payments.discountApplied)
      })
      .from(payments)
      .leftJoin(families, eq(families.id, payments.familyId))
      .where(and(
        eq(families.schoolId, parseInt(schoolId)),
        gte(payments.paymentDate, currentMonth)
      ));

    const totalCollected = Number(paymentsData[0]?.total || 0);
    const discountApplied = Number(paymentsData[0]?.discounts || 0);

    return {
      baseRevenue,
      discountApplied,
      totalCollected,
      outstanding: Math.max(0, baseRevenue - totalCollected),
    };
  } catch (error) {
    console.error('Error calculating revenue breakdown:', error);
    return {
      baseRevenue: 0,
      discountApplied: 0,
      totalCollected: 0,
      outstanding: 0,
    };
  }
}