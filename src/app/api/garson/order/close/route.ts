import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getGarsonSession } from '@/lib/garson-session';

export async function PATCH(request: Request) {
    const body = await request.json();
    const { slug, orderId, paymentMethod } = body;
    if (!slug || !orderId) {
        return NextResponse.json({ error: 'slug ve orderId gerekli' }, { status: 400 });
    }
    const session = await getGarsonSession(slug);
    if (!session) {
        return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
    }
    const method = paymentMethod === 'credit_card' ? 'credit_card' : 'cash';
    try {
        const supabase = createServiceClient();
        const { data: order } = await supabase
            .from('orders')
            .select('id, restaurant_id, table_number, source')
            .eq('id', orderId)
            .single();
        if (!order || order.restaurant_id === undefined) {
            return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
        }
        const { data: rest } = await supabase
            .from('restaurants')
            .select('id')
            .eq('slug', slug)
            .single();
        if (!rest || rest.id !== order.restaurant_id) {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
        }
        const { error } = await supabase
            .from('orders')
            .update({ status: 'completed', payment_method: method })
            .eq('id', orderId);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        const tableNum = order.source === 'restaurant' ? order.table_number : null;
        if (tableNum != null && rest.id) {
            const { data: otherOpen } = await supabase
                .from('orders')
                .select('id')
                .eq('restaurant_id', rest.id)
                .eq('source', 'restaurant')
                .eq('table_number', tableNum)
                .eq('status', 'pending')
                .neq('id', orderId);
            if (!otherOpen?.length) {
                await supabase.from('table_status').upsert(
                    { restaurant_id: rest.id, table_number: tableNum, status: 'empty', updated_at: new Date().toISOString() },
                    { onConflict: 'restaurant_id,table_number' }
                );
            }
        }
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
