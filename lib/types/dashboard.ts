// Dashboard TypeScript types
export interface DashboardMetrics {
  schoolId: string;
  timestamp: Date;
  pendingApplications: number;
  activeEnrollments: number;
  totalCapacity: number;
  capacityUtilization: number; // percentage
  teacherActivity: TeacherActivitySnapshot;
  subscriptionStatus: SubscriptionStatus;
  securityAlerts: SecurityAlert[];
  cashflowMetrics: CashflowMetrics;
  capacityByAgeGroup: AgeGroupCapacity[];
}

export interface CashflowMetrics {
  currentMonthRevenue: number;
  projectedMonthlyRevenue: number;
  baseFeePerChild: number;
  totalFamilies: number;
  totalChildren: number;
  averageRevenuePerFamily: number;
  discountsSavings: number;
  revenueBreakdown: RevenueBreakdown;
}

export interface RevenueBreakdown {
  singleChildFamilies: {
    count: number;
    revenue: number;
  };
  multiChildFamilies: {
    count: number;
    revenue: number;
    totalSavingsFromDiscounts: number;
  };
  pendingPayments: number;
  overduePayments: number;
}

export interface Family {
  id: string; // Primary key for relationships
  schoolId: string; // Tenant scoping
  primaryContactId: string; // References parent/guardian user
  children: Child[];
  discountRate: number; // Configurable sibling discount percentage
  totalMonthlyFee: number; // Calculated based on children and discounts
  paymentStatus: PaymentStatus;
}

export interface Child {
  id: string; // Primary key
  familyId: string; // Foreign key to family
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  enrollmentStatus: EnrollmentStatus;
  monthlyFee: number; // Base fee before family discounts
}

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  PENDING = 'pending',
  WAITLISTED = 'waitlisted',
  WITHDRAWN = 'withdrawn',
}

export enum PaymentStatus {
  CURRENT = 'current',
  PENDING = 'pending',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
}

export interface AgeGroupCapacity {
  ageGroup: string; // e.g., "Toddler", "Primary", "Elementary"
  minAge: number; // months
  maxAge: number; // months
  capacity: number;
  currentEnrollment: number;
  availableSpots: number;
}

export interface TeacherActivitySnapshot {
  activeTeachers: number;
  totalTeachers: number;
  lastWeekLogins: number;
  avgSessionDuration: number; // minutes
  classroomUpdates: number; // last 7 days
}

export enum SubscriptionTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionState {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIAL = 'trial',
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  state: SubscriptionState;
  nextBillingDate: Date;
  studentsUsed: number;
  studentsLimit: number;
  daysUntilExpiry?: number;
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertType {
  FAILED_LOGINS = 'failed_logins',
  SUSPICIOUS_IP = 'suspicious_ip',
  EXPIRED_SESSIONS = 'expired_sessions',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  UNUSUAL_ACTIVITY = 'unusual_activity',
}

export interface SecurityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata: Record<string, any>;
}

export interface TrendDataPoint {
  date: Date;
  applications: number;
  enrollments: number;
  teacherEngagement: number;
  revenue: number;
  capacityUtilization: number;
}

export interface TrendData {
  period: 'week' | 'month' | 'quarter';
  dataPoints: TrendDataPoint[];
  trends: {
    applicationsChange: number; // percentage
    enrollmentsChange: number; // percentage
    engagementChange: number; // percentage
    revenueChange: number; // percentage
    capacityChange: number; // percentage
  };
}

export interface AggregatedMetrics {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalCapacity: number;
  systemCapacityUtilization: number;
  totalMonthlyRevenue: number;
  averageRevenuePerSchool: number;
  systemHealth: {
    uptime: number; // percentage
    avgResponseTime: number; // ms
    errorRate: number; // percentage
  };
  subscriptionBreakdown: Record<SubscriptionTier, number>;
  securitySummary: Record<AlertSeverity, number>;
}

export interface DashboardApiResponse {
  success: boolean;
  data: {
    school?: {
      id: string;
      name: string;
      lastUpdated: string;
    };
    aggregated?: boolean;
    metrics?: DashboardMetrics;
    systemMetrics?: AggregatedMetrics;
    securityAlerts?: SecurityAlert[];
    trends?: TrendData;
  };
  error?: string;
  code?: string;
  retryAfter?: number;
  fallback?: {
    cached: boolean;
    timestamp: string;
    message: string;
  };
}

export interface DashboardContextValue {
  isSuper: boolean;
  schoolId?: string;
  refreshMetrics: () => Promise<void>;
  lastUpdated?: Date;
}

// Extended types for comprehensive activity tracking

export interface DailyActivityMetric {
  date: string; // ISO date (YYYY-MM-DD)
  applications: ActivityBreakdown<ApplicationStatusBreakdown>;
  enrollments: ActivityBreakdown<EnrollmentStatusBreakdown>;
  payments: PaymentActivityBreakdown;
  staff_activities: ActivityBreakdown<StaffActivityBreakdown>;
  events: ActivityBreakdown<EventTypeBreakdown>;
}

export interface ActivityBreakdown<T> {
  count: number;
  breakdown: T;
}

export interface ApplicationStatusBreakdown {
  pending: number;
  approved: number;
  rejected: number;
}

export interface EnrollmentStatusBreakdown {
  active: number;
  inactive: number;
  waitlisted: number;
}

export interface PaymentActivityBreakdown {
  count: number;
  total_amount: number;
  breakdown: {
    tuition: number;
    registration: number;
    materials: number;
    other: number;
  };
}

export interface StaffActivityBreakdown {
  hire: number;
  promotion: number;
  training: number;
  evaluation: number;
  departure: number;
}

export interface EventTypeBreakdown {
  meeting: number;
  ceremony: number;
  training: number;
  social: number;
  academic: number;
}

export interface TrendsApiResponse {
  success: boolean;
  data: {
    date_range: {
      start_date: string;
      end_date: string;
      total_days: number;
    };
    tenant_info: {
      tenant_id: string;
      school_name: string;
    };
    metrics: DailyActivityMetric[];
    summary: {
      total_applications: number;
      total_enrollments: number;
      total_payments: number;
      total_payment_amount: number;
      total_staff_activities: number;
      total_events: number;
    };
  };
  timestamp: string;
}

export interface TrendsErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      issue: string;
    }>;
  };
  timestamp: string;
}