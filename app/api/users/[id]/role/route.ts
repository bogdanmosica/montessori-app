import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { UserRole, isValidUserRole } from '@/lib/constants/user-roles';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // Verify admin authentication
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    if (currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions', code: 'ADMIN_REQUIRED' },
        { status: 403 }
      );
    }

    // Parse request body
    const { role } = await request.json();

    // Validate role
    if (!isValidUserRole(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role value', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Find target user
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const targetUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = targetUser[0];

    // Update user role and increment session version
    const updatedUser = await db
      .update(users)
      .set({
        role: role as UserRole,
        sessionVersion: (user.sessionVersion || 1) + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user role', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const updated = updatedUser[0];

    // Revalidate relevant paths
    revalidatePath('/admin/users');
    revalidatePath('/api/users/me');

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id.toString(),
        email: updated.email,
        name: updated.name,
        role: updated.role,
        sessionVersion: updated.sessionVersion,
      },
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}