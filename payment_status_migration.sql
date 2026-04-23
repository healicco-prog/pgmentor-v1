-- ============================================================
-- PGMentor: Add payment_status to subscriptions table
-- Run this ONCE in your Supabase SQL Editor:
--   supabase.com → your project → SQL Editor → paste & run
-- ============================================================

-- Add payment_status column (done / not_done)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_done';

-- Set all existing subscriptions to 'not_done' (you can manually update paid ones via the admin panel)
UPDATE subscriptions
  SET payment_status = 'not_done'
  WHERE payment_status IS NULL;

-- Done. Now go to User Management → Edit any user → 💰 Payment tab to mark payment as Done.
