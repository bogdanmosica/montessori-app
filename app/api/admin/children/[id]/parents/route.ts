import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { UserRole } from '@/lib/constants/user-roles';
import { db } from '@/lib/db';
import { children, parentChildRelationships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { findOrCreateParentProfile } from '@/lib/services/parent-profile-matching';
import { logAdminAction } from '@/lib/services/access-logging';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: childId } = await context.params;
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

    // Parse request body
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      relationshipType,
      primaryContact,
      pickupAuthorized,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !relationshipType) {
      return NextResponse.json(
        { error: 'First name, last name, email, and relationship type are required' },
        { status: 400 }
      );
    }

    // Check how many parents already exist
    const existingParents = await db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.childId, childId));

    if (existingParents.length >= 2) {
      return NextResponse.json(
        { error: 'Maximum of 2 parents per child' },
        { status: 400 }
      );
    }

    // Create in transaction
    const result = await db.transaction(async (tx) => {
      // Find or create parent profile
      const parentProfile = await findOrCreateParentProfile(
        {
          schoolId,
          firstName,
          lastName,
          email,
          phone: phone || null,
        },
        tx
      );

      // Create parent-child relationship
      const [relationship] = await tx
        .insert(parentChildRelationships)
        .values({
          schoolId,
          parentId: parentProfile.id,
          childId,
          relationshipType,
          primaryContact: primaryContact || false,
          pickupAuthorized: pickupAuthorized !== false,
        })
        .returning();

      // Log the action
      await logAdminAction(
        {
          schoolId,
          adminUserId: parseInt(session.user.id),
          actionType: 'PARENT_LINKED',
          targetType: 'CHILD',
          targetId: childId,
          details: {
            parent_id: parentProfile.id,
            relationship_id: relationship.id,
            relationship_type: relationshipType,
          },
          ipAddress:
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
        tx
      );

      return { parentProfile, relationship };
    });

    return NextResponse.json({
      success: true,
      parent: {
        id: result.parentProfile.id,
        firstName: result.parentProfile.firstName,
        lastName: result.parentProfile.lastName,
        email: result.parentProfile.email,
      },
      relationship: {
        id: result.relationship.id,
        relationshipType: result.relationship.relationshipType,
        primaryContact: result.relationship.primaryContact,
      },
    });
  } catch (error) {
    console.error('Error adding parent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
