-- 1. Add Column
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS is_subdomain_enabled BOOLEAN DEFAULT TRUE;

-- 2. Drop existing functions to avoid return type conflict and ensure correct function mapping
DROP FUNCTION IF EXISTS superadmin_get_restaurants();
DROP FUNCTION IF EXISTS superadmin_get_restaurants(text); -- Clean up old version if exists

-- Drop the old updater function so calls with 6 arguments default to the new function
DROP FUNCTION IF EXISTS superadmin_update_restaurant_details(uuid, text, text, text, text, timestamptz);

-- 3. Create Getter Function
CREATE OR REPLACE FUNCTION superadmin_get_restaurants() 
RETURNS TABLE (
  id uuid, 
  name text, 
  slug text, 
  created_at timestamptz, 
  phone_number text,
  status text,
  plan text,
  plan_ends_at timestamptz,
  is_subdomain_enabled boolean
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Security check
  IF NOT EXISTS (SELECT 1 FROM superadmins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY 
  SELECT r.id, r.name, r.slug, r.created_at, r.phone_number, r.status, r.plan, r.plan_ends_at, r.is_subdomain_enabled
  FROM restaurants r
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Updater Function
CREATE OR REPLACE FUNCTION superadmin_update_restaurant_details(
    target_id uuid,
    new_name text,
    new_slug text,
    new_status text,
    new_plan text,
    new_ends_at timestamptz,
    new_is_subdomain_enabled boolean DEFAULT NULL
) 
RETURNS void 
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM superadmins WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE restaurants 
  SET 
    name = new_name,
    slug = new_slug,
    status = new_status,
    plan = new_plan,
    plan_ends_at = new_ends_at,
    is_subdomain_enabled = COALESCE(new_is_subdomain_enabled, is_subdomain_enabled)
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql;
