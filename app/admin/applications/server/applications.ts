import { auth } from '../../../../lib/auth';
import {
  getApplicationsList,
  getApplicationById,
  getApplicationsStats,
  getRecentApplications,
  buildPagination,
  buildFilters
} from '../../../../lib/db/queries/applications';
import {
  ApplicationWithRelations,
  ApplicationFilters,
  ApplicationListResponse
} from '../../../../lib/db/schema/applications';
import { DEFAULT_VALUES, ERROR_MESSAGES } from '../constants';

/**
 * Server-side function to get applications list for admin dashboard
 * Used by the applications page for server-side rendering
 */
export async function getApplicationsForPage(
  searchParams: URLSearchParams
): Promise<{
  success: boolean;
  data?: ApplicationListResponse;
  error?: string;
}> {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      };
    }

    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      };
    }

    // Get school ID for multi-tenant scoping
    const schoolId = session.user.schoolId;
    if (!schoolId) {
      return {
        success: false,
        error: 'User is not associated with a school',
      };
    }

    // Build pagination and filters
    const pagination = buildPagination(
      searchParams.get('page'),
      searchParams.get('limit')
    );

    const filters = buildFilters(searchParams);

    // Get applications from database
    const result = await getApplicationsList(parseInt(schoolId), filters, pagination);

    return {
      success: true,
      data: result,
    };

  } catch (error) {
    console.error('Error fetching applications for page:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * Server-side function to get a single application by ID
 * Used for application detail views and processing workflows
 */
export async function getApplicationForProcessing(
  applicationId: string
): Promise<{
  success: boolean;
  data?: ApplicationWithRelations;
  error?: string;
}> {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      };
    }

    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      };
    }

    // Get school ID for multi-tenant scoping
    const schoolId = session.user.schoolId;
    if (!schoolId) {
      return {
        success: false,
        error: 'User is not associated with a school',
      };
    }

    // Get application from database
    const application = await getApplicationById(applicationId, parseInt(schoolId));

    if (!application) {
      return {
        success: false,
        error: ERROR_MESSAGES.APPLICATION_NOT_FOUND,
      };
    }

    return {
      success: true,
      data: application,
    };

  } catch (error) {
    console.error('Error fetching application for processing:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * Server-side function to get applications statistics
 * Used for dashboard summary cards and metrics
 */
export async function getApplicationsStatsForDashboard(): Promise<{
  success: boolean;
  data?: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  error?: string;
}> {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      };
    }

    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      };
    }

    // Get school ID for multi-tenant scoping
    const schoolId = session.user.schoolId;
    if (!schoolId) {
      return {
        success: false,
        error: 'User is not associated with a school',
      };
    }

    // Get stats from database
    const stats = await getApplicationsStats(parseInt(schoolId));

    return {
      success: true,
      data: stats,
    };

  } catch (error) {
    console.error('Error fetching applications stats:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * Server-side function to get recent applications
 * Used for activity feeds and recent activity widgets
 */
export async function getRecentApplicationsForDashboard(
  limit: number = 5
): Promise<{
  success: boolean;
  data?: ApplicationWithRelations[];
  error?: string;
}> {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      };
    }

    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      };
    }

    // Get school ID for multi-tenant scoping
    const schoolId = session.user.schoolId;
    if (!schoolId) {
      return {
        success: false,
        error: 'User is not associated with a school',
      };
    }

    // Get recent applications from database
    const applications = await getRecentApplications(parseInt(schoolId), limit);

    return {
      success: true,
      data: applications,
    };

  } catch (error) {
    console.error('Error fetching recent applications:', error);
    return {
      success: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * Server-side function to validate if user can access applications
 * Used as middleware-like function in pages and components
 */
export async function validateApplicationsAccess(): Promise<{
  valid: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user) {
      return {
        valid: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
      };
    }

    // Check admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return {
        valid: false,
        error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      };
    }

    // Check school association
    if (!session.user.schoolId) {
      return {
        valid: false,
        error: 'User is not associated with a school',
      };
    }

    return {
      valid: true,
      user: session.user,
    };

  } catch (error) {
    console.error('Error validating applications access:', error);
    return {
      valid: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * Helper function to get default search params for applications page
 * Used to set up initial state and URL parameters
 */
export function getDefaultApplicationsSearchParams(): URLSearchParams {
  const searchParams = new URLSearchParams();

  searchParams.set('page', DEFAULT_VALUES.PAGE.toString());
  searchParams.set('limit', '10');
  searchParams.set('sortBy', DEFAULT_VALUES.SORT_BY);
  searchParams.set('sortOrder', DEFAULT_VALUES.SORT_ORDER);

  return searchParams;
}

/**
 * Helper function to build applications page URL with search params
 * Used for navigation and URL management
 */
export function buildApplicationsPageUrl(
  filters: Partial<ApplicationFilters> = {},
  page: number = 1
): string {
  const searchParams = new URLSearchParams();

  // Add pagination
  searchParams.set('page', page.toString());
  searchParams.set('limit', '10');

  // Add filters
  if (filters.status) {
    searchParams.set('status', filters.status);
  }

  if (filters.search) {
    searchParams.set('search', filters.search);
  }

  if (filters.programRequested) {
    searchParams.set('programRequested', filters.programRequested);
  }

  if (filters.sortBy) {
    searchParams.set('sortBy', filters.sortBy);
  }

  if (filters.sortOrder) {
    searchParams.set('sortOrder', filters.sortOrder);
  }

  return `/admin/applications?${searchParams.toString()}`;
}

/**
 * Helper function to format application data for display
 * Used in components to ensure consistent formatting
 */
export function formatApplicationForDisplay(
  application: ApplicationWithRelations
): ApplicationWithRelations & {
  displayName: string;
  formattedDate: string;
  statusBadgeColor: string;
} {
  return {
    ...application,
    displayName: `${application.parentName} (${application.childName})`,
    formattedDate: new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(application.createdAt),
    statusBadgeColor: getStatusBadgeColor(application.status),
  };
}

/**
 * Helper function to get status badge color
 */
function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'yellow';
    case 'approved':
      return 'green';
    case 'rejected':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Helper function to check if current user can process applications
 * Used to show/hide action buttons and forms
 */
export async function canUserProcessApplications(): Promise<boolean> {
  const validation = await validateApplicationsAccess();
  return validation.valid;
}

/**
 * Helper function to get application processing permissions
 * Returns specific permissions for different actions
 */
export async function getApplicationProcessingPermissions(): Promise<{
  canView: boolean;
  canApprove: boolean;
  canReject: boolean;
  canEdit: boolean;
}> {
  const validation = await validateApplicationsAccess();

  if (!validation.valid) {
    return {
      canView: false,
      canApprove: false,
      canReject: false,
      canEdit: false,
    };
  }

  // For now, all admins have full permissions
  // This could be extended for role-based permissions
  return {
    canView: true,
    canApprove: true,
    canReject: true,
    canEdit: true,
  };
}
