import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { db } from '@/lib/db';
import { children, parentChildRelationships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logAdminAction } from '@/lib/services/access-logging';

interface RouteContext {
  params: Promise<{ id: string; relationshipId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: childId, relationshipId } = await context.params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    const schoolIdRaw = session.user.schoolId || session.user.teamId;
    if (!schoolIdRaw) {
      return NextResponse.json({ error: 'School association required' }, { status: 403 });
    }

    const schoolId = typeof schoolIdRaw === 'string' ? parseInt(schoolIdRaw) : schoolIdRaw;

    // Verify child exists and belongs to school
    const [child] = await db
      .select()
      .from(children)
      .where(and(eq(children.id, childId), eq(children.schoolId, schoolId)))
      .limit(1);

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Verify relationship exists
    const [relationship] = await db
      .select()
      .from(parentChildRelationships)
      .where(
        and(
          eq(parentChildRelationships.id, relationshipId),
          eq(parentChildRelationships.childId, childId),
          eq(parentChildRelationships.schoolId, schoolId)
        )
      )
      .limit(1);

    if (!relationship) {
      return NextResponse.json({ error: 'Parent relationship not found' }, { status: 404 });
    }

    // Delete in transaction
    await db.transaction(async (tx) => {
      // Delete the relationship
      await tx
        .delete(parentChildRelationships)
        .where(eq(parentChildRelationships.id, relationshipId));

      // Log the action
      await logAdminAction(
        {
          schoolId,
          adminUserId: parseInt(session.user.id),
          actionType: 'PARENT_UNLINKED',
          targetType: 'CHILD',
          targetId: childId,
          details: {
            parent_id: relationship.parentId,
            relationship_id: relationshipId,
            relationship_type: relationship.relationshipType,
          },
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
        tx
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing parent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
