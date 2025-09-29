import jsPDF from 'jspdf';
import { PDF_SETTINGS } from '@/lib/constants/report-constants';
import type {
  ApplicationReportRow,
  EnrollmentReportRow,
  PaymentReportRow,
  ActivityReportRow,
  ReportMetadata
} from '@/lib/types/report-types';

export class PdfExportService {
  static exportApplications(data: ApplicationReportRow[], metadata: ReportMetadata): { content: Buffer; filename: string } {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    this.addHeader(doc, 'Applications Report', metadata);
    this.addSummary(doc, {
      'Total Applications': data.length.toString(),
      'Report Generated': metadata.generatedAt.toLocaleDateString(),
      'Date Range': this.formatDateRange(metadata.filters.dateRange)
    });

    // Table headers
    const headers = [
      'Child Name', 'Parent Name', 'Email', 'Phone', 'Status', 'Application Date', 'Reviewed By'
    ];

    // Table data (truncated for space)
    const tableData = data.map(row => [
      this.truncate(row.childName, 20),
      this.truncate(row.parentName, 20),
      this.truncate(row.parentEmail, 25),
      this.truncate(row.parentPhone, 15),
      row.applicationStatus,
      row.applicationDate.toLocaleDateString(),
      this.truncate(row.reviewedBy || 'Pending', 15)
    ]);

    this.addTable(doc, headers, tableData);
    this.addFooter(doc);

    const content = Buffer.from(doc.output('arraybuffer'));
    const filename = this.generateFilename('applications', metadata);

    return { content, filename };
  }

  static exportEnrollments(data: EnrollmentReportRow[], metadata: ReportMetadata): { content: Buffer; filename: string } {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    this.addHeader(doc, 'Enrollments Report', metadata);
    this.addSummary(doc, {
      'Total Enrollments': data.length.toString(),
      'Report Generated': metadata.generatedAt.toLocaleDateString(),
      'Date Range': this.formatDateRange(metadata.filters.dateRange)
    });

    const headers = [
      'Child Name', 'Parent Name', 'Email', 'Status', 'Program', 'Monthly Fee', 'Start Date'
    ];

    const tableData = data.map(row => [
      this.truncate(row.childName, 20),
      this.truncate(row.parentName, 20),
      this.truncate(row.parentEmail, 25),
      row.enrollmentStatus,
      this.truncate(row.programType, 15),
      `$${row.monthlyFee.toFixed(2)}`,
      row.startDate.toLocaleDateString()
    ]);

    this.addTable(doc, headers, tableData);
    this.addFooter(doc);

    const content = Buffer.from(doc.output('arraybuffer'));
    const filename = this.generateFilename('enrollments', metadata);

    return { content, filename };
  }

  static exportPayments(data: PaymentReportRow[], metadata: ReportMetadata): { content: Buffer; filename: string } {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    this.addHeader(doc, 'Payments Report', metadata);

    // Calculate summary metrics
    const totalAmount = data.reduce((sum, row) => sum + row.amount, 0);
    const successfulPayments = data.filter(row => row.status === 'completed').length;

    this.addSummary(doc, {
      'Total Transactions': data.length.toString(),
      'Total Amount': `$${totalAmount.toFixed(2)}`,
      'Successful Payments': successfulPayments.toString(),
      'Report Generated': metadata.generatedAt.toLocaleDateString()
    });

    const headers = [
      'Parent Name', 'Child Name', 'Amount', 'Type', 'Method', 'Status', 'Date'
    ];

    const tableData = data.map(row => [
      this.truncate(row.parentName, 20),
      this.truncate(row.childName, 20),
      `$${row.amount.toFixed(2)}`,
      row.transactionType,
      this.truncate(row.paymentMethod, 15),
      row.status,
      row.transactionDate.toLocaleDateString()
    ]);

    this.addTable(doc, headers, tableData);
    this.addFooter(doc);

    const content = Buffer.from(doc.output('arraybuffer'));
    const filename = this.generateFilename('payments', metadata);

    return { content, filename };
  }

