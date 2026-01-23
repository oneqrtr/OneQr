'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Topbar({ title }: { title: string }) {
    const [slug, setSlug] = useState('');

    useEffect(() => {
        const fetchSlug = async () => {
            const { createClient } = await import('@/lib/supabase');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: rest } = await supabase
                .from('restaurants')
                .select('slug')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (rest) {
                setSlug(rest.slug);
            }
        };
        fetchSlug();
    }, []);

    return (
        <header className="topbar">
            <div className="page-title">{title}</div>
            <div className="topbar-actions">
                {slug && (
                    <Link href={`/m/${slug}`} target="_blank" className="btn btn-sm btn-outline">
                        <i className="fa-solid fa-external-link-alt" style={{ marginRight: '6px' }}></i> Menüyü Gör
                    </Link>
                )}
            </div>
        </header>
    );
}
