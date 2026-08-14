-- =============================================================================
-- Migration 09: Add 'sales_support' role to user_role ENUM
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'sales_support'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'sales_support';
  END IF;
END $$;
