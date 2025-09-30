-- Add monthly_fee_override column to enrollments table
-- This field allows enrollment-specific fee overrides, stored in cents
-- If null, the enrollment uses the child's default monthlyFee

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS monthly_fee_override INTEGER
CHECK (monthly_fee_override >= 0);

-- Add comment for clarity
COMMENT ON COLUMN enrollments.monthly_fee_override IS 'Override fee in cents, null means use child default fee';