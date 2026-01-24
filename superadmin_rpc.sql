-- Function to check password and return all restaurants (Bypasses RLS)
CREATE OR REPLACE FUNCTION superadmin_get_restaurants(pass text) 
RETURNS TABLE (
  id uuid, 
  name text, 
  slug text, 
  created_at timestamptz, 
  phone_number text
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Simple hardcoded password check
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Hatalı Şifre';
  END IF;

  RETURN QUERY 
  SELECT r.id, r.name, r.slug, r.created_at, r.phone_number
  FROM restaurants r
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to delete a restaurant (Bypasses RLS)
CREATE OR REPLACE FUNCTION superadmin_delete_restaurant(pass text, target_id uuid) 
RETURNS void 
SECURITY DEFINER
AS $$
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Hatalı Şifre';
  END IF;

  DELETE FROM restaurants WHERE id = target_id;
END;
$$ LANGUAGE plpgsql;
