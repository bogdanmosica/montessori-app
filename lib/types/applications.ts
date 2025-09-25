// Import and re-export types from schema for consistency
import type {
  ApplicationNew,
  NewApplicationNew,
  ApplicationWithRelations,
  ApplicationFilters,
  ApplicationPagination,
  ApplicationListResponse,
  ApprovalRequest,
  RejectionRequest,
  ProcessApplicationRequest
} from '../db/schema/applications';

import type {
  Enrollment,
  NewEnrollment,
  EnrollmentWithRelations,
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  EnrollmentFilters,
  EnrollmentListResponse
} from '../db/schema/enrollments';

// Re-export the types
export type {
  ApplicationNew,
  NewApplicationNew,
  ApplicationWithRelations,
  ApplicationFilters,
  ApplicationPagination,
  ApplicationListResponse,
  ApprovalRequest,
  RejectionRequest,
  ProcessApplicationRequest,
  Enrollment,
  NewEnrollment,
  EnrollmentWithRelations,
  CreateEnrollmentRequest,
  UpdateEnrollmentRequest,
  EnrollmentFilters,
  EnrollmentListResponse
};

// Additional UI and component types
export interface ApplicationTableProps {
  initialData: ApplicationListResponse;
  searchParams: URLSearchParams;
}

export interface ApplicationsTableRow {
  id: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  childDateOfBirth: string;
  programRequested: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  formattedDate: string;
  statusBadgeColor: string;
  actions?: ApplicationTableActions;
}

export interface ApplicationTableActions {
  canApprove: boolean;
  canReject: boolean;
  canView: boolean;
  canEdit: boolean;
}

// Form types for application processing
export interface ApprovalFormData {
  parentData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    sendWelcomeEmail: boolean;
  };
  childData: {
    name: string;
    dateOfBirth: string;
    gender?: 'male' | 'female' | 'other';
    programId?: string;
    startDate?: string;
  };
  enrollmentData: {
    programId?: string;
    status: 'active';
    startDate?: string;
  };
  notes?: string;
}

export interface RejectionFormData {
  rejectionReason: string;
  notifyParent: boolean;
  notes?: string;
}

// API response types
export interface ApplicationsListApiResponse {
  success: boolean;
  data?: {
    applications: ApplicationWithRelations[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: ApplicationFilters;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export interface ProcessApplicationApiResponse {
  success: boolean;
  data?: {
    application: {
      id: string;
      status: string;
      approvedAt?: string;
      approvedBy?: number;
      rejectedAt?: string;
      rejectedBy?: number;
      rejectionReason?: string;
    };
    parentUser?: {
      id: number;
      name: string;
      email: string;
      role: string;
      isFromApplication: boolean;
      createdAt: string;
    };
    child?: {
      id: string;
      name: string;
      parentId: number;
      dateOfBirth: string;
      enrollmentStatus: string;
      createdAt: string;
    };
    enrollment?: {
      id: string;
      childId: string;
      parentId: number;
      programId?: string;
      status: string;
      startDate?: string;
      createdAt: string;
    };
    notifications: {
      welcomeEmailSent?: boolean;
      parentNotified: boolean;
      passwordResetRequired?: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message: string;
}

// Component state types
export interface ApplicationsPageState {
  applications: ApplicationWithRelations[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: ApplicationFilters;
  loading: boolean;
  error: string | null;
  selectedApplication: ApplicationWithRelations | null;
  showApprovalModal: boolean;
  showRejectionModal: boolean;
  processingApplication: boolean;
}

export interface ApplicationsTableState {
  sortBy: 'createdAt' | 'parentName' | 'childName';
  sortOrder: 'asc' | 'desc';
  selectedRows: string[];
  hoveredRow: string | null;
}

// Search and filter types
export interface ApplicationsSearchFilters {
  status?: 'pending' | 'approved' | 'rejected';
  search?: string;
  programRequested?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'parentName' | 'childName';
  sortOrder?: 'asc' | 'desc';
}

export interface ApplicationsTableFilters extends ApplicationsSearchFilters {
  sortBy: 'createdAt' | 'parentName' | 'childName';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

// Modal and dialog types
export interface ApprovalModalProps {
  application: ApplicationWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApprovalFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface RejectionModalProps {
  application: ApplicationWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RejectionFormData) => Promise<void>;
  isLoading?: boolean;
}

// Validation types
export interface ApplicationValidationErrors {
  parentData?: {
    name?: string;
    email?: string;
    password?: string;
  };
  childData?: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  enrollmentData?: {
    programId?: string;
    startDate?: string;
  };
  rejectionReason?: string;
}

// Statistics and dashboard types
export interface ApplicationsStatsData {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  recentCount: number;
  percentageChange?: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface ApplicationsChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
  }[];
}

// Permission and access control types
export interface ApplicationsPermissions {
  canView: boolean;
  canApprove: boolean;
  canReject: boolean;
  canEdit: boolean;
  canExport: boolean;
  canBulkProcess: boolean;
}

// Notification and email types
export interface ApplicationNotification {
  type: 'approval' | 'rejection' | 'welcome' | 'reminder';
  applicationId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  error?: string;
}

// Bulk operations types
export interface BulkApplicationAction {
  action: 'approve' | 'reject' | 'delete';
  applicationIds: string[];
  data?: ApprovalFormData | RejectionFormData;
}

export interface BulkActionResult {
  success: boolean;
  processed: number;
  errors: {
    applicationId: string;
    error: string;
  }[];
}

// Export and reporting types
export interface ApplicationsExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: ApplicationsSearchFilters;
  columns: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface ApplicationsReport {
  title: string;
  description: string;
  generatedAt: Date;
  filters: ApplicationsSearchFilters;
  data: ApplicationWithRelations[];
  summary: ApplicationsStatsData;
}

// Utility types for type safety
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type EnrollmentStatus = 'active' | 'inactive' | 'graduated' | 'transferred';
export type ChildGender = 'male' | 'female' | 'other';
export type SortDirection = 'asc' | 'desc';
export type SortField = 'createdAt' | 'parentName' | 'childName';

// Event handler types
export type ApplicationActionHandler = (applicationId: string) => void;
export type ApplicationApprovalHandler = (applicationId: string, data: ApprovalFormData) => Promise<void>;
export type ApplicationRejectionHandler = (applicationId: string, data: RejectionFormData) => Promise<void>;
export type ApplicationFilterHandler = (filters: ApplicationsSearchFilters) => void;
export type ApplicationSortHandler = (field: SortField, direction: SortDirection) => void;

// Hook return types
export interface UseApplicationsReturn {
  applications: ApplicationWithRelations[];
  pagination: ApplicationsPageState['pagination'];
  filters: ApplicationFilters;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateFilters: (filters: Partial<ApplicationsSearchFilters>) => void;
  processApplication: {
    approve: (applicationId: string, data: ApprovalFormData) => Promise<void>;
    reject: (applicationId: string, data: RejectionFormData) => Promise<void>;
    loading: boolean;
  };
}

export interface UseApplicationStatsReturn {
  stats: ApplicationsStatsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}