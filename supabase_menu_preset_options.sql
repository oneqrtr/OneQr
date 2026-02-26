-- Hazır menü ayarları: garson / masa / paket siparişinde tekrarlayan seçenekler (Soğansız, Az pişmiş vb.)
CREATE TABLE IF NOT EXISTS public.menu_preset_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_menu_preset_options_restaurant ON public.menu_preset_options(restaurant_id);

ALTER TABLE public.menu_preset_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage own presets" ON public.menu_preset_options
    FOR ALL USING (
        restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
    );

-- Sipariş notu (hazır ayarlar metni fişte ve sipariş detayında gösterilir)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_note TEXT;
