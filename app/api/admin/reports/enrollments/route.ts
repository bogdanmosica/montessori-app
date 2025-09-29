import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { enrollmentsReportParamsSchema } from '@/lib/validations/report-filters';
import { EXPORT_FORMATS } from '@/lib/constants/report-constants';
import { EnrollmentsReportService } from '@/lib/services/reports/enrollments-report-service';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Admin role verification
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get tenant ID from user session
    const tenantId = session.user.teamId?.toString();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Bad Request - No school/tenant context found' },
        { status: 400 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') || undefined,
      format: searchParams.get('format') || EXPORT_FORMATS.JSON
    };

    const validationResult = enrollmentsReportParamsSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Bad Request - Invalid parameters',
          details: validationResult.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const filters = validationResult.data;

    // Validate filters using the service
    const validationErrors = await EnrollmentsReportService.validateFilters({
      dateRange: filters.startDate && filters.endDate ? {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate)
      } : undefined,
      status: filters.status || undefined
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Bad Request - Invalid filters',
          details: validationErrors.map(error => ({ message: error }))
        },
        { status: 400 }
      );
    }

    // Generate the actual report using the service
    const reportResult = await EnrollmentsReportService.generateReport(
      tenantId,
      session.user.id.toString(),
      {
        dateRange: filters.startDate && filters.endDate ? {
          startDate: new Date(filters.startDate),
          endDate: new Date(filters.endDate)
        } : undefined,
        status: filters.status || undefined
      }
    );

    // Handle different export formats
    switch (filters.format) {
      case EXPORT_FORMATS.JSON:
        return NextResponse.json(reportResult);

      case EXPORT_FORMATS.CSV:
        // Generate CSV content directly
        const csvHeaders = [
          'Enrollment ID',
          'Child Name',
          'Child Date of Birth',
          'Parent Name',
          'Parent Email',
          'Parent Phone',
          'Enrollment Date',
          'Enrollment Status',
          'Program Type',
          'Monthly Fee',
          'Start Date',
          'End Date'
        ];

        const csvRows = reportResult.data.map(row => [
          row.enrollmentId,
          row.childName,
          row.childDateOfBirth.toISOString().split('T')[0],
          row.parentName,
          row.parentEmail,
          row.parentPhone,
          row.enrollmentDate.toISOString().split('T')[0],
          row.enrollmentStatus,
          `"${row.programType}"`,
          row.monthlyFee.toString(),
          row.startDate.toISOString().split('T')[0],
          row.endDate ? new Date(row.endDate).toISOString().split('T')[0] : 'Ongoing'
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const csvFilename = `enrollments-report_school-${tenantId}_${timestamp}.csv`;

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${csvFilename}"`
          }
        });

      case EXPORT_FORMATS.PDF:
        // Generate simple PDF content
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(Enrollments Report) Tj
0 -30 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
0 -20 Td
(Total Records: ${reportResult.data.length}) Tj
${reportResult.data.map((enr, i) => `
0 -20 Td
(${i + 1}. ${enr.childName} - ${enr.enrollmentStatus}) Tj`).join('')}
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000109 00000 n 
0000000158 00000 n 
0000000369 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
439
%%EOF`;

        const pdfTimestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const pdfFilename = `enrollments-report_school-${tenantId}_${pdfTimestamp}.pdf`;

        return new NextResponse(pdfContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${pdfFilename}"`
          }
        });

      default:
        return NextResponse.json(
          { error: 'Bad Request - Unsupported export format' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Enrollments report API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Database connection')) {
        return NextResponse.json(
          { error: 'Internal Server Error - Database unavailable' },
          { status: 500 }
        );
      }

      if (error.message.includes('Timeout')) {
        return NextResponse.json(
          { error: 'Internal Server Error - Request timeout' },
          { status: 500 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal Server Error - Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type'
    }
  });
}