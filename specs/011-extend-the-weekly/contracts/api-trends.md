# API Contract: Weekly Trends Data

## Endpoint: GET /api/admin/metrics

### Extended Parameters (addition to existing endpoint)

#### Query Parameters
```typescript
interface TrendsQueryParams {
  // Existing parameters preserved
  metric_type?: string;
  
  // New parameters for trends
  trend?: 'weekly' | 'custom';
  start_date?: string; // ISO 8601 date format (YYYY-MM-DD)
  end_date?: string;   // ISO 8601 date format (YYYY-MM-DD)
  activity_types?: string[]; // Array of activity types to include
  group_by?: 'day' | 'week'; // Aggregation level
}
```

#### Activity Types Enum
```typescript
type ActivityType = 
  | 'applications'
  | 'enrollments' 
  | 'payments'
  | 'staff_activities'
  | 'events';
```

### Request Examples

#### Default Weekly Trends (7 days)
```http
GET /api/admin/metrics?trend=weekly
Authorization: Bearer {jwt_token}
```

#### Custom Date Range with Specific Activities
```http
GET /api/admin/metrics?trend=custom&start_date=2025-09-01&end_date=2025-09-30&activity_types=applications,enrollments,payments
Authorization: Bearer {jwt_token}
```

### Response Schema

#### Success Response (200 OK)
```typescript
interface TrendsResponse {
  success: true;
  data: {
    date_range: {
      start_date: string; // ISO 8601 date
      end_date: string;   // ISO 8601 date
      total_days: number;
    };
    tenant_info: {
      tenant_id: string;
      school_name: string;
    };
    metrics: DailyMetric[];
    summary: {
      total_applications: number;
      total_enrollments: number;
      total_payments: number;
      total_payment_amount: number;
      total_staff_activities: number;
      total_events: number;
    };
  };
  timestamp: string; // ISO 8601 datetime
}

interface DailyMetric {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  applications: {
    count: number;
    breakdown: {
      pending: number;
      approved: number;
      rejected: number;
      withdrawn: number;
    };
  };
  enrollments: {
    count: number;
    breakdown: {
      new: number;
      returning: number;
      transfer: number;
    };
  };
  payments: {
    count: number;
    total_amount: number;
    breakdown: {
      tuition: number;
      registration: number;
      materials: number;
      other: number;
    };
  };
  staff_activities: {
    count: number;
    breakdown: {
      hire: number;
      promotion: number;
      training: number;
      evaluation: number;
      departure: number;
    };
  };
  events: {
    count: number;
    breakdown: {
      meeting: number;
      ceremony: number;
      training: number;
      social: number;
      academic: number;
    };
  };
}
```

#### Error Responses

##### Authentication Error (401 Unauthorized)
```typescript
interface AuthError {
  success: false;
  error: {
    code: 'UNAUTHORIZED';
    message: 'Authentication required';
  };
  timestamp: string;
}
```

##### Authorization Error (403 Forbidden)
```typescript
interface AuthzError {
  success: false;
  error: {
    code: 'INSUFFICIENT_PERMISSIONS';
    message: 'Admin role required';
  };
  timestamp: string;
}
```

##### Validation Error (400 Bad Request)
```typescript
interface ValidationError {
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      field: string;
      issue: string;
    }[];
  };
  timestamp: string;
}
```

##### Tenant Context Error (400 Bad Request)
```typescript
interface TenantError {
  success: false;
  error: {
    code: 'TENANT_CONTEXT_MISSING';
    message: 'Unable to load data';
  };
  timestamp: string;
}
```

##### Server Error (500 Internal Server Error)
```typescript
interface ServerError {
  success: false;
  error: {
    code: 'INTERNAL_SERVER_ERROR';
    message: 'Unable to load data';
  };
  timestamp: string;
}
```

### Request/Response Headers

#### Required Request Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
Accept: application/json
```

#### Response Headers
```http
Content-Type: application/json
Cache-Control: private, max-age=300
X-Rate-Limit-Remaining: 1000
X-Tenant-ID: {tenant_uuid}
```

### Validation Rules

#### Query Parameter Validation
- `start_date` and `end_date` must be valid ISO 8601 dates
- `end_date` must be after `start_date`  
- Date range cannot exceed 365 days
- `activity_types` must contain valid ActivityType values
- If `trend=weekly`, `start_date` and `end_date` are ignored (defaults to last 7 days)
- If `trend=custom`, both `start_date` and `end_date` are required

#### Security Validation
- User must have Admin role
- User must have valid tenant context
- All data must be scoped to user's tenant
- Rate limiting: 100 requests per minute per user

### Caching Strategy
- Cache key: `trends:{tenant_id}:{start_date}:{end_date}:{activity_types_hash}`
- TTL: 5 minutes for recent data (last 7 days)
- TTL: 1 hour for historical data (older than 7 days)
- Cache invalidation on new data creation

### Performance Expectations
- Response time: <200ms for cached data
- Response time: <1000ms for uncached data
- Maximum date range: 365 days
- Maximum concurrent requests per tenant: 10