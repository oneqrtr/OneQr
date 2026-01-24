-- 1. Add columns to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'; -- active, passive
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS plan text DEFAULT 'trial'; -- trial, pro, expired
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS plan_ends_at timestamptz DEFAULT (now() + interval '7 days'); -- trial for 7 days by default

-- 2. Update Get Restaurants Function
DROP FUNCTION IF EXISTS superadmin_get_restaurants;

CREATE OR REPLACE FUNCTION superadmin_get_restaurants(pass text) 
RETURNS TABLE (
  id uuid, 
  name text, 
  slug text, 
  created_at timestamptz, 
  phone_number text,
  status text,
  plan text,
  plan_ends_at timestamptz
) 
SECURITY DEFINER
AS $$
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Hatalı Şifre';
  END IF;

  RETURN QUERY 
  SELECT r.id, r.name, r.slug, r.created_at, r.phone_number, r.status, r.plan, r.plan_ends_at
  FROM restaurants r
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Update Status Function
CREATE OR REPLACE FUNCTION superadmin_update_restaurant(pass text, target_id uuid, new_status text, new_plan text) 
RETURNS void 
SECURITY DEFINER
AS $$
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Hatalı Şifre';
  END IF;

  UPDATE restaurants 
  SET status = new_status, plan = new_plan
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql;
