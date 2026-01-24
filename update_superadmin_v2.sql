-- Modified superadmin_update_restaurant to support plan_ends_at
-- We create v2 to avoid breaking legacy calls immediately, or we can just replace the existing one if signature changes.
-- Replacing is better to keep things clean.

CREATE OR REPLACE FUNCTION superadmin_update_restaurant_v2(pass text, target_id uuid, new_status text, new_plan text, new_ends_at timestamptz DEFAULT null) 
RETURNS void 
SECURITY DEFINER
AS $$
BEGIN
  IF pass <> 'OneQr2024!' THEN
    RAISE EXCEPTION 'Hatalı Şifre';
  END IF;

  UPDATE restaurants 
  SET 
    status = new_status, 
    plan = new_plan,
    plan_ends_at = COALESCE(new_ends_at, plan_ends_at) -- Update date only if provided
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql;
