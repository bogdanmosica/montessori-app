import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
// import { getPaymentDetails } from '@/lib/services/payment-service';

interface RouteParams {
  params: Promise<{
    payment_id: string;
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

    const { payment_id } = await params;
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    const schoolIdNum = parseInt(schoolId);
    if (isNaN(schoolIdNum)) {
      return NextResponse.json({ error: 'Invalid school ID' }, { status: 400 });
    }

    const paymentDetails = await getPaymentDetails(payment_id, schoolIdNum);

    if (!paymentDetails) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(paymentDetails);

  } catch (error) {
    console.error('Payment details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}