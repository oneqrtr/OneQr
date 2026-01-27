-- Add is_seen column to payment_notifications
ALTER TABLE payment_notifications ADD COLUMN IF NOT EXISTS is_seen boolean DEFAULT false;

-- Update get_payments to return is_seen
DROP FUNCTION IF EXISTS superadmin_get_payments(text);

CREATE OR REPLACE FUNCTION superadmin_get_payments(pass text)
RETURNS TABLE (
  id uuid,
  restaurant_name text,
  plan_type text,
  amount numeric,
  sender_name text,
  status text,
  created_at timestamptz,
  is_seen boolean
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
    pn.created_at,
    pn.is_seen
  FROM payment_notifications pn
  JOIN restaurants r ON r.id = pn.restaurant_id
  WHERE pn.status = 'pending'
  ORDER BY pn.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all pending payments as seen
CREATE OR REPLACE FUNCTION superadmin_mark_payments_seen(pass text)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE payment_notifications
  SET is_seen = true
  WHERE status = 'pending' AND is_seen = false;
END;
$$ LANGUAGE plpgsql;
