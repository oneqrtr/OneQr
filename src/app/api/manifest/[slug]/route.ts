
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

    const themeColor = restaurant.theme_color || '#ffffff';
    const baseUrl = `https://${params.slug}.oneqr.tr`;

    const manifest = {
        name: restaurant.name || 'OneQR Menü',
        short_name: restaurant.name ? restaurant.name.substring(0, 12) : 'OneQR',
        description: restaurant.description || `${restaurant.name} için dijital QR menü.`,
        id: `/${params.slug}`,
        start_url: `${baseUrl}/`,
        scope: `${baseUrl}/`,
        display: 'standalone',
        orientation: 'portrait' as const,
        background_color: themeColor,
        theme_color: themeColor,
        icons: restaurant.logo_url ? [
            { src: restaurant.logo_url, sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: restaurant.logo_url, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: restaurant.logo_url, sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: restaurant.logo_url, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ] : [
            { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
    };

    return new NextResponse(JSON.stringify(manifest), {
        headers: {
            'Content-Type': 'application/manifest+json',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
