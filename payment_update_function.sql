-- ============================================================
-- PGMentor: Create admin_update_subscription_payment function
-- Run this ONCE in your Supabase SQL Editor:
--   supabase.com → your project → SQL Editor → paste & run
--
-- NOTE: This is optional — the server now uses direct REST PATCH
-- which works without this function. But you can still run this
-- for additional redundancy.
-- ============================================================

CREATE OR REPLACE FUNCTION admin_update_subscription_payment(
  p_user_id  TEXT,
  p_is_trial BOOLEAN DEFAULT false,
  p_status   TEXT    DEFAULT 'active'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count   INTEGER;
  v_end     TIMESTAMPTZ := NOW() + INTERVAL '1 year';
  v_trial   TIMESTAMPTZ := NOW() + INTERVAL '7 days';
BEGIN
  IF p_is_trial THEN
    -- Revert to trial state
    -- NOTE: 'trial' is NOT a valid status value (CHECK constraint allows only
    --   'active', 'expired', 'cancelled', 'suspended').
    -- Trial users keep status='active' but have is_trial=true.
    UPDATE subscriptions
    SET
      is_trial       = true,
      status         = 'active',
      trial_end_date = v_trial,
      end_date       = NULL,
      start_date     = NOW()
    WHERE user_id::TEXT = p_user_id;
  ELSE
    -- Mark as paid: clear trial flags, activate for 1 year
    UPDATE subscriptions
    SET
      is_trial       = false,
      status         = 'active',
      trial_end_date = NULL,
      end_date       = v_end,
      start_date     = NOW()
    WHERE user_id::TEXT = p_user_id;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object(
    'success',      v_count > 0,
    'rows_updated', v_count
  );
END;
$$;
