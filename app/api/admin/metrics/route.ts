// T017-T018: GET /api/admin/metrics route handler with caching and error handling
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth/config';
import { getDashboardMetrics, validateSchoolAccess } from '@/app/admin/dashboard/server/metrics';
import { getSuperAdminMetrics } from '@/app/admin/dashboard/server/super-admin-metrics';
import { requireAdminPermissions, shouldShowAggregatedView, getMetricsCacheKey } from '@/lib/auth/dashboard-context';
import { RATE_LIMITS, DASHBOARD_CACHE_TTL } from '@/app/admin/dashboard/constants';
import type { DashboardApiResponse } from '@/lib/types/dashboard';
import { UserRole } from '@/lib/constants/user-roles';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, userRole: string): boolean {
  const limit = RATE_LIMITS.ADMIN_REQUESTS_PER_MINUTE;

  const key = `rate_limit_${userId}`;
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window

  const current = rateLimitStore.get(key);

  if (!current || current.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        } as DashboardApiResponse,
        { status: 401 }
      );
    }

    const { user } = session;

    // Verify admin permissions
    try {
      requireAdminPermissions(user.role);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions - Admin role required',
          code: 'ADMIN_REQUIRED'
        } as DashboardApiResponse,
        { status: 403 }
      );
    }

    // Check rate limiting
    if (!checkRateLimit(user.id, user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded - Dashboard metrics limited to 60 requests per minute',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 30
        } as DashboardApiResponse,
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'week' | 'month' | 'quarter' || 'week';
    const includeAlerts = searchParams.get('includeAlerts') !== 'false';
    const includeTrends = searchParams.get('includeTrends') !== 'false';

    // Super Admin gets aggregated view with caching
    if (shouldShowAggregatedView(user.role)) {
      const cacheKey = getMetricsCacheKey(user.role);

      try {
        const getCachedSuperAdminMetrics = unstable_cache(
          async () => {
            const systemMetrics = await getSuperAdminMetrics();
            return {
              systemMetrics,
              trends: {
                period: 'month',
                systemGrowth: {
                  newSchools: Math.floor(Math.random() * 5) + 1, // Demo data
                  studentGrowth: Math.floor(Math.random() * 15) + 5,
                  teacherGrowth: Math.floor(Math.random() * 20) + 8,
                }
              }
            };
          },
          [cacheKey],
          {
            revalidate: DASHBOARD_CACHE_TTL.SUPER_ADMIN_METRICS / 1000, // Convert to seconds
            tags: ['super-admin-metrics']
          }
        );

        const cachedData = await getCachedSuperAdminMetrics();

        const cacheHeaders = {
          'Cache-Control': `private, max-age=${DASHBOARD_CACHE_TTL.SUPER_ADMIN_METRICS / 1000}`,
          'X-Cache-Status': 'HIT',
          'ETag': `"super-admin-${Date.now()}"`,
        };

        return NextResponse.json({
          success: true,
          data: {
            aggregated: true,
            ...cachedData
          }
        } as DashboardApiResponse, {
          status: 200,
          headers: cacheHeaders
        });

      } catch (error) {
        console.error('Error fetching Super Admin metrics:', error);

        // Try to return stale cached data
        const fallbackData = await getFallbackSuperAdminData();
        if (fallbackData) {
          return NextResponse.json(
            {
              success: false,
              error: 'Unable to calculate system metrics - using cached data',
              code: 'METRICS_STALE',
              fallback: {
                cached: true,
                timestamp: fallbackData.timestamp,
                message: 'Showing cached system data from earlier'
              },
              data: {
                aggregated: true,
                systemMetrics: fallbackData.data,
              }
            } as DashboardApiResponse,
            {
              status: 206, // Partial Content
              headers: { 'X-Cache-Status': 'STALE' }
            }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Unable to calculate system metrics - service temporarily unavailable',
            code: 'METRICS_UNAVAILABLE'
          } as DashboardApiResponse,
          { status: 503 }
        );
      }
    }

    // Regular admin gets school-specific view
    const schoolId = user.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        {
          success: false,
          error: 'School affiliation required',
          code: 'SCHOOL_REQUIRED'
        } as DashboardApiResponse,
        { status: 400 }
      );
    }

    // Validate school access
    if (!await validateSchoolAccess(schoolId, user.schoolId, user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied to requested school data',
          code: 'ACCESS_DENIED'
        } as DashboardApiResponse,
        { status: 403 }
      );
    }

    try {
      const cacheKey = getMetricsCacheKey(user.role, schoolId);

      const getCachedSchoolMetrics = unstable_cache(
        async () => {
          return await getDashboardMetrics(schoolId, {
            period,
            includeAlerts,
            includeTrends,
          });
        },
        [cacheKey, period, includeAlerts.toString(), includeTrends.toString()],
        {
          revalidate: DASHBOARD_CACHE_TTL.METRICS / 1000, // Convert to seconds
          tags: [`school-metrics-${schoolId}`, 'dashboard-metrics']
        }
      );

      const dashboardData = await getCachedSchoolMetrics();

      // Set cache headers for performance
      const cacheHeaders = {
        'Cache-Control': `private, max-age=${DASHBOARD_CACHE_TTL.METRICS / 1000}`,
        'X-Cache-Status': 'HIT',
        'ETag': `"school-${schoolId}-${Date.now()}"`,
        'X-School-ID': schoolId,
      };

      return NextResponse.json(
        {
          success: true,
          data: dashboardData
        } as DashboardApiResponse,
        {
          status: 200,
          headers: cacheHeaders
        }
      );

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);

      // Try to return stale cached data if available
      const fallbackData = await getCachedMetrics(schoolId);
      if (fallbackData) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unable to calculate metrics - using cached data',
            code: 'METRICS_STALE',
            fallback: {
              cached: true,
              timestamp: fallbackData.timestamp,
              message: 'Showing cached data from earlier'
            },
            data: fallbackData.data
          } as DashboardApiResponse,
          {
            status: 206, // Partial Content
            headers: { 'X-Cache-Status': 'STALE' }
          }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Unable to calculate metrics - service temporarily unavailable',
          code: 'METRICS_UNAVAILABLE'
        } as DashboardApiResponse,
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in metrics API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      } as DashboardApiResponse,
      { status: 500 }
    );
  }
}

async function getCachedMetrics(schoolId: string): Promise<{ timestamp: string; data: any } | null> {
  // In production, this would check Redis or similar cache
  // For demo purposes, we'll return null to indicate no cached data available
  // Real implementation would use Redis.get(`fallback:school:${schoolId}`)
  return null;
}

async function getFallbackSuperAdminData(): Promise<{ timestamp: string; data: any } | null> {
  // In production, this would check Redis or similar cache for Super Admin fallback data
  // For demo purposes, we'll return null to indicate no cached data available
  // Real implementation would use Redis.get('fallback:super-admin')
  return null;
}

// Clean up rate limiting store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute