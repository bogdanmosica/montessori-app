import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { applicationsReportParamsSchema } from '@/lib/validations/report-filters';
import { EXPORT_FORMATS } from '@/lib/constants/report-constants';

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

    const validationResult = applicationsReportParamsSchema.safeParse(params);
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

    // Skip service-level validation for mock implementation

    // For development - return mock data
    const reportResult = {
      data: [
        {
          applicationId: 'app-001',
          applicationDate: new Date('2025-09-15'),
          childName: 'Emma Johnson',
          childDateOfBirth: new Date('2020-03-10'),
          parentName: 'Sarah Johnson',
          parentEmail: 'sarah.johnson@email.com',
          parentPhone: '+1-555-0123',
          parentAddress: '123 Oak Street, Cityville, ST 12345',
          applicationStatus: 'PENDING',
          submissionDate: new Date('2025-09-15'),
          reviewedBy: undefined,
          reviewedAt: undefined,
          notes: undefined
        },
        {
          applicationId: 'app-002',
          applicationDate: new Date('2025-09-10'),
          childName: 'Marcus Chen',
          childDateOfBirth: new Date('2019-11-22'),
          parentName: 'Lisa Chen',
          parentEmail: 'lisa.chen@email.com',
          parentPhone: '+1-555-0124',
          parentAddress: '456 Maple Ave, Townsburg, ST 12346',
          applicationStatus: 'APPROVED',
          submissionDate: new Date('2025-09-10'),
          reviewedBy: 'Admin User',
          reviewedAt: new Date('2025-09-12'),
          notes: 'Excellent application, child shows good social skills'
        }
      ],
      metadata: {
        totalRows: 2,
        generatedAt: new Date(),
        filters,
        tenantId,
        requestedBy: session.user.id.toString()
      }
    };

    // Handle different export formats
    switch (filters.format) {
      case EXPORT_FORMATS.JSON:
        return NextResponse.json(reportResult);

      case EXPORT_FORMATS.CSV:
        // Generate CSV content directly
        const csvHeaders = [
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

        const csvRows = reportResult.data.map(row => [
          row.applicationId,
          row.applicationDate.toISOString().split('T')[0],
          row.childName,
          row.childDateOfBirth.toISOString().split('T')[0],
          row.parentName,
          row.parentEmail,
          row.parentPhone,
          `"${row.parentAddress}"`,
          row.applicationStatus,
          row.submissionDate.toISOString().split('T')[0],
          row.reviewedBy || '',
          row.reviewedAt ? row.reviewedAt.toISOString().split('T')[0] : '',
          `"${row.notes || ''}"`
        ]);

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const csvFilename = `applications-report_school-${tenantId}_${timestamp}.csv`;

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${csvFilename}"`
          }
        });

      case EXPORT_FORMATS.PDF:
        // Generate simple PDF content (mock for now)
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
(Applications Report) Tj
0 -30 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
0 -20 Td
(Total Records: ${reportResult.data.length}) Tj
${reportResult.data.map((app, i) => `
0 -20 Td
(${i + 1}. ${app.childName} - ${app.applicationStatus}) Tj`).join('')}
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
        const pdfFilename = `applications-report_school-${tenantId}_${pdfTimestamp}.pdf`;

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
    console.error('Applications report API error:', error);

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