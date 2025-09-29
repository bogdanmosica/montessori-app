import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import { db } from '@/lib/db';
import { children, families, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Get children with their fees
    const childrenWithFees = await db
      .select({
        id: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        monthlyFee: children.monthlyFee,
        enrollmentStatus: children.enrollmentStatus,
        dateOfBirth: children.dateOfBirth,
        createdAt: children.createdAt
      })
      .from(children)
      .where(eq(children.schoolId, schoolIdNum))
      .orderBy(children.firstName, children.lastName);

    return NextResponse.json({
      children: childrenWithFees,
      totalChildren: childrenWithFees.length,
      totalMonthlyRevenue: childrenWithFees.reduce((sum, child) => sum + child.monthlyFee, 0)
    });

  } catch (error) {
    console.error('Children fees API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children fees' },
      { status: 500 }
    );
  }
}