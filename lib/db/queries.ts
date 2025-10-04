import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { schoolMembers, schools, users } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(schools)
    .where(eq(schools.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(schools)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(schools.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: schoolMembers.schoolId
    })
    .from(users)
    .leftJoin(schoolMembers, eq(users.id, schoolMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

// Removed: getActivityLogs() - use adminAccessLogs instead for audit trail

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.schoolMembers.findFirst({
    where: eq(schoolMembers.userId, user.id),
    with: {
      school: {
        with: {
          schoolMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.school || null;
}
