import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import { getInvoiceDetails } from '@/lib/services/invoice-service';

interface RouteParams {
  params: Promise<{
    invoice_id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { invoice_id } = await params;
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    const schoolIdNum = parseInt(schoolId);
    if (isNaN(schoolIdNum)) {
      return NextResponse.json({ error: 'Invalid school ID' }, { status: 400 });
    }

    const invoiceDetails = await getInvoiceDetails(invoice_id, schoolIdNum);

    if (!invoiceDetails) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // TODO: Implement PDF generation
    // For now, return a placeholder response
    // In a real implementation, you would:
    // 1. Generate PDF using a library like puppeteer or jsPDF
    // 2. Store the PDF in cloud storage (S3, etc.)
    // 3. Return the PDF as a download response

    const pdfBuffer = Buffer.from(`Invoice ${invoiceDetails.invoiceNumber} PDF content would be here`);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceDetails.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Invoice PDF download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}