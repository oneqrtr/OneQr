import type { Metadata, Viewport } from 'next';
import { createClient } from '@/lib/supabase';

export async function generateViewport(props: { params: Promise<{ slug: string }> }): Promise<Viewport> {
    const params = await props.params;
    const supabase = createClient();
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('theme_color')
        .eq('slug', params.slug)
        .single();

    return {
        themeColor: restaurant?.theme_color || '#ffffff',
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    };
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const supabase = createClient();
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('name, logo_url, description')
        .eq('slug', params.slug)
        .single();

    if (restaurant) {
        return {
            title: restaurant.name,
            description: restaurant.description || `${restaurant.name} QR Menü`,
            manifest: `/api/manifest/${params.slug}`,
            icons: {
                icon: restaurant.logo_url || '/favicon.ico',
                shortcut: restaurant.logo_url || '/favicon.ico',
                apple: restaurant.logo_url || '/apple-touch-icon.png',
            },
            appleWebApp: {
                title: restaurant.name,
                statusBarStyle: 'default',
                capable: true,
            },
            openGraph: {
                title: restaurant.name,
                description: restaurant.description || `${restaurant.name} QR Menü`,
                images: restaurant.logo_url ? [{ url: restaurant.logo_url }] : [],
            }
        };
    }

    return {
        title: 'OneQR Menü',
        description: 'En iyi QR menü deneyimi',
        manifest: '/manifest.json', // Fallback
    };
}

export default function MenuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
