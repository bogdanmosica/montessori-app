import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import { resolvePaymentAlert } from '@/lib/services/alert-service';
import { z } from 'zod';

const ResolveAlertRequestSchema = z.object({
  school_id: z.string().transform(val => parseInt(val)),
  resolution_notes: z.string().min(1, 'Resolution notes are required')
});

interface RouteParams {
  params: Promise<{
    alert_id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { alert_id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = ResolveAlertRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { school_id: schoolId, resolution_notes } = validation.data;

    const resolvedAlert = await resolvePaymentAlert(
      alert_id,
      schoolId,
      session.user.id,
      resolution_notes
    );

    if (!resolvedAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(resolvedAlert);

  } catch (error) {
    console.error('Alert resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}