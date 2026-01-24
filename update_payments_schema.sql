-- Create table for payment notifications
CREATE TABLE IF NOT EXISTS payment_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_type text NOT NULL, -- 'monthly' or 'yearly'
  amount numeric NOT NULL,
  sender_name text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
-- Restaurants can insert their own notifications
CREATE POLICY "Restaurants can create payments" ON payment_notifications
  FOR INSERT WITH CHECK (auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id));

-- Restaurants can view their own notifications
CREATE POLICY "Restaurants can view own payments" ON payment_notifications
  FOR SELECT USING (auth.uid() = (SELECT owner_id FROM restaurants WHERE id = restaurant_id));

-- Superadmin can view and update all (This logic usually handled by RPC or service role, but good to have)
-- Since we use 'superadmin_get_restaurants' logic which bypasses RLS or uses simple auth, 
-- we will also create RPC functions for superadmin to manage payments safely.

-- RPC to get pending payments (Securely for superadmin)
CREATE OR REPLACE FUNCTION superadmin_get_payments(pass text)
RETURNS TABLE (
  id uuid,
  restaurant_name text,
  plan_type text,
  amount numeric,
  sender_name text,
  status text,
  created_at timestamptz
) 
SECURITY DEFINER
AS $$
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    pn.id,
    r.name as restaurant_name,
    pn.plan_type,
    pn.amount,
    pn.sender_name,
    pn.status,
    pn.created_at
  FROM payment_notifications pn
  JOIN restaurants r ON r.id = pn.restaurant_id
  WHERE pn.status = 'pending'
  ORDER BY pn.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- RPC to approve payment
CREATE OR REPLACE FUNCTION superadmin_approve_payment(pass text, notification_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id uuid;
  v_plan_type text;
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get info
  SELECT restaurant_id, plan_type INTO v_restaurant_id, v_plan_type
  FROM payment_notifications
  WHERE id = notification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  -- Update Payment Status
  UPDATE payment_notifications SET status = 'approved', updated_at = now() WHERE id = notification_id;

  -- Update Restaurant Plan
  UPDATE restaurants 
  SET 
    plan = v_plan_type,
    plan_ends_at = CASE 
      WHEN v_plan_type = 'monthly' THEN now() + interval '1 month'
      WHEN v_plan_type = 'yearly' THEN now() + interval '1 year'
      ELSE now()
    END,
    status = 'active' -- Reactivate if passive
  WHERE id = v_restaurant_id;

END;
$$ LANGUAGE plpgsql;

-- RPC to reject payment
CREATE OR REPLACE FUNCTION superadmin_reject_payment(pass text, notification_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE payment_notifications SET status = 'rejected', updated_at = now() WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;
