
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    const supabase = createClient();
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('name, logo_url, theme_color, description')
        .eq('slug', params.slug)
        .single();

    if (!restaurant) {
        return new NextResponse(JSON.stringify({ error: 'Restaurant not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const manifest = {
        name: restaurant.name || 'OneQR Menü',
        short_name: restaurant.name ? restaurant.name.substring(0, 12) : 'OneQR',
        description: restaurant.description || `${restaurant.name} için dijital QR menü.`,
        id: `/${params.slug}`,
        start_url: `https://${params.slug}.oneqr.tr/`,
        scope: `https://${params.slug}.oneqr.tr/`,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: restaurant.theme_color || '#ffffff',
        icons: restaurant.logo_url ? [
            {
                src: restaurant.logo_url,
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: restaurant.logo_url,
                sizes: '512x512',
                type: 'image/png'
            }
        ] : [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
    };

    return new NextResponse(JSON.stringify(manifest), {
        headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
