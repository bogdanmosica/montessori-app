import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
// import { getPaymentAlerts } from '@/lib/services/alert-service';

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
    const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | undefined;
    const isResolved = searchParams.get('is_resolved') === 'true';

    // Validate severity enum
    if (severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json({ error: 'Invalid severity value' }, { status: 400 });
    }

    // Return mock alerts data
    const result = {
      alerts: isResolved ? [] : [
        {
          id: "1",
          parentId: "parent-1",
          parentName: "Johnson Family",
          paymentId: "payment-123",
          alertType: "overdue_payment",
          severity: "high",
          title: "Payment Overdue",
          message: "Payment is 5 days overdue",
          isResolved: false,
          resolvedBy: null,
          resolvedAt: null,
          createdAt: new Date()
        }
      ]
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Payment alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment alerts' },
      { status: 500 }
    );
  }
}