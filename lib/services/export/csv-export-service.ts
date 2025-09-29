import { CSV_SETTINGS } from '@/lib/constants/report-constants';
import type {
  ApplicationReportRow,
  EnrollmentReportRow,
  PaymentReportRow,
  ActivityReportRow,
  ReportMetadata
} from '@/lib/types/report-types';

export class CsvExportService {
  static exportApplications(data: ApplicationReportRow[], metadata: ReportMetadata): { content: string; filename: string } {
    const headers = [
      'Application ID',
      'Application Date',
      'Child Name',
      'Child Date of Birth',
      'Parent Name',
      'Parent Email',
      'Parent Phone',
      'Parent Address',
      'Application Status',
      'Submission Date',
      'Reviewed By',
      'Reviewed At',
      'Notes'
    ];

    const rows = data.map(row => [
      row.applicationId,
      this.formatDate(row.applicationDate),
      row.childName,
      this.formatDate(row.childDateOfBirth),
      row.parentName,
      row.parentEmail,
      row.parentPhone,
      row.parentAddress,
      row.applicationStatus,
      this.formatDate(row.submissionDate),
      row.reviewedBy || '',
      row.reviewedAt ? this.formatDate(row.reviewedAt) : '',
      row.notes || ''
    ]);

    const content = this.generateCsvContent(headers, rows);
    const filename = this.generateFilename('applications', metadata);

    return { content, filename };
  }

  static exportEnrollments(data: EnrollmentReportRow[], metadata: ReportMetadata): { content: string; filename: string } {
    const headers = [
      'Enrollment ID',
      'Child Name',
      'Child Date of Birth',
      'Parent Name',
      'Parent Email',
      'Parent Phone',
      'Parent Address',
      'Enrollment Date',
      'Enrollment Status',
      'Program Type',
      'Monthly Fee',
      'Start Date',
      'End Date'
    ];

    const rows = data.map(row => [
      row.enrollmentId,
      row.childName,
      this.formatDate(row.childDateOfBirth),
      row.parentName,
      row.parentEmail,
      row.parentPhone,
      row.parentAddress,
      this.formatDate(row.enrollmentDate),
      row.enrollmentStatus,
      row.programType,
      row.monthlyFee.toString(),
      this.formatDate(row.startDate),
      row.endDate ? this.formatDate(row.endDate) : ''
    ]);

    const content = this.generateCsvContent(headers, rows);
    const filename = this.generateFilename('enrollments', metadata);

    return { content, filename };
  }

  static exportPayments(data: PaymentReportRow[], metadata: ReportMetadata): { content: string; filename: string } {
    const headers = [
      'Payment ID',
      'Parent Name',
      'Parent Email',
      'Child Name',
      'Transaction Type',
      'Amount',
      'Currency',
      'Transaction Date',
      'Payment Method',
      'Status',
      'Stripe Transaction ID',
      'Failure Reason',
      'Refund Reason'
    ];

    const rows = data.map(row => [
      row.paymentId,
      row.parentName,
      row.parentEmail,
      row.childName,
      row.transactionType,
      row.amount.toString(),
      row.currency,
      this.formatDate(row.transactionDate),
      row.paymentMethod,
      row.status,
      row.stripeTransactionId || '',
      row.failureReason || '',
      row.refundReason || ''
    ]);

    const content = this.generateCsvContent(headers, rows);
    const filename = this.generateFilename('payments', metadata);

    return { content, filename };
  }

  static exportActivity(data: ActivityReportRow[], metadata: ReportMetadata): { content: string; filename: string } {
    const headers = [
      'Activity ID',
      'Activity Type',
      'Performed By',
      'Role',
      'Target Entity',
      'Target ID',
      'Description',
      'Timestamp',
      'IP Address',
      'User Agent'
    ];

    const rows = data.map(row => [
      row.activityId,
      row.activityType,
      row.performedBy,
      row.performedByRole,
      row.targetEntity,
      row.targetId,
      row.description,
      this.formatDate(row.timestamp),
      row.ipAddress || '',
      row.userAgent || ''
    ]);

    const content = this.generateCsvContent(headers, rows);
    const filename = this.generateFilename('activity', metadata);

    return { content, filename };
  }

  private static generateCsvContent(headers: string[], rows: string[][]): string {
    // Add BOM for Excel compatibility
    const bom = CSV_SETTINGS.INCLUDE_BOM ? '\uFEFF' : '';

    // Escape and quote fields that need it
    const escapeField = (field: string): string => {
      if (field.includes(CSV_SETTINGS.DELIMITER) ||
          field.includes(CSV_SETTINGS.QUOTE_CHAR) ||
          field.includes('\n') ||
          field.includes('\r')) {
        return CSV_SETTINGS.QUOTE_CHAR +
               field.replace(new RegExp(CSV_SETTINGS.QUOTE_CHAR, 'g'), CSV_SETTINGS.QUOTE_CHAR + CSV_SETTINGS.QUOTE_CHAR) +
               CSV_SETTINGS.QUOTE_CHAR;
      }
      return field;
    };

    // Build CSV content
    const headerLine = headers.map(escapeField).join(CSV_SETTINGS.DELIMITER);
    const dataLines = rows.map(row =>
      row.map(field => escapeField(field.toString())).join(CSV_SETTINGS.DELIMITER)
    );

    return bom + headerLine + '\n' + dataLines.join('\n');
  }

  private static formatDate(date: Date): string {
    // Format as YYYY-MM-DD HH:MM:SS for consistency
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  private static generateFilename(reportType: string, metadata: ReportMetadata): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const schoolId = metadata.tenantId;

    return `${reportType}-report_school-${schoolId}_${timestamp}.csv`;
  }

  static validateCsvData(data: unknown[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { isValid: false, errors };
    }

    if (data.length === 0) {
      // Empty data is valid - will create empty CSV with headers
      return { isValid: true, errors: [] };
    }

    // Check for potential CSV injection
    const dangerousPrefixes = ['=', '+', '-', '@'];
    data.forEach((row, index) => {
      if (typeof row === 'object' && row !== null) {
        Object.values(row).forEach((value, fieldIndex) => {
          const stringValue = String(value);
          if (dangerousPrefixes.some(prefix => stringValue.startsWith(prefix))) {
            errors.push(`Potential CSV injection detected in row ${index + 1}, field ${fieldIndex + 1}: "${stringValue}"`);
          }
        });
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  static estimateFileSize(data: unknown[]): number {
    // Rough estimation of CSV file size in bytes
    if (!Array.isArray(data) || data.length === 0) {
      return 1024; // Empty file size estimate
    }

    // Sample first few rows to estimate average row size
    const sampleSize = Math.min(10, data.length);
    const sampleRows = data.slice(0, sampleSize);

    let totalSize = 0;
    sampleRows.forEach(row => {
      if (typeof row === 'object' && row !== null) {
        totalSize += JSON.stringify(row).length * 1.2; // CSV is typically larger than JSON
      }
    });

    const averageRowSize = totalSize / sampleSize;
    const estimatedSize = (averageRowSize * data.length) + 1024; // Add overhead

    return Math.ceil(estimatedSize);
  }
}