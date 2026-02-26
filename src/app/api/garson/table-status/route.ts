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
            .select('id')
            .eq('slug', slug)
            .single();
        if (restErr || !rest) {
            return NextResponse.json({ error: 'Restoran bulunamadı' }, { status: 404 });
        }
        const { data: statusRows } = await supabase
            .from('table_status')
            .select('table_number, status')
            .eq('restaurant_id', rest.id);
        const tableStatusMap: Record<number, string> = {};
        (statusRows || []).forEach((r: { table_number: number; status: string }) => {
            tableStatusMap[r.table_number] = r.status;
        });
        return NextResponse.json({ tableStatusMap });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const body = await request.json();
    const { slug, tableNumber, status } = body;
    if (!slug || tableNumber == null || !status) {
        return NextResponse.json({ error: 'slug, tableNumber ve status gerekli' }, { status: 400 });
    }
    if (status !== 'bill_requested' && status !== 'empty' && status !== 'occupied') {
        return NextResponse.json({ error: 'Geçersiz status' }, { status: 400 });
    }
    const session = await getGarsonSession(slug);
    if (!session) {
        return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
    }
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
        const { error } = await supabase
            .from('table_status')
            .upsert(
                { restaurant_id: rest.id, table_number: Number(tableNumber), status, updated_at: new Date().toISOString() },
                { onConflict: 'restaurant_id,table_number' }
            );
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
