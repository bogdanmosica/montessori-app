import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { ActivityReportService } from '@/lib/services/reports/activity-report-service';
import { CsvExportService } from '@/lib/services/export/csv-export-service';
import { PdfExportService } from '@/lib/services/export/pdf-export-service';
import { activityReportParamsSchema } from '@/lib/validations/report-filters';
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
      activityType: searchParams.get('activityType') || undefined,
      format: searchParams.get('format') || EXPORT_FORMATS.JSON
    };

    const validationResult = activityReportParamsSchema.safeParse(params);
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

    // Additional service-level validation
    const filterErrors = await ActivityReportService.validateFilters({
      dateRange: filters.dateRange,
      activityType: filters.activityType
    });

    if (filterErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Bad Request - Invalid filters',
          details: filterErrors
        },
        { status: 400 }
      );
    }

    // For development - return mock data
    const reportResult = {
      data: [
        {
          activityId: 'act-001',
          activityType: 'login' as const,
          performedBy: 'Admin User',
          performedByRole: 'admin' as const,
          targetEntity: 'dashboard',
          targetId: 'admin-dashboard',
          description: 'User logged into admin dashboard',
          timestamp: new Date('2025-09-29T10:30:00Z'),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ],
      metadata: {
        totalRows: 1,
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
        const csvResult = CsvExportService.exportActivity(
          reportResult.data,
          reportResult.metadata
        );

        return new NextResponse(csvResult.content, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${csvResult.filename}"`
          }
        });

      case EXPORT_FORMATS.PDF:
        const pdfResult = PdfExportService.exportActivity(
          reportResult.data,
          reportResult.metadata
        );

        return new NextResponse(new Uint8Array(pdfResult.content), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${pdfResult.filename}"`
          }
        });

      default:
        return NextResponse.json(
          { error: 'Bad Request - Unsupported export format' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Activity report API error:', error);

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