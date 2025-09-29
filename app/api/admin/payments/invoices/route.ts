import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import { getInvoicesList } from '@/lib/services/invoice-service';

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

    // Parse optional filter parameters
    const parentId = searchParams.get('parent_id') || undefined;
    const status = searchParams.get('status') as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | undefined;

    const dueBefore = searchParams.get('due_before')
      ? new Date(searchParams.get('due_before')!)
      : undefined;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate date
    if (dueBefore && isNaN(dueBefore.getTime())) {
      return NextResponse.json({ error: 'Invalid due_before date format' }, { status: 400 });
    }

    // Validate status enum
    if (status && !['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const filters = {
      schoolId: schoolIdNum,
      parentId,
      status,
      dueBefore,
      page: Math.max(page, 1),
      limit: Math.min(Math.max(limit, 10), 100)
    };

    const result = await getInvoicesList(filters);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Invoices list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}