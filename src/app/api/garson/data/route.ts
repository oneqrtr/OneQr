import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getGarsonSession } from '@/lib/garson-session';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
        return NextResponse.json({ error: 'slug gerekli' }, { status: 400 });
    }
    const session = await getGarsonSession(slug);
    if (!session) {
        return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
    }
    try {
        const supabase = createServiceClient();
        const { data: rest, error: restErr } = await supabase
            .from('restaurants')
            .select('id, name, slug, theme_color, table_count')
            .eq('slug', slug)
            .single();
        if (restErr || !rest) {
            return NextResponse.json({ error: 'Restoran bulunamadı' }, { status: 404 });
        }
        const tableCount = Math.max(1, rest.table_count ?? 10);
        const selectedDate = searchParams.get('date');
        const startOfDay = selectedDate
            ? new Date(selectedDate)
            : new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', rest.id)
            .eq('source', 'restaurant')
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString())
            .order('created_at', { ascending: false });

        const { data: statusRows } = await supabase
            .from('table_status')
            .select('table_number, status')
            .eq('restaurant_id', rest.id);

        const tableStatusMap: Record<number, string> = {};
        (statusRows || []).forEach((r: { table_number: number; status: string }) => {
            tableStatusMap[r.table_number] = r.status;
        });

        const { data: cats } = await supabase
            .from('categories')
            .select('id, name, display_order')
            .eq('restaurant_id', rest.id)
            .order('display_order', { ascending: true });
        const catIds = (cats || []).map((c: { id: string }) => c.id);
        let prods: unknown[] = [];
        let vars: unknown[] = [];
        if (catIds.length > 0) {
            const { data: p } = await supabase
                .from('products')
                .select('id, category_id, name, price, display_order, image_url, ingredients')
                .in('category_id', catIds)
                .order('display_order', { ascending: true });
            prods = p || [];
            const prodIds = (prods as { id: string }[]).map((x) => x.id);
            if (prodIds.length > 0) {
                const { data: v } = await supabase
                    .from('product_variants')
                    .select('id, product_id, name, price')
                    .in('product_id', prodIds);
                vars = v || [];
            }
        }

        const { data: presets } = await supabase
            .from('menu_preset_options')
            .select('id, label, display_order')
            .eq('restaurant_id', rest.id)
            .order('display_order', { ascending: true });

        return NextResponse.json({
            restaurant: rest,
            tableCount,
            orders: orders || [],
            tableStatusMap,
            categories: cats || [],
            products: prods,
            variants: vars,
            presetOptions: presets || []
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
