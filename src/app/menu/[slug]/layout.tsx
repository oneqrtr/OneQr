import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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
            icons: {
                icon: restaurant.logo_url || '/favicon.ico',
                shortcut: restaurant.logo_url || '/favicon.ico',
                apple: restaurant.logo_url || '/favicon.ico', // iOS icon
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
        description: 'En iyi QR menü deneyimi'
    };
}

export default function MenuLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
