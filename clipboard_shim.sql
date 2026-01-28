-- Update superadmin_approve_payment to handle new plan types (e.g. 'premium_monthly', 'plusimum_yearly')

CREATE OR REPLACE FUNCTION superadmin_approve_payment(pass text, notification_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id uuid;
  v_plan_key text; -- e.g. 'premium_monthly'
  v_tier text;     -- 'premium' or 'plusimum'
  v_period text;   -- 'monthly' or 'yearly'
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get info
  SELECT restaurant_id, plan_type INTO v_restaurant_id, v_plan_key
  FROM payment_notifications
  WHERE id = notification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  -- Parse plan key
  -- Check if it contains underscore (new format)
  IF position('_' in v_plan_key) > 0 THEN
    v_tier := split_part(v_plan_key, '_', 1);
    v_period := split_part(v_plan_key, '_', 2);
  ELSE
    -- Legacy support
    v_tier := 'plusimum'; -- Default to high tier if ambiguous or legacy
    v_period := v_plan_key;
  END IF;

  -- Update Payment Status
  UPDATE payment_notifications SET status = 'approved', updated_at = now() WHERE id = notification_id;

  -- Update Restaurant Plan
  UPDATE restaurants 
  SET 
    plan = v_tier, -- 'premium' or 'plusimum'
    plan_ends_at = CASE 
      WHEN v_period = 'monthly' THEN now() + interval '1 month'
      WHEN v_period = 'yearly' THEN now() + interval '1 year'
      ELSE now() + interval '1 month'
    END,
    status = 'active' -- Reactivate if passive
  WHERE id = v_restaurant_id;

END;
$$ LANGUAGE plpgsql;
