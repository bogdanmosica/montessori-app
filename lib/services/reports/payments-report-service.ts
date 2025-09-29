import { db } from '@/lib/db';
import { paymentRecords, parentProfiles, children } from '@/lib/db/schema';
import { eq, and, gte, lte, inArray, desc } from 'drizzle-orm';
import { PaymentReportRow, ReportMetadata } from '@/lib/types/report-types';
import { PaymentStatus } from '@/lib/constants/payment-status';
import { REPORT_LIMITS } from '@/lib/constants/report-constants';

interface PaymentsReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  status?: PaymentStatus[];
}

export class PaymentsReportService {
  static async generateReport(
    tenantId: string,
    requestedBy: string,
    filters: PaymentsReportFilters
  ): Promise<{ data: PaymentReportRow[]; metadata: ReportMetadata }> {
    const startTime = Date.now();

    // Build query conditions
    const conditions = [
      eq(paymentRecords.schoolId, parseInt(tenantId))
    ];

    // Add date range filter
    if (filters.dateRange) {
      conditions.push(gte(paymentRecords.paymentDate, filters.dateRange.startDate));
      conditions.push(lte(paymentRecords.paymentDate, filters.dateRange.endDate));
    }

    // Add status filter
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(paymentRecords.paymentStatus, filters.status));
    }

    // Execute query with joins
    const results = await db
      .select({
        paymentId: paymentRecords.id,
        stripePaymentId: paymentRecords.stripePaymentId,
        amount: paymentRecords.amount,
        currency: paymentRecords.currency,
        paymentMethod: paymentRecords.paymentMethod,
        paymentStatus: paymentRecords.paymentStatus,
        paymentDate: paymentRecords.paymentDate,
        completedDate: paymentRecords.completedDate,
        failureReason: paymentRecords.failureReason,
        description: paymentRecords.description,
        parentName: parentProfiles.name,
        parentEmail: parentProfiles.email,
        childFirstName: children.firstName,
        childLastName: children.lastName
      })
      .from(paymentRecords)
      .leftJoin(parentProfiles, eq(paymentRecords.parentId, parentProfiles.id))
      .leftJoin(children, eq(paymentRecords.childId, children.id))
      .where(and(...conditions))
      .orderBy(desc(paymentRecords.paymentDate))
      .limit(REPORT_LIMITS.MAX_RECORDS);

    // Transform to report format
    const reportData: PaymentReportRow[] = results.map(row => {
      // Determine transaction type based on payment status and description
      let transactionType: 'payment' | 'refund' | 'failed_charge';
      if (row.paymentStatus === 'refunded') {
        transactionType = 'refund';
      } else if (row.paymentStatus === 'failed') {
        transactionType = 'failed_charge';
      } else {
        transactionType = 'payment';
      }

      return {
        paymentId: row.paymentId,
        parentName: row.parentName || 'Unknown',
        parentEmail: row.parentEmail || '',
        childName: `${row.childFirstName || ''} ${row.childLastName || ''}`.trim(),
        transactionType,
        amount: parseFloat(row.amount),
        currency: row.currency,
        transactionDate: row.paymentDate,
        paymentMethod: this.formatPaymentMethod(row.paymentMethod),
        status: row.paymentStatus,
        stripeTransactionId: row.stripePaymentId || undefined,
        failureReason: row.failureReason || undefined,
        refundReason: transactionType === 'refund' ? row.description : undefined
      };
    });

    // Build metadata
    const metadata: ReportMetadata = {
      totalRows: reportData.length,
      generatedAt: new Date(),
      filters,
      tenantId,
      requestedBy
    };

    const endTime = Date.now();
    console.log(`Payments report generated in ${endTime - startTime}ms`);

    return { data: reportData, metadata };
  }

  private static formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'stripe_card': 'Credit Card (Stripe)',
      'stripe_bank': 'Bank Transfer (Stripe)',
      'bank_transfer': 'Bank Transfer',
      'ach': 'ACH Transfer'
    };

    return methodMap[method] || method;
  }

  static async validateFilters(filters: PaymentsReportFilters): Promise<string[]> {
    const errors: string[] = [];

    // Validate date range
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;

      if (startDate > endDate) {
        errors.push('Start date must be before or equal to end date');
      }

      const yearsDiff = (endDate.getFullYear() - startDate.getFullYear());
      if (yearsDiff > REPORT_LIMITS.MAX_DATE_RANGE_YEARS) {
        errors.push(`Date range cannot exceed ${REPORT_LIMITS.MAX_DATE_RANGE_YEARS} years`);
      }
    }

    // Validate status values
    if (filters.status) {
      const validStatuses = Object.values(PaymentStatus);
      const invalidStatuses = filters.status.filter(status => !validStatuses.includes(status));

      if (invalidStatuses.length > 0) {
        errors.push(`Invalid status values: ${invalidStatuses.join(', ')}`);
      }
    }

    return errors;
  }

  static async getPaymentSummary(tenantId: string, filters?: PaymentsReportFilters): Promise<{
    totalRevenue: number;
    successfulPayments: number;
    failedPayments: number;
    refundedAmount: number;
    pendingAmount: number;
  }> {
    const conditions = [eq(paymentRecords.schoolId, parseInt(tenantId))];

    if (filters?.dateRange) {
      conditions.push(gte(paymentRecords.paymentDate, filters.dateRange.startDate));
      conditions.push(lte(paymentRecords.paymentDate, filters.dateRange.endDate));
    }

    const results = await db
      .select({
        amount: paymentRecords.amount,
        status: paymentRecords.paymentStatus
      })
      .from(paymentRecords)
      .where(and(...conditions));

    let totalRevenue = 0;
    let successfulPayments = 0;
    let failedPayments = 0;
    let refundedAmount = 0;
    let pendingAmount = 0;

    results.forEach(row => {
      const amount = parseFloat(row.amount);

      switch (row.status) {
        case 'completed':
          totalRevenue += amount;
          successfulPayments++;
          break;
        case 'failed':
          failedPayments++;
          break;
        case 'refunded':
          refundedAmount += amount;
          break;
        case 'pending':
          pendingAmount += amount;
          break;
      }
    });

    return {
      totalRevenue,
      successfulPayments,
      failedPayments,
      refundedAmount,
      pendingAmount
    };
  }
}