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
            title: `${restaurant.name} - İletişim`,
            description: restaurant.description || `${restaurant.name} Dijital Kartvizit`,
            icons: {
                icon: restaurant.logo_url || '/favicon.ico',
                shortcut: restaurant.logo_url || '/favicon.ico',
                apple: restaurant.logo_url || '/favicon.ico',
            },
            openGraph: {
                title: `${restaurant.name} - Dijital Kartvizit`,
                description: restaurant.description || `${restaurant.name} İletişim ve Adres Bilgileri`,
                images: restaurant.logo_url ? [{ url: restaurant.logo_url }] : [],
            }
        };
    }

    return {
        title: 'OneQR Kartvizit',
    };
}

export default function CardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
