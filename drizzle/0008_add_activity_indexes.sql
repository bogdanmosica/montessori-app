-- Additional performance indexes for activity tracking queries
-- These indexes optimize multi-tenant date range queries for trend analysis

-- Composite indexes for efficient tenant + date range queries
CREATE INDEX IF NOT EXISTS idx_applications_tenant_submitted ON applications(school_id, submitted_at DESC);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_enrolled ON enrollments(school_id, enrollment_date DESC);

--> statement-breakpoint

-- Indexes for payment activities (already in main migration but adding additional ones)
CREATE INDEX IF NOT EXISTS idx_payment_activities_tenant_status ON payment_activities(tenant_id, status, payment_date DESC);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_payment_activities_child ON payment_activities(child_id, payment_date DESC) WHERE child_id IS NOT NULL;

--> statement-breakpoint

-- Indexes for staff activities with activity type filtering
CREATE INDEX IF NOT EXISTS idx_staff_activities_tenant_type_date ON staff_activities(tenant_id, activity_type, activity_date DESC);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_staff_activities_staff ON staff_activities(staff_id, activity_date DESC);

--> statement-breakpoint

-- Indexes for events with event type filtering
CREATE INDEX IF NOT EXISTS idx_events_tenant_type_date ON events(tenant_id, event_type, event_date DESC);

--> statement-breakpoint

-- Covering index for summary queries (includes count aggregation columns)
CREATE INDEX IF NOT EXISTS idx_applications_tenant_status_submitted ON applications(school_id, status, submitted_at DESC);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_status_enrolled ON enrollments(school_id, status, enrollment_date DESC);

--> statement-breakpoint

-- Partial indexes for active/completed records (most common queries)
CREATE INDEX IF NOT EXISTS idx_payment_activities_completed ON payment_activities(tenant_id, payment_date DESC) WHERE status = 'completed';

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_enrollments_active ON enrollments(school_id, enrollment_date DESC) WHERE status = 'active';

--> statement-breakpoint

-- Index for date truncation queries (used in aggregation)
CREATE INDEX IF NOT EXISTS idx_staff_activities_date_trunc ON staff_activities(tenant_id, DATE(activity_date));

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_events_date_trunc ON events(tenant_id, DATE(event_date));

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_payment_activities_date_trunc ON payment_activities(tenant_id, DATE(payment_date)) WHERE status = 'completed';
