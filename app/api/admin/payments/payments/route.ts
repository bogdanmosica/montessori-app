import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import { db } from '@/lib/db';
import { payments, families } from '@/lib/db/schema';
import { eq, desc, asc, and, gte, lte, like } from 'drizzle-orm';

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
    const childId = searchParams.get('child_id') || undefined;
    const status = searchParams.get('status') as 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded' | undefined;
    const paymentMethod = searchParams.get('payment_method') as 'stripe_card' | 'stripe_bank' | 'bank_transfer' | 'ach' | undefined;

    const startDate = searchParams.get('start_date')
      ? new Date(searchParams.get('start_date')!)
      : undefined;
    const endDate = searchParams.get('end_date')
      ? new Date(searchParams.get('end_date')!)
      : undefined;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start_date format' }, { status: 400 });
    }

    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid end_date format' }, { status: 400 });
    }

    // Validate status enum
    if (status && !['pending', 'completed', 'failed', 'cancelled', 'refunded'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Validate payment method enum
    if (paymentMethod && !['stripe_card', 'stripe_bank', 'bank_transfer', 'ach'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment_method value' }, { status: 400 });
    }

    const filters = {
      schoolId: schoolIdNum,
      familyId: undefined, // No familyId filter in this API
      status,
      startDate,
      endDate,
      page: Math.max(page, 1),
      limit: Math.min(Math.max(limit, 10), 100)
    };

    // Build where conditions
    const whereConditions = [eq(families.schoolId, filters.schoolId)];
    
    if (filters.status) {
      whereConditions.push(eq(payments.status, filters.status));
    }

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      whereConditions.push(
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate)
      );
    }

    // Query payments with all conditions
    const paymentsData = await db.select({
      id: payments.id,
      familyId: payments.familyId,
      amount: payments.amount,
      status: payments.status,
      paymentDate: payments.paymentDate,
      createdAt: payments.createdAt
    }).from(payments)
      .innerJoin(families, eq(payments.familyId, families.id))
      .where(and(...whereConditions))
      .orderBy(desc(payments.createdAt))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit);

    const result = {
      payments: paymentsData,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: paymentsData.length,
        totalPages: Math.ceil(paymentsData.length / filters.limit)
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Payments list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}