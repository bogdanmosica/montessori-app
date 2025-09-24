# Data Model: Admin Dashboard

## Dashboard Metrics Entity

```typescript
interface DashboardMetrics {
  schoolId: string
  timestamp: Date
  pendingApplications: number
  activeEnrollments: number
  totalCapacity: number
  capacityUtilization: number // percentage
  teacherActivity: TeacherActivitySnapshot
  subscriptionStatus: SubscriptionStatus
  securityAlerts: SecurityAlert[]
  cashflowMetrics: CashflowMetrics
}
```

**Attributes**:
- `schoolId`: Unique identifier for tenant scoping (multi-tenant isolation)
- `timestamp`: When metrics were calculated for cache invalidation
- `pendingApplications`: Count of applications awaiting review
- `activeEnrollments`: Current enrolled student count
- `totalCapacity`: Maximum student capacity for the school
- `capacityUtilization`: Percentage of capacity currently used
- `teacherActivity`: Aggregated teacher engagement metrics
- `subscriptionStatus`: Current subscription state and billing info
- `securityAlerts`: Array of active security notifications
- `cashflowMetrics`: Revenue calculations based on enrollment and fees

**Validation Rules**:
- `schoolId` must reference existing school/team entity
- `timestamp` must be recent (within last hour for cache validity)
- Numeric counts must be non-negative integers
- `capacityUtilization` calculated as `(activeEnrollments / totalCapacity) * 100`
- Arrays must handle empty states gracefully

## Cashflow Metrics

```typescript
interface CashflowMetrics {
  currentMonthRevenue: number
  projectedMonthlyRevenue: number
  baseFeePerChild: number
  totalFamilies: number
  totalChildren: number
  averageRevenuePerFamily: number
  discountsSavings: number
  revenueBreakdown: RevenueBreakdown
}

interface RevenueBreakdown {
  singleChildFamilies: {
    count: number
    revenue: number
  }
  multiChildFamilies: {
    count: number
    revenue: number
    totalSavingsFromDiscounts: number
  }
  pendingPayments: number
  overduePayments: number
}
```

**Cashflow Calculations**:
- `projectedMonthlyRevenue`: Based on enrolled children with sibling discounts applied
- `averageRevenuePerFamily`: Total revenue divided by number of families
- `discountsSavings`: Total amount saved by families through sibling discounts
- Revenue considers family relationships and applicable discounts

## Family & Child Relationships

```typescript
interface Family {
  id: string // Primary key for relationships
  schoolId: string // Tenant scoping
  primaryContactId: string // References parent/guardian user
  children: Child[]
  discountRate: number // Configurable sibling discount percentage
  totalMonthlyFee: number // Calculated based on children and discounts
  paymentStatus: PaymentStatus
}

interface Child {
  id: string // Primary key
  familyId: string // Foreign key to family
  firstName: string
  lastName: string
  dateOfBirth: Date
  enrollmentStatus: EnrollmentStatus
  monthlyFee: number // Base fee before family discounts
}

enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  PENDING = 'pending',
  WAITLISTED = 'waitlisted',
  WITHDRAWN = 'withdrawn'
}

enum PaymentStatus {
  CURRENT = 'current',
  PENDING = 'pending',
  OVERDUE = 'overdue',
  PARTIAL = 'partial'
}
```

**Relationship Rules**:
- Children are linked to families via `familyId` foreign key
- Multiple children in same family qualify for sibling discounts
- Family discount rate is configurable per school
- Payment status tracks at family level (not individual child)

## Fee Structure & Discounts

```typescript
interface SchoolFeeStructure {
  schoolId: string
  baseFeePerChild: number // Monthly fee per child
  siblingDiscountRules: SiblingDiscountRule[]
  capacitySettings: CapacitySettings
  lastUpdated: Date
}

interface SiblingDiscountRule {
  childCount: number // Number of siblings (2, 3, 4+)
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  appliesTo: 'all_children' | 'additional_children' | 'youngest_children'
}

interface CapacitySettings {
  totalCapacity: number
  waitlistLimit: number
  ageGroupCapacities: AgeGroupCapacity[]
}

interface AgeGroupCapacity {
  ageGroup: string // e.g., "Toddler", "Primary", "Elementary"
  minAge: number // months
  maxAge: number // months
  capacity: number
  currentEnrollment: number
}
```

**Fee Calculation Examples**:
- Family with 1 child: `baseFeePerChild * 1`
- Family with 2 children (20% discount on 2nd): `baseFeePerChild + (baseFeePerChild * 0.8)`
- Family with 3 children (20% on 2nd, 30% on 3rd): `baseFeePerChild + (baseFeePerChild * 0.8) + (baseFeePerChild * 0.7)`

```typescript
interface TeacherActivitySnapshot {
  activeTeachers: number
  totalTeachers: number
  lastWeekLogins: number
  avgSessionDuration: number // minutes
  classroomUpdates: number // last 7 days
}
```

**Derived Metrics**:
- Activity rate: `activeTeachers / totalTeachers * 100`
- Engagement score: Calculated from logins and session duration
- Content creation rate: Based on classroom updates frequency

## Subscription Status

```typescript
enum SubscriptionTier {
  BASIC = 'basic',
  PREMIUM = 'premium', 
  ENTERPRISE = 'enterprise'
}

enum SubscriptionState {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIAL = 'trial'
}

interface SubscriptionStatus {
  tier: SubscriptionTier
  state: SubscriptionState
  nextBillingDate: Date
  studentsUsed: number
  studentsLimit: number
  daysUntilExpiry?: number
}
```

