import { ReportType, ExportFormat } from '@/lib/constants/report-constants';

// Filter types
export interface ReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  status?: string[];
  entityType?: string;
}

export interface ReportConfig {
  type: ReportType;
  filters: ReportFilters;
  format: ExportFormat;
  tenantId: string;
  requestedBy: string;
  requestedAt: Date;
}

// Report metadata
export interface ReportMetadata {
  totalRows: number;
  generatedAt: Date;
  filters: ReportFilters;
  tenantId: string;
  requestedBy: string;
}

// Application report data structure
export interface ApplicationReportRow {
  applicationId: string;
  applicationDate: Date;
  childName: string;
  childDateOfBirth: Date;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentAddress: string;
  applicationStatus: string;
  submissionDate: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}

// Enrollment report data structure
export interface EnrollmentReportRow {
  enrollmentId: string;
  childName: string;
  childDateOfBirth: Date;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentAddress: string;
  enrollmentDate: Date;
  enrollmentStatus: string;
  programType: string;
  monthlyFee: number;
  startDate: Date;
  endDate?: Date;
}

// Payment report data structure
export interface PaymentReportRow {
  paymentId: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  transactionType: 'payment' | 'refund' | 'failed_charge';
  amount: number;
  currency: string;
  transactionDate: Date;
  paymentMethod: string;
  status: string;
  stripeTransactionId?: string;
  failureReason?: string;
  refundReason?: string;
}

// Activity report data structure
export interface ActivityReportRow {
  activityId: string;
  activityType: string;
  performedBy: string;
  performedByRole: string;
  targetEntity: string;
  targetId: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Response types
export interface ReportResponse<T> {
  data: T[];
  metadata: ReportMetadata;
}

export type ApplicationsReportResponse = ReportResponse<ApplicationReportRow>;
export type EnrollmentsReportResponse = ReportResponse<EnrollmentReportRow>;
export type PaymentsReportResponse = ReportResponse<PaymentReportRow>;
export type ActivityReportResponse = ReportResponse<ActivityReportRow>;