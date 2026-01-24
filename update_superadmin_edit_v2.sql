
-- Function to update restaurant details including Name and Slug
-- Protected by superadmin password
CREATE OR REPLACE FUNCTION superadmin_update_restaurant_details(
    pass text,
    target_id uuid,
    new_name text,
    new_slug text,
    new_status text,
    new_plan text,
    new_ends_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Check Password
    IF pass <> 'OneQr2024!' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 2. Check if slug is taken (if it changed)
    IF EXISTS (
        SELECT 1 FROM restaurants 
        WHERE slug = new_slug 
        AND id <> target_id
    ) THEN
        RAISE EXCEPTION 'Bu işletme linki (slug) başka bir restoran tarafından kullanılıyor.';
    END IF;

    -- 3. Update
    UPDATE restaurants
    SET 
        name = new_name,
        slug = new_slug,
        status = new_status,
        plan = new_plan,
        plan_ends_at = new_ends_at
    WHERE id = target_id;

END;
$$;