**Business Rules**:
- Trial subscriptions show days remaining
- Past due subscriptions highlight payment issues
- Usage tracking prevents tier limit violations
- Enterprise tier has unlimited students

## Security Alert

```typescript
enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum AlertType {
  FAILED_LOGINS = 'failed_logins',
  SUSPICIOUS_IP = 'suspicious_ip',
  EXPIRED_SESSIONS = 'expired_sessions',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  UNUSUAL_ACTIVITY = 'unusual_activity'
}

interface SecurityAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  timestamp: Date
  resolved: boolean
  metadata: Record<string, any>
}
```

**Alert Triggers**:
- `FAILED_LOGINS`: >3 failures in 10 minutes from same IP
- `SUSPICIOUS_IP`: Login from unusual geographic location
- `EXPIRED_SESSIONS`: Multiple session timeouts suggesting account compromise
- `DATA_BREACH_ATTEMPT`: Unusual database query patterns
- `UNUSUAL_ACTIVITY`: Activity outside normal hours or patterns

**Lifecycle**:
- Created automatically by security monitoring system
- Displayed prominently until marked resolved
- Archived after resolution for audit trail
- Escalated based on severity level

## Trend Data

```typescript
interface TrendDataPoint {
  date: Date
  applications: number
  enrollments: number
  teacherEngagement: number
}

interface TrendData {
  period: 'week' | 'month' | 'quarter'
  dataPoints: TrendDataPoint[]
  trends: {
    applicationsChange: number // percentage
    enrollmentsChange: number // percentage  
    engagementChange: number // percentage
  }
}
```

**Time Series Rules**:
- Weekly trends: 7 data points (daily)
- Monthly trends: 30 data points (daily) 
- Quarterly trends: 12 data points (weekly averages)
- Percentage changes calculated from period start to end

## Super Admin Aggregation

```typescript
interface AggregatedMetrics {
  totalSchools: number
  totalStudents: number
  totalTeachers: number
  systemHealth: {
    uptime: number // percentage
    avgResponseTime: number // ms
    errorRate: number // percentage
  }
  subscriptionBreakdown: Record<SubscriptionTier, number>
  securitySummary: Record<AlertSeverity, number>
}
```

**Privacy Rules**:
- No individual school identification without consent
- Aggregate numbers only for cross-school metrics  
- Geographic distribution shown by region, not specific location
- Anonymized security statistics

## Database Query Patterns

**Single School Dashboard with Cashflow**:
```sql
-- Main metrics with capacity and revenue
SELECT 
  COUNT(*) FILTER (WHERE a.status = 'pending') as pending_applications,
  COUNT(*) FILTER (WHERE c.enrollment_status = 'enrolled') as active_enrollments,
  s.total_capacity,
  (COUNT(*) FILTER (WHERE c.enrollment_status = 'enrolled')::float / s.total_capacity * 100) as capacity_utilization,
  s.base_fee_per_child,
  COUNT(DISTINCT f.id) as total_families,
  COUNT(*) FILTER (WHERE c.enrollment_status = 'enrolled') as total_children,
  SUM(f.total_monthly_fee) as current_monthly_revenue
FROM schools s
LEFT JOIN applications a ON a.school_id = s.id
LEFT JOIN families f ON f.school_id = s.id  
LEFT JOIN children c ON c.family_id = f.id
WHERE s.id = $school_id
  AND (a.created_at > NOW() - INTERVAL '30 days' OR a.created_at IS NULL)
GROUP BY s.id, s.total_capacity, s.base_fee_per_child;

-- Family revenue breakdown with sibling discounts
SELECT 
  f.id as family_id,
  COUNT(c.id) as children_count,
  f.total_monthly_fee,
  f.discount_rate,
  (COUNT(c.id) * s.base_fee_per_child - f.total_monthly_fee) as discount_savings
FROM families f
JOIN children c ON c.family_id = f.id AND c.enrollment_status = 'enrolled'
JOIN schools s ON s.id = f.school_id
WHERE f.school_id = $school_id
GROUP BY f.id, f.total_monthly_fee, f.discount_rate, s.base_fee_per_child;
```

**Capacity by Age Group**:
```sql
SELECT 
  ag.age_group,
  ag.capacity,
  COUNT(c.id) as current_enrollment,
  (ag.capacity - COUNT(c.id)) as available_spots
FROM age_group_capacities ag
LEFT JOIN children c ON c.school_id = ag.school_id
  AND c.enrollment_status = 'enrolled'
  AND EXTRACT(YEAR FROM age(c.date_of_birth)) * 12 + EXTRACT(MONTH FROM age(c.date_of_birth)) 
      BETWEEN ag.min_age AND ag.max_age
WHERE ag.school_id = $school_id
GROUP BY ag.age_group, ag.capacity
ORDER BY ag.min_age;
```

**Revenue Trends with Family Discounts**:
```sql
SELECT 
  DATE_TRUNC('month', payment_date) as month,
  SUM(amount) as total_revenue,
  COUNT(DISTINCT family_id) as paying_families,
  AVG(amount) as average_payment,
  SUM(CASE WHEN discount_applied > 0 THEN discount_applied ELSE 0 END) as total_discounts
FROM payments p
JOIN families f ON f.id = p.family_id
WHERE f.school_id = $school_id
  AND payment_date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month;
```

**Multi-Tenant Security**:
- All queries include `WHERE school_id = $current_user_school_id`
- Family and child relationships maintain referential integrity
- Revenue calculations respect configured fee structures per school
- Sibling discounts applied based on school-specific rules
- Row-level security policies enforce tenant isolation
- Audit logging for all financial metric access