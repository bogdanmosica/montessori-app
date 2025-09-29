import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import { db } from '@/lib/db';
import { payments, families, users, children } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, count, sum } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      requireAdminPermissions(session.user.role);
    } catch {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    const schoolIdNum = parseInt(schoolId);
    if (isNaN(schoolIdNum)) {
      return NextResponse.json({ error: 'Invalid school ID' }, { status: 400 });
    }

    // Get dashboard data from database
    // Get payment dashboard data with direct database queries
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Total monthly revenue from all children fees
    const allChildren = await db.select({
      monthlyFee: children.monthlyFee
    }).from(children)
      .where(eq(children.schoolId, schoolIdNum));

    const totalMonthlyRevenue = allChildren.reduce((sum, child) => sum + (child.monthlyFee || 0), 0);

    // Payments received this month
    const paymentsThisMonth = await db.select({
      count: count(),
      total: sum(payments.amount)
    }).from(payments)
      .innerJoin(families, eq(payments.familyId, families.id))
      .where(and(
        eq(families.schoolId, schoolIdNum),
        gte(payments.createdAt, startOfMonth),
        lte(payments.createdAt, endOfMonth)
      ));

    const totalCollected = Number(paymentsThisMonth[0]?.total) || 0;
    const paymentsCount = paymentsThisMonth[0]?.count || 0;

    // Pending payments (expected revenue - collected)
    const pendingAmount = totalMonthlyRevenue - totalCollected;

    // Recent payments (last 5)
    const recentPayments = await db.select({
      id: payments.id,
      amount: payments.amount,
      status: payments.status,
      paymentDate: payments.paymentDate,
      createdAt: payments.createdAt,
      familyId: payments.familyId
    }).from(payments)
      .innerJoin(families, eq(payments.familyId, families.id))
      .where(eq(families.schoolId, schoolIdNum))
      .orderBy(desc(payments.createdAt))
      .limit(5);

    const dashboardData = {
      totalRevenue: totalMonthlyRevenue,
      totalPayments: paymentsCount,
      pendingAmount,
      successfulPayments: paymentsCount, // For now, assume all recorded payments are successful
      recentPayments,
      activeAlertsCount: 0,
      alerts: [] // We'll add alerts later if needed
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}