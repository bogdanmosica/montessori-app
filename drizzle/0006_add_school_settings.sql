-- Add settings columns to existing teams table (schools)
ALTER TABLE teams
ADD COLUMN default_monthly_fee_ron DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN free_enrollment_count INTEGER DEFAULT 0,
ADD COLUMN settings_updated_at TIMESTAMP;

--> statement-breakpoint

-- Add validation constraints
ALTER TABLE teams
ADD CONSTRAINT check_monthly_fee_non_negative
CHECK (default_monthly_fee_ron >= 0);

--> statement-breakpoint

ALTER TABLE teams
ADD CONSTRAINT check_enrollment_count_non_negative
CHECK (free_enrollment_count >= 0);

--> statement-breakpoint

-- Add index for efficient settings lookups
CREATE INDEX idx_teams_settings ON teams(id, settings_updated_at);