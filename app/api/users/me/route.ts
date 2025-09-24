import { NextResponse } from 'next/server';
import { getUser, getUserWithTeam } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // Get user with team information for multi-tenant context
    const userWithTeam = await getUserWithTeam(user.id);

    const userData = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: userWithTeam?.teamId?.toString() || null,
      sessionVersion: user.sessionVersion || 1,
    };

    return NextResponse.json({
      success: true,
      data: userData,
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}