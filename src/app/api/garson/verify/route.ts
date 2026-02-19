import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createGarsonCookie } from '@/lib/garson-session';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { slug, pin } = body;
        if (!slug || typeof pin !== 'string') {
            return NextResponse.json({ error: 'slug ve pin gerekli' }, { status: 400 });
        }
        const supabase = createServiceClient();
        const { data: rest, error } = await supabase
            .from('restaurants')
            .select('id, waiter_pin')
            .eq('slug', slug)
            .single();
        if (error || !rest) {
            return NextResponse.json({ error: 'Restoran bulunamadı' }, { status: 404 });
        }
        const expectedPin = rest.waiter_pin?.trim() || '';
        if (!expectedPin) {
            return NextResponse.json({ error: 'Garson paneli bu işletme için tanımlanmamış' }, { status: 403 });
        }
        if (expectedPin !== pin.trim()) {
            return NextResponse.json({ error: 'Yanlış PIN' }, { status: 401 });
        }
        const cookieStore = await cookies();
        cookieStore.set('garson_sess', createGarsonCookie(slug), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/'
        });
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
