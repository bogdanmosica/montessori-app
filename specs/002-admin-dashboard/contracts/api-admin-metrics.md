# API Contract: Admin Dashboard Metrics

## GET /api/admin/metrics

**Description**: Consolidated endpoint returning all dashboard metrics for authenticated admin users

**Authentication**: Required (Admin or Super Admin role)

**Query Parameters**:
- `period`: Optional. Values: `week` | `month` | `quarter` (default: `week`)
- `includeAlerts`: Optional. Boolean (default: `true`)
- `includeTrends`: Optional. Boolean (default: `true`)

**Request**: No body

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "school": {
      "id": "school-uuid",
      "name": "Montessori Academy",
      "lastUpdated": "2025-09-24T10:30:00Z"
    },
    "metrics": {
      "pendingApplications": 12,
      "activeEnrollments": 145,
      "totalCapacity": 200,
      "capacityUtilization": 72.5,
      "teacherActivity": {
        "activeTeachers": 8,
        "totalTeachers": 10,
        "lastWeekLogins": 42,
        "avgSessionDuration": 35,
        "classroomUpdates": 28
      },
      "cashflowMetrics": {
        "currentMonthRevenue": 87500.00,
        "projectedMonthlyRevenue": 90000.00,
        "baseFeePerChild": 650.00,
        "totalFamilies": 98,
        "totalChildren": 145,
        "averageRevenuePerFamily": 893.37,
        "discountsSavings": 6750.00,
        "revenueBreakdown": {
          "singleChildFamilies": {
            "count": 50,
            "revenue": 32500.00
          },
          "multiChildFamilies": {
            "count": 48,
            "revenue": 55000.00,
            "totalSavingsFromDiscounts": 6750.00
          },
          "pendingPayments": 2500.00,
          "overduePayments": 1200.00
        }
      },
      "capacityByAgeGroup": [
        {
          "ageGroup": "Toddler (18-36 months)",
          "capacity": 40,
          "currentEnrollment": 35,
          "availableSpots": 5
        },
        {
          "ageGroup": "Primary (3-6 years)",
          "capacity": 120,
          "currentEnrollment": 85,
          "availableSpots": 35
        },
        {
          "ageGroup": "Elementary (6-12 years)",
          "capacity": 40,
          "currentEnrollment": 25,
          "availableSpots": 15
        }
      ],
      "subscriptionStatus": {
        "tier": "premium",
        "state": "active", 
        "nextBillingDate": "2025-10-24T00:00:00Z",
        "studentsUsed": 145,
        "studentsLimit": 200,
        "daysUntilExpiry": null
      }
    },
    "securityAlerts": [
      {
        "id": "alert-uuid",
        "type": "failed_logins",
        "severity": "medium",
        "message": "3 failed login attempts from IP 192.168.1.100",
        "timestamp": "2025-09-24T09:15:00Z",
        "resolved": false,
        "metadata": {
          "ipAddress": "192.168.1.100",
          "userEmail": "teacher@school.edu",
          "attempts": 3
        }
      }
    ],
    "trends": {
      "period": "week",
      "dataPoints": [
        {
          "date": "2025-09-18",
          "applications": 3,
          "enrollments": 142,
          "teacherEngagement": 85,
          "revenue": 86200.00,
          "capacityUtilization": 71.0
        },
        {
          "date": "2025-09-19", 
          "applications": 2,
          "enrollments": 143,
          "teacherEngagement": 78,
          "revenue": 86850.00,
          "capacityUtilization": 71.5
        }
        // ... 5 more days
      ],
      "trends": {
        "applicationsChange": 15.4,
        "enrollmentsChange": 2.1,
        "engagementChange": -5.2,
        "revenueChange": 3.8,
        "capacityChange": 1.2
      }
    }
  }
}
```

**Response Success for Super Admin (200)**:
```json
{
  "success": true,
  "data": {
    "aggregated": true,
    "systemMetrics": {
      "totalSchools": 25,
      "totalStudents": 3420,
      "totalTeachers": 180,
      "totalCapacity": 4200,
      "systemCapacityUtilization": 81.4,
      "totalMonthlyRevenue": 2890000.00,
      "averageRevenuePerSchool": 115600.00,
      "systemHealth": {
        "uptime": 99.9,
        "avgResponseTime": 245,
        "errorRate": 0.12
      },
      "subscriptionBreakdown": {
        "basic": 8,
        "premium": 15,
        "enterprise": 2
      },
      "securitySummary": {
        "low": 5,
        "medium": 2, 
        "high": 1,
        "critical": 0
      }
    },
    "trends": {
      "period": "month",
      "systemGrowth": {
        "newSchools": 3,
        "studentGrowth": 8.5,
        "teacherGrowth": 12.3
      }
    }
  }
}
```

**Response Error (403)**:
```json
{
  "success": false,
  "error": "Insufficient permissions - Admin role required",
  "code": "ADMIN_REQUIRED"
}
```

**Response Error (429)**:
```json
{
  "success": false,
  "error": "Rate limit exceeded - Dashboard metrics limited to 60 requests per minute",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30
}
```

**Response Error (500)**:
```json
{
  "success": false,
  "error": "Unable to calculate metrics - database temporarily unavailable", 
  "code": "METRICS_UNAVAILABLE",
  "fallback": {
    "cached": true,
    "timestamp": "2025-09-24T09:00:00Z",
    "message": "Showing cached data from 1 hour ago"
  }
}
```

## Performance Guarantees

**Response Time**: < 300ms for single school metrics, < 500ms for Super Admin aggregated metrics

**Caching**: 
- Single school metrics cached for 5 minutes
- Security alerts cached for 1 minute 
- Super Admin aggregations cached for 15 minutes
- Trend data cached for 1 hour

**Rate Limiting**: 
- 60 requests per minute per admin user
- 120 requests per minute for Super Admin users
- Burst allowance of 10 requests

## Data Freshness

**Real-time Data** (< 1 minute delay):
- Security alerts
- Subscription status changes
- Critical system notifications

**Near Real-time Data** (< 5 minutes delay):
- Pending applications count
- Active enrollments
- Teacher login activity

**Batch Updated Data** (hourly):
- Trend calculations
- Teacher engagement scores
- System health metrics

## Security & Privacy

**Tenant Isolation**:
- All queries scoped by user's school_id
- Super Admin queries aggregate without individual school identification
- No cross-tenant data leakage in error responses

**Audit Logging**:
- All metric requests logged with user, timestamp, school
- Failed authorization attempts logged with IP address
- Performance metrics logged for optimization

**Data Sensitivity**:
- Student counts only (no PII)
- Teacher activity aggregated (no individual tracking)
- Security alerts anonymized in Super Admin view