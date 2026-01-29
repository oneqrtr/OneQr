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
                setPlan(rest.plan || 'trial');
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
                        {(plan === 'plusimum' || plan === 'trial' || plan === 'freemium') && (
                            <Link href={`https://${slug}.oneqr.tr`} target="_blank" className="btn-icon-mobile" title="Siteye Git">
                                <i className="fa-solid fa-globe"></i>
                                <span className="btn-label-desktop">Siteye Git</span>
                            </Link>
                        )}
                        {(plan === 'plusimum' || plan === 'trial' || plan === 'freemium') && (
                            <Link href={`/k/${slug}`} target="_blank" className="btn-icon-mobile purple" title="Kartviziti Gör">
                                <i className="fa-solid fa-address-card"></i>
                                <span className="btn-label-desktop">Kartvizit</span>
                            </Link>
                        )}
                        <Link href={`/menu/${slug}`} target="_blank" className="btn-icon-mobile outline" title="Menüyü Gör">
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            <span className="btn-label-desktop">Menü</span>
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
