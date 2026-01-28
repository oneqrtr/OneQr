-- RPC to get today's visitor count
CREATE OR REPLACE FUNCTION get_daily_visitors(target_restaurant_id uuid)
RETURNS integer
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Check if user owns the restaurant
  IF NOT EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = target_restaurant_id 
      AND owner_id = auth.uid()
  ) THEN
      RETURN 0;
  END IF;

  SELECT count(*)
  INTO v_count
  FROM analytics
  WHERE restaurant_id = target_restaurant_id
  AND event_type = 'view_menu'
  AND created_at >= current_date; 

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- RPC to get most viewed product
CREATE OR REPLACE FUNCTION get_most_viewed_product(target_restaurant_id uuid)
RETURNS TABLE (
  product_name text,
  view_count bigint
)
SECURITY DEFINER
AS $$
BEGIN
   -- Check ownership
  IF NOT EXISTS (
      SELECT 1 FROM restaurants 
      WHERE id = target_restaurant_id 
      AND owner_id = auth.uid()
  ) THEN
      RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.name as product_name,
    count(*) as view_count
  FROM analytics a
  JOIN products p ON p.id = (a.metadata->>'product_id')::uuid
  WHERE a.restaurant_id = target_restaurant_id
  AND a.event_type = 'view_product'
  GROUP BY p.name
  ORDER BY view_count DESC
  LIMIT 1;

END;
$$ LANGUAGE plpgsql;
