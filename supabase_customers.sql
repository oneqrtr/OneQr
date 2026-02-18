-- Müşteriler tablosu ve orders.customer_id
-- Supabase SQL Editor'da çalıştırın.

-- 1. Müşteriler tablosu
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_detail TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC,
    payment_preference TEXT DEFAULT 'cash', -- 'cash' | 'credit_card'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, phone)
);

-- 2. Orders tablosuna customer_id
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 3. RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated select customers" ON public.customers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert customers" ON public.customers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update customers" ON public.customers
FOR UPDATE USING (auth.role() = 'authenticated');
