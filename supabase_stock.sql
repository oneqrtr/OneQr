-- Stok yönetimi: products stok alanları + sipariş tamamlandığında stok düşüm trigger
-- Supabase SQL Editor'da çalıştırın.

-- 1. Ürün stok alanları
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_updated_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Sipariş tamamlandığında (status = 'completed') ilgili ürün stoğunu düşüren fonksiyon
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  pid UUID;
  qty INT;
BEGIN
  -- Sadece status completed'a geçtiğinde çalışsın (önceden completed değilse)
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb))
    LOOP
      pid := (item->>'product_id')::UUID;
      qty := COALESCE((item->>'quantity')::INT, 0);
      IF pid IS NOT NULL AND qty > 0 THEN
        UPDATE public.products
        SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - qty),
            stock_updated_at = now()
        WHERE id = pid AND stock_quantity IS NOT NULL;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger: orders güncellendiğinde
DROP TRIGGER IF EXISTS trigger_decrement_stock_on_order_completed ON public.orders;
CREATE TRIGGER trigger_decrement_stock_on_order_completed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.decrement_stock_on_order_completed();
