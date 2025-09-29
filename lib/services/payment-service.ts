import { db } from '@/lib/db';
import {
  payments,
  families,
  users,
  children,
  Payment,
  NewPayment
} from '@/lib/db/schema';
import { eq, and, desc, gte, lte, count, sum, sql } from 'drizzle-orm';

export interface PaymentFilters {
  schoolId: number;
  familyId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface PaymentSummary {
  id: string;
  familyId: string;
  familyName: string;
  amount: string;
  status: string;
  paymentDate: Date;
  stripePaymentIntentId?: string;
}

export interface PaymentDetails extends PaymentSummary {
  schoolId: number;
  discountApplied: number;
  createdAt: Date;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaymentsListResponse {
  payments: PaymentSummary[];
  pagination: PaginationInfo;
}

export interface PaymentsDashboard {
  totalRevenueThisMonth: string;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  activeAlertsCount: number;
  totalChildrenRevenue: string;
  recentPayments: PaymentSummary[];
}

export async function getDashboardData(schoolId: number): Promise<PaymentsDashboard> {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  try {
    // Get this month's revenue
    const monthlyRevenue = await db
      .select({
        total: sum(payments.amount)
      })
      .from(payments)
      .innerJoin(families, eq(payments.familyId, families.id))
      .where(
        and(
          eq(families.schoolId, schoolId),
          eq(payments.status, 'completed'),
          gte(payments.paymentDate, currentMonth),
          lte(payments.paymentDate, nextMonth)
        )
      );

    // Get children's monthly fees for projected revenue
    const childrenRevenue = await db
      .select({
        total: sum(children.monthlyFee)
      })
      .from(children)
      .where(eq(children.schoolId, schoolId));

    // Get pending payments count
    const pendingPayments = await db
      .select({
        count: count()
      })
      .from(payments)
      .innerJoin(families, eq(payments.familyId, families.id))
      .where(
        and(
          eq(families.schoolId, schoolId),
          eq(payments.status, 'pending')
        )
      );

    // Get recent payments
    const recentPaymentsList = await db
      .select({
        id: payments.id,
        familyId: payments.familyId,
        amount: payments.amount,
        status: payments.status,
        paymentDate: payments.paymentDate,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        // We'll get family name from a separate query or use 'Family' as placeholder
        familyName: sql<string>`CAST('Family' AS TEXT)`
      })
      .from(payments)
      .innerJoin(families, eq(payments.familyId, families.id))
      .where(eq(families.schoolId, schoolId))
      .orderBy(desc(payments.paymentDate))
      .limit(5);

    return {
      totalRevenueThisMonth: (monthlyRevenue[0]?.total || 0).toString(),
      pendingPaymentsCount: pendingPayments[0]?.count || 0,
      failedPaymentsCount: 0, // TODO: Implement failed payments tracking
      activeAlertsCount: 0, // TODO: Implement alerts system
      totalChildrenRevenue: (Number(childrenRevenue[0]?.total || 0) / 100).toString(),
      recentPayments: recentPaymentsList.map(payment => ({
        id: payment.id,
        familyId: payment.familyId,
        familyName: payment.familyName,
        amount: (payment.amount / 100).toString(),
        status: payment.status,
        paymentDate: payment.paymentDate,
        stripePaymentIntentId: payment.stripePaymentIntentId || undefined
      }))
    };

  } catch (error) {
    console.error('Error in getDashboardData:', error);
    return {
      totalRevenueThisMonth: '0',
      pendingPaymentsCount: 0,
      failedPaymentsCount: 0,
      activeAlertsCount: 0,
      totalChildrenRevenue: '0',
      recentPayments: []
    };
  }
}

export async function getPaymentsList(filters: PaymentFilters): Promise<PaymentsListResponse> {
  try {
    const limit = filters.limit || 10;
    const offset = 0; // TODO: Add pagination support

    const conditions = [
      eq(families.schoolId, filters.schoolId)
    ];

    if (filters.familyId) {
      conditions.push(eq(payments.familyId, filters.familyId));
    }

    if (filters.status) {
      conditions.push(eq(payments.status, filters.status));
    }

    if (filters.startDate) {
      conditions.push(gte(payments.paymentDate, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(payments.paymentDate, filters.endDate));
    }

    const results = await db
      .select({
        id: payments.id,
        familyId: payments.familyId,
        amount: payments.amount,
        status: payments.status,
        paymentDate: payments.paymentDate,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        familyName: sql<string>`CAST('Family' AS TEXT)`
      })
      .from(payments)
      .innerJoin(families, eq(payments.familyId, families.id))
      .where(and(...conditions))
      .orderBy(desc(payments.paymentDate))
      .limit(limit);

    const totalCount = results.length; // TODO: Implement proper count query

    return {
      payments: results.map(payment => ({
        id: payment.id,
        familyId: payment.familyId,
        familyName: payment.familyName,
        amount: (payment.amount / 100).toString(),
        status: payment.status,
        paymentDate: payment.paymentDate,
        stripePaymentIntentId: payment.stripePaymentIntentId || undefined
      })),
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    };

  } catch (error) {
    console.error('Error in getPaymentsList:', error);
    return {
      payments: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: filters.limit || 10
      }
    };
  }
}

export async function getPaymentDetails(paymentId: string, schoolId: number): Promise<PaymentDetails | null> {
  try {
    const result = await db
      .select({
        id: payments.id,
        familyId: payments.familyId,
        amount: payments.amount,
        status: payments.status,
        paymentDate: payments.paymentDate,
        stripePaymentIntentId: payments.stripePaymentIntentId,
        discountApplied: payments.discountApplied,
        createdAt: payments.createdAt,
        familyName: sql<string>`CAST('Family' AS TEXT)`
      })
      .from(payments)
      .innerJoin(families, eq(payments.familyId, families.id))
      .where(
        and(
          eq(payments.id, paymentId),
          eq(families.schoolId, schoolId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const payment = result[0];
    return {
      id: payment.id,
      schoolId: schoolId,
      familyId: payment.familyId,
      stripePaymentIntentId: payment.stripePaymentIntentId || undefined,
      amount: (payment.amount / 100).toString(),
      status: payment.status,
      paymentDate: payment.paymentDate,
      discountApplied: payment.discountApplied,
      createdAt: payment.createdAt,
      familyName: payment.familyName || 'Unknown Family'
    };
  } catch (error) {
    console.error('Error in getPaymentDetails:', error);
    return null;
  }
}

export async function createPaymentRecord(data: NewPayment): Promise<Payment | null> {
  try {
    const result = await db
      .insert(payments)
      .values(data)
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Error in createPaymentRecord:', error);
    return null;
  }
}

export async function getChildrenFees(schoolId: number) {
  try {
    const childrenWithFees = await db
      .select({
        id: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        monthlyFee: children.monthlyFee,
        enrollmentStatus: children.enrollmentStatus,
        dateOfBirth: children.dateOfBirth
      })
      .from(children)
      .where(eq(children.schoolId, schoolId));

    return childrenWithFees.map(child => ({
      ...child,
      monthlyFee: child.monthlyFee / 100 // Convert from cents to dollars
    }));

  } catch (error) {
    console.error('Error in getChildrenFees:', error);
    return [];
  }
}