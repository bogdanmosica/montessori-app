-- Create staff activity type enum
CREATE TYPE staff_activity_type AS ENUM ('hire', 'promotion', 'training', 'evaluation', 'departure');

--> statement-breakpoint

-- Create event type enum
CREATE TYPE event_type AS ENUM ('meeting', 'ceremony', 'training', 'social', 'academic');

--> statement-breakpoint

-- Create payment activity type enum
CREATE TYPE payment_activity_type AS ENUM ('tuition', 'registration', 'materials', 'other');

--> statement-breakpoint

-- Create payment activity status enum
CREATE TYPE payment_activity_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

--> statement-breakpoint

-- Create staff_activities table
CREATE TABLE staff_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES teams(id),
  staff_id INTEGER NOT NULL REFERENCES users(id),
  activity_type staff_activity_type NOT NULL,
  activity_date TIMESTAMP NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES teams(id),
  name VARCHAR(255) NOT NULL,
  event_type event_type NOT NULL,
  event_date TIMESTAMP NOT NULL,
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Create payment_activities table
CREATE TABLE payment_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES teams(id),
  child_id UUID REFERENCES children(id),
  activity_type payment_activity_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  status payment_activity_status NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--> statement-breakpoint

-- Add constraints
ALTER TABLE staff_activities
ADD CONSTRAINT check_activity_date_not_future
CHECK (activity_date <= NOW());

--> statement-breakpoint

ALTER TABLE events
ADD CONSTRAINT check_event_date_not_future
CHECK (event_date <= NOW());

--> statement-breakpoint

ALTER TABLE events
ADD CONSTRAINT check_participant_count_non_negative
CHECK (participant_count >= 0);

--> statement-breakpoint

ALTER TABLE payment_activities
ADD CONSTRAINT check_payment_date_not_future
CHECK (payment_date <= NOW());

--> statement-breakpoint

ALTER TABLE payment_activities
ADD CONSTRAINT check_amount_positive
CHECK (amount > 0);

--> statement-breakpoint

-- Create indexes for efficient tenant-scoped queries
CREATE INDEX idx_staff_activities_tenant_date ON staff_activities(tenant_id, activity_date DESC);

--> statement-breakpoint

CREATE INDEX idx_events_tenant_date ON events(tenant_id, event_date DESC);

--> statement-breakpoint

CREATE INDEX idx_payment_activities_tenant_date ON payment_activities(tenant_id, payment_date DESC);

--> statement-breakpoint

-- Additional indexes for filtering
CREATE INDEX idx_staff_activities_type ON staff_activities(activity_type);

--> statement-breakpoint

CREATE INDEX idx_events_type ON events(event_type);

--> statement-breakpoint

CREATE INDEX idx_payment_activities_type ON payment_activities(activity_type);

--> statement-breakpoint

CREATE INDEX idx_payment_activities_status ON payment_activities(status);
