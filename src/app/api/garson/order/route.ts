import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getGarsonSession } from '@/lib/garson-session';

export async function POST(request: Request) {
    const body = await request.json();
    const { slug, tableNumber, items, totalAmount, paymentMethod } = body;
    if (!slug || tableNumber == null || !Array.isArray(items) || items.length === 0 || totalAmount == null) {
        return NextResponse.json({ error: 'slug, tableNumber, items ve totalAmount gerekli' }, { status: 400 });
    }
    const session = await getGarsonSession(slug);
    if (!session) {
        return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
    }
    const method = paymentMethod === 'credit_card' ? 'credit_card' : 'cash';
    try {
        const supabase = createServiceClient();
        const { data: rest } = await supabase
            .from('restaurants')
            .select('id')
            .eq('slug', slug)
            .single();
        if (!rest) {
            return NextResponse.json({ error: 'Restoran bulunamadı' }, { status: 404 });
        }
        const { data: newOrder, error } = await supabase
            .from('orders')
            .insert({
                restaurant_id: rest.id,
                customer_name: `Masa ${tableNumber}`,
                table_number: Number(tableNumber),
                items,
                total_amount: Number(totalAmount),
                payment_method: method,
                status: 'pending',
                source: 'restaurant'
            })
            .select()
            .single();
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        await supabase.from('table_status').upsert(
            { restaurant_id: rest.id, table_number: Number(tableNumber), status: 'occupied', updated_at: new Date().toISOString() },
            { onConflict: 'restaurant_id,table_number' }
        );
        return NextResponse.json({ order: newOrder });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
