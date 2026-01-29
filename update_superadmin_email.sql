-- Drop the existing function first to change return type signature if needed (though CREATE OR REPLACE with different return table might error, best to DROP)
DROP FUNCTION IF EXISTS superadmin_get_restaurants();

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
  is_subdomain_enabled boolean,
  owner_email varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if requesting user is superadmin (using the helper function we defined earlier)
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.slug,
    r.created_at,
    r.phone_number,
    r.status,
    r.plan,
    r.plan_ends_at,
    r.is_subdomain_enabled,
    u.email::varchar as owner_email
  FROM restaurants r
  LEFT JOIN auth.users u ON r.owner_id = u.id
  ORDER BY r.created_at DESC;
END;
$$;