  static exportActivity(data: ActivityReportRow[], metadata: ReportMetadata): { content: Buffer; filename: string } {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    this.addHeader(doc, 'Activity Report', metadata);
    this.addSummary(doc, {
      'Total Activities': data.length.toString(),
      'Report Generated': metadata.generatedAt.toLocaleDateString(),
      'Date Range': this.formatDateRange(metadata.filters.dateRange)
    });

    const headers = [
      'User', 'Role', 'Activity', 'Target', 'Description', 'Timestamp'
    ];

    const tableData = data.map(row => [
      this.truncate(row.performedBy, 20),
      row.performedByRole,
      this.truncate(row.activityType, 15),
      this.truncate(row.targetEntity, 15),
      this.truncate(row.description, 30),
      row.timestamp.toLocaleString()
    ]);

    this.addTable(doc, headers, tableData);
    this.addFooter(doc);

    const content = Buffer.from(doc.output('arraybuffer'));
    const filename = this.generateFilename('activity', metadata);

    return { content, filename };
  }

  private static addHeader(doc: jsPDF, title: string, metadata: ReportMetadata): void {
    // School letterhead area
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Monte SMS - Montessori School Management', 20, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`School ID: ${metadata.tenantId}`, 20, 28);

    // Report title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 40);

    // Current Y position after header
    return;
  }

  private static addSummary(doc: jsPDF, summary: Record<string, string>): void {
    let yPos = 50;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Summary:', 20, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'normal');

    Object.entries(summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 25, yPos);
      yPos += 6;
    });
  }

  private static addTable(doc: jsPDF, headers: string[], data: string[][]): void {
    const startY = 90;
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 20;
    const marginRight = 20;
    const tableWidth = pageWidth - marginLeft - marginRight;
    const colWidth = tableWidth / headers.length;

    let currentY = startY;

    // Table headers
    doc.setFillColor(240, 240, 240);
    doc.rect(marginLeft, currentY - 5, tableWidth, 8, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    headers.forEach((header, index) => {
      const x = marginLeft + (index * colWidth) + 2;
      doc.text(header, x, currentY);
    });

    currentY += 10;

    // Table data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;

        // Repeat headers on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(marginLeft, currentY - 5, tableWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          const x = marginLeft + (index * colWidth) + 2;
          doc.text(header, x, currentY);
        });
        currentY += 10;
        doc.setFont('helvetica', 'normal');
      }

      // Alternate row colors
      if (rowIndex % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(marginLeft, currentY - 5, tableWidth, 7, 'F');
      }

      row.forEach((cell, cellIndex) => {
        const x = marginLeft + (cellIndex * colWidth) + 2;
        doc.text(cell, x, currentY);
      });

      currentY += 7;
    });
  }

  private static addFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      // Page number
      doc.text(`Page ${i} of ${pageCount}`, 20, pageHeight - 10);

      // Generated timestamp
      const timestamp = new Date().toLocaleString();
      doc.text(`Generated: ${timestamp}`, 150, pageHeight - 10);
    }
  }

  private static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private static formatDateRange(dateRange?: { startDate: Date; endDate: Date }): string {
    if (!dateRange) return 'All dates';
    return `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`;
  }

  private static generateFilename(reportType: string, metadata: ReportMetadata): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const schoolId = metadata.tenantId;

    return `${reportType}-report_school-${schoolId}_${timestamp}.pdf`;
  }

  static validatePdfData(data: unknown[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { isValid: false, errors };
    }

    if (data.length > 1000) {
      errors.push('PDF export limited to 1000 records for performance reasons');
    }

    // Check for extremely long text fields that might break PDF layout
    data.forEach((row, index) => {
      if (typeof row === 'object' && row !== null) {
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === 'string' && value.length > 500) {
            errors.push(`Text field "${key}" in row ${index + 1} is too long for PDF export (${value.length} characters)`);
          }
        });
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  static estimateFileSize(data: unknown[]): number {
    // Rough estimation of PDF file size in bytes
    const baseSize = 50 * 1024; // 50KB base PDF size
    const bytesPerRow = 150; // Estimated bytes per table row

    return baseSize + (data.length * bytesPerRow);
  }
}