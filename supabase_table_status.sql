-- Masa durumu: Boş / Dolu / Hesap istendi
CREATE TABLE IF NOT EXISTS public.table_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'occupied', 'bill_requested')),
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(restaurant_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_table_status_restaurant ON public.table_status(restaurant_id);

ALTER TABLE public.table_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage table_status"
    ON public.table_status FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
