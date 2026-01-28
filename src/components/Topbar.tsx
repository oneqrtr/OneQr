'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Topbar({ title }: { title: string }) {
    const [slug, setSlug] = useState('');
    const [plan, setPlan] = useState('freemium');

    useEffect(() => {
        const fetchSlug = async () => {
            const { createClient } = await import('@/lib/supabase');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: rest } = await supabase
                .from('restaurants')
                .select('slug, plan')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (rest) {
                setSlug(rest.slug);
                setPlan(rest.plan || 'freemium');
            }
        };
        fetchSlug();
    }, []);

    return (
        <header className="topbar">
            <div className="page-title">{title}</div>
            <div className="topbar-actions">
                {slug && (
                    <>
                        <Link href={`https://${slug}.oneqr.tr`} target="_blank" className="btn btn-sm" style={{ background: '#2563EB', color: 'white', marginRight: '8px' }}>
                            <i className="fa-solid fa-globe" style={{ marginRight: '6px' }}></i> Siteye Git
                        </Link>
                        {(plan === 'plusimum' || plan === 'trial') && (
                            <Link href={`/k/${slug}`} target="_blank" className="btn btn-sm" style={{ background: '#7C3AED', color: 'white', marginRight: '8px' }}>
                                <i className="fa-solid fa-address-card" style={{ marginRight: '6px' }}></i> Kartviziti Gör
                            </Link>
                        )}
                        <Link href={`/menu/${slug}`} target="_blank" className="btn btn-sm btn-outline">
                            <i className="fa-solid fa-external-link-alt" style={{ marginRight: '6px' }}></i> Menüyü Gör
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
