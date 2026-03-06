-- Mutfak stok ve reçete: ham maddeler, reçete satırları, stok hareketleri
-- Supabase SQL Editor'da çalıştırın.

-- 1. Ham maddeler tablosu
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'adet',
    current_stock NUMERIC NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_materials_restaurant ON public.raw_materials(restaurant_id);

ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "raw_materials_select" ON public.raw_materials FOR SELECT
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "raw_materials_insert" ON public.raw_materials FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "raw_materials_update" ON public.raw_materials FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
CREATE POLICY "raw_materials_delete" ON public.raw_materials FOR DELETE
  USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

-- 2. Reçete satırları (ürün - ham madde, porsiyon başı miktar)
CREATE TABLE IF NOT EXISTS public.recipe_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    quantity_per_serving NUMERIC NOT NULL CHECK (quantity_per_serving > 0),
    UNIQUE(product_id, raw_material_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_lines_product ON public.recipe_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_lines_raw_material ON public.recipe_lines(raw_material_id);

ALTER TABLE public.recipe_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_lines_select" ON public.recipe_lines FOR SELECT
  USING (
    product_id IN (SELECT p.id FROM public.products p JOIN public.categories c ON p.category_id = c.id WHERE c.restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
    OR raw_material_id IN (SELECT id FROM public.raw_materials WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
  );
CREATE POLICY "recipe_lines_insert" ON public.recipe_lines FOR INSERT
  WITH CHECK (
    product_id IN (SELECT p.id FROM public.products p JOIN public.categories c ON p.category_id = c.id WHERE c.restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
  );
CREATE POLICY "recipe_lines_update" ON public.recipe_lines FOR UPDATE
  USING (product_id IN (SELECT p.id FROM public.products p JOIN public.categories c ON p.category_id = c.id WHERE c.restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "recipe_lines_delete" ON public.recipe_lines FOR DELETE
  USING (product_id IN (SELECT p.id FROM public.products p JOIN public.categories c ON p.category_id = c.id WHERE c.restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())));

-- 3. Stok hareketleri
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('intake', 'adjustment', 'waste', 'order_consumption')),
    quantity NUMERIC NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_raw_material ON public.stock_movements(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order ON public.stock_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at DESC);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_movements_select" ON public.stock_movements FOR SELECT
  USING (raw_material_id IN (SELECT id FROM public.raw_materials WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())));
CREATE POLICY "stock_movements_insert" ON public.stock_movements FOR INSERT
  WITH CHECK (raw_material_id IN (SELECT id FROM public.raw_materials WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())));

-- 4. Sipariş tamamlandığında: reçeteli ürünlerde ham maddeden düş, reçetesizde products.stock_quantity düş
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item JSONB;
  pid UUID;
  qty INT;
  recipe_count INT;
  rl RECORD;
  needed NUMERIC;
BEGIN
  IF NEW.status <> 'completed' OR (OLD.status IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb))
  LOOP
    pid := (item->>'product_id')::UUID;
    qty := COALESCE((item->>'quantity')::INT, 0);
    IF pid IS NULL OR qty <= 0 THEN
      CONTINUE;
    END IF;

    SELECT COUNT(*) INTO recipe_count FROM public.recipe_lines WHERE product_id = pid;

    IF recipe_count > 0 THEN
      -- Reçeteli ürün: ham maddelerden düş, stock_movements ekle
      FOR rl IN SELECT raw_material_id, quantity_per_serving FROM public.recipe_lines WHERE product_id = pid
      LOOP
        needed := rl.quantity_per_serving * qty;
        UPDATE public.raw_materials
        SET current_stock = GREATEST(0, current_stock - needed),
            updated_at = now()
        WHERE id = rl.raw_material_id;
        INSERT INTO public.stock_movements (raw_material_id, movement_type, quantity, order_id, note)
        VALUES (rl.raw_material_id, 'order_consumption', -needed, NEW.id, NULL);
      END LOOP;
    ELSE
      -- Reçetesiz: mevcut mantık (products.stock_quantity)
      UPDATE public.products
      SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - qty),
          stock_updated_at = now()
      WHERE id = pid AND stock_quantity IS NOT NULL;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_decrement_stock_on_order_completed ON public.orders;
CREATE TRIGGER trigger_decrement_stock_on_order_completed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.decrement_stock_on_order_completed();
