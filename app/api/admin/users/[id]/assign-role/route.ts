import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, accessLogs } from '@/lib/db/schema';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { UserRole, isValidUserRole } from '@/lib/constants/user-roles';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST(
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
        { success: false, error: 'Insufficient permissions - Admin role required', code: 'ADMIN_REQUIRED' },
        { status: 403 }
      );
    }

    // Parse request body
    const { userId, newRole, reason } = await request.json();

    // Validate role
    if (!isValidUserRole(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role assignment', code: 'INVALID_ROLE_ASSIGNMENT' },
        { status: 400 }
      );
    }

    // Validate userId matches params
    const targetUserId = parseInt(params.id);
    if (isNaN(targetUserId) || (userId && parseInt(userId) !== targetUserId)) {
      return NextResponse.json(
        { success: false, error: 'User ID mismatch', code: 'USER_ID_MISMATCH' },
        { status: 400 }
      );
    }

    // Prevent self-demotion (admin cannot demote themselves)
    if (currentUser.id === targetUserId && newRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Cannot demote yourself from admin role', code: 'SELF_DEMOTION_FORBIDDEN' },
        { status: 400 }
      );
    }

    // Find target user
    const targetUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Target user not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = targetUser[0];
    const previousRole = user.role;

    // Get current admin's team for multi-tenant validation
    const adminWithTeam = await getUserWithTeam(currentUser.id);
    const targetUserWithTeam = await getUserWithTeam(targetUserId);

    // Ensure both users are in the same team (multi-tenant isolation)
    if (adminWithTeam?.teamId !== targetUserWithTeam?.teamId) {
      return NextResponse.json(
        { success: false, error: 'Cannot assign role to user outside organization', code: 'INVALID_ROLE_ASSIGNMENT' },
        { status: 400 }
      );
    }

    // Update user role and increment session version
    const updatedUser = await db
      .update(users)
      .set({
        role: newRole as UserRole,
        sessionVersion: (user.sessionVersion || 1) + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to assign role', code: 'ASSIGNMENT_FAILED' },
        { status: 500 }
      );
    }

    const updated = updatedUser[0];

    // Log the role assignment action
    if (adminWithTeam?.teamId) {
      await db.insert(accessLogs).values({
        userId: currentUser.id,
        teamId: adminWithTeam.teamId,
        route: `/api/admin/users/${targetUserId}/assign-role`,
        success: true,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
      });
    }

    // Revalidate relevant paths
    revalidatePath('/admin/users');
    revalidatePath('/api/users/me');

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id.toString(),
        email: updated.email,
        name: updated.name,
        previousRole,
        newRole: updated.role,
        sessionVersion: updated.sessionVersion,
        assignedBy: currentUser.id.toString(),
        timestamp: new Date().toISOString(),
        reason,
      },
    });

  } catch (error) {
    console.error('Error assigning user role:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}