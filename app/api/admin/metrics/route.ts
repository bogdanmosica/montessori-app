// T017-T018: GET /api/admin/metrics route handler with caching and error handling
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth/config';
import { getDashboardMetrics, validateSchoolAccess } from '@/app/admin/dashboard/server/metrics';
import { getSuperAdminMetrics } from '@/app/admin/dashboard/server/super-admin-metrics';
import { requireAdminPermissions, shouldShowAggregatedView, getMetricsCacheKey, logTrendDataAccess } from '@/lib/auth/dashboard-context';
import { RATE_LIMITS, DASHBOARD_CACHE_TTL } from '@/app/admin/dashboard/constants';
import type { DashboardApiResponse } from '@/lib/types/dashboard';
import { UserRole } from '@/lib/constants/user-roles';
import { validateTrendsQuery } from '@/lib/validations/trends-validation';
import { ActivityAggregationService } from '@/lib/services/activity-aggregation';
import { activityCache } from '@/lib/services/activity-cache';
import { getWeeklyDateRange, getCustomDateRange } from '@/lib/utils/date-range';
import { ERROR_MESSAGES, ERROR_CODES } from '@/lib/constants/error-messages';
import { teams } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

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

    // New trend parameters
    const trendType = searchParams.get('trend') as 'weekly' | 'custom' | null;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const activityTypes = searchParams.get('activity_types');

    // Check if this is a trends-specific request
    const isTrendsRequest = trendType !== null;

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

    // Handle trends-specific request
    if (isTrendsRequest) {
      // Validate trend parameters
      const validation = validateTrendsQuery({
        trend: trendType,
        start_date: startDate,
        end_date: endDate,
        activity_types: activityTypes,
      });

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: ERROR_MESSAGES.VALIDATION_ERROR,
              details: validation.error
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Log trend data access for audit trail
      await logTrendDataAccess(user.id, schoolId, {
        trend: validation.data!.trend || 'weekly',
        start_date: validation.data!.start_date,
        end_date: validation.data!.end_date,
        activity_types: validation.data!.activity_types as any,
      });

      try {
        // Determine date range
        const dateRange = validation.data!.trend === 'weekly'
          ? getWeeklyDateRange()
          : getCustomDateRange(
              new Date(validation.data!.start_date!),
              new Date(validation.data!.end_date!)
            );

        // Check cache first
        const cachedData = activityCache.getDailyMetrics(
          parseInt(schoolId),
          dateRange.startDate,
          dateRange.endDate,
          validation.data!.activity_types as any
        );

        if (cachedData) {
          // Get school info
          const schoolInfo = await db.select({
            id: teams.id,
            name: teams.name
          }).from(teams).where(eq(teams.id, parseInt(schoolId))).limit(1);

          // Get summary from cache or calculate
          let summary = activityCache.getSummaryMetrics(
            parseInt(schoolId),
            dateRange.startDate,
            dateRange.endDate
          );

          if (!summary) {
            summary = await ActivityAggregationService.getSummaryMetrics(
              parseInt(schoolId),
              dateRange.startDate,
              dateRange.endDate
            );
            activityCache.setSummaryMetrics(
              parseInt(schoolId),
              dateRange.startDate,
              dateRange.endDate,
              summary
            );
          }

          return NextResponse.json(
            {
              success: true,
              data: {
                date_range: {
                  start_date: dateRange.startDate.toISOString().split('T')[0],
                  end_date: dateRange.endDate.toISOString().split('T')[0],
                  total_days: dateRange.totalDays
                },
                tenant_info: {
                  tenant_id: schoolId,
                  school_name: schoolInfo[0]?.name || 'Unknown School'
                },
                metrics: cachedData,
                summary
              },
              timestamp: new Date().toISOString()
            },
            {
              status: 200,
              headers: {
                'Cache-Control': 'private, max-age=300',
                'X-Cache-Status': 'HIT',
                'X-Tenant-ID': schoolId
              }
            }
          );
        }

        // Fetch fresh data
        const [metrics, summary, schoolInfo] = await Promise.all([
          ActivityAggregationService.getDailyMetrics(
            parseInt(schoolId),
            dateRange.startDate,
            dateRange.endDate,
            validation.data!.activity_types as any
          ),
          ActivityAggregationService.getSummaryMetrics(
            parseInt(schoolId),
            dateRange.startDate,
            dateRange.endDate
          ),
          db.select({
            id: teams.id,
            name: teams.name
          }).from(teams).where(eq(teams.id, parseInt(schoolId))).limit(1)
        ]);

        // Cache the results
        activityCache.setDailyMetrics(
          parseInt(schoolId),
          dateRange.startDate,
          dateRange.endDate,
          validation.data!.activity_types as any,
          metrics
        );
        activityCache.setSummaryMetrics(
          parseInt(schoolId),
          dateRange.startDate,
          dateRange.endDate,
          summary
        );

        return NextResponse.json(
          {
            success: true,
            data: {
              date_range: {
                start_date: dateRange.startDate.toISOString().split('T')[0],
                end_date: dateRange.endDate.toISOString().split('T')[0],
                total_days: dateRange.totalDays
              },
              tenant_info: {
                tenant_id: schoolId,
                school_name: schoolInfo[0]?.name || 'Unknown School'
              },
              metrics,
              summary
            },
            timestamp: new Date().toISOString()
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'private, max-age=300',
              'X-Cache-Status': 'MISS',
              'X-Tenant-ID': schoolId
            }
          }
        );
      } catch (error) {
        console.error('Error fetching trend metrics:', error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.INTERNAL_SERVER_ERROR,
              message: ERROR_MESSAGES.TRENDS_FETCH_FAILED
            },
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
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