'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Topbar({ title, titleContent }: { title?: string; titleContent?: React.ReactNode }) {
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
                setPlan(rest.plan || 'trial');
            }
        };
        fetchSlug();
    }, []);

    return (
        <header className="topbar">
            <div className="page-title">{titleContent ?? title ?? ''}</div>
            <div className="topbar-actions">
                {slug && (
                    <>
                        {(plan === 'plusimum' || plan === 'trial' || plan === 'freemium') && (
                            <Link href={`https://${slug}.oneqr.tr`} target="_blank" className="btn-icon-mobile" title="Siteye Git">
                                <i className="fa-solid fa-globe"></i>
                                <span className="btn-label-desktop">Siteye Git</span>
                            </Link>
                        )}
                        {(plan === 'plusimum' || plan === 'trial' || plan === 'freemium') && (
                            <span className="btn-icon-mobile" style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }} title="Yakında">
                                <i className="fa-solid fa-address-card"></i>
                                <span className="btn-label-desktop">Kartvizit</span>
                            </span>
                        )}
                        <Link href={`/garson/${slug}`} target="_blank" className="btn-icon-mobile outline" title="Garson paneli linki">
                            <i className="fa-solid fa-user-tie"></i>
                            <span className="btn-label-desktop">Garson linki</span>
                        </Link>
                        <Link href={`/restoran/${slug}`} target="_blank" className="btn-icon-mobile outline" title="Restoran içi sipariş menüsü">
                            <i className="fa-solid fa-utensils"></i>
                            <span className="btn-label-desktop">Menü</span>
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
