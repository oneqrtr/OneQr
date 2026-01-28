'use client';

import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [status, setStatus] = useState<{ type: 'trial' | 'expired' | 'premium' | 'plusimum', daysLeft?: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: rest } = await supabase
                .from('restaurants')
                .select('plan, plan_ends_at, created_at')
                .eq('owner_id', user.id)
                .single();

            if (rest) {
                const plan = rest.plan || 'freemium';
                const createdDate = new Date(rest.created_at);
                const now = new Date();

                // Calculate days left for trial
                // Assuming trial is 14 days from creation if plan is freemium/trial
                let type: 'trial' | 'expired' | 'premium' | 'plusimum' = 'trial';
                let daysLeft = 0;

                if (plan === 'freemium' || plan === 'trial') {
                    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    daysLeft = 14 - diffDays;

                    if (daysLeft < 0) {
                        type = 'expired';
                    } else {
                        type = 'trial';
                    }
                } else if (plan === 'premium') {
                    type = 'premium';
                } else {
                    type = 'plusimum';
                }

                setStatus({ type, daysLeft });
            }
            setLoading(false);
        };

        checkStatus();
    }, []);

    return (
        <div className="app-body">
            <Sidebar />
            <main className="main-content">
                {!loading && status?.type === 'expired' && (
                    <div style={{ background: '#FECACA', color: '#B91C1C', padding: '12px 24px', marginBottom: '24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            <span style={{ fontWeight: 600 }}>Deneme süreniz sona erdi.</span> Hizmetiniz geçici olarak durduruldu.
                        </div>
                        <Link href="/admin/settings/billing" style={{ background: '#DC2626', color: 'white', padding: '6px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                            Hemen Yükselt
                        </Link>
                    </div>
                )}

                {!loading && status?.type === 'trial' && status.daysLeft !== undefined && status.daysLeft <= 5 && (
                    <div style={{ background: '#FEF3C7', color: '#92400E', padding: '12px 24px', marginBottom: '24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-clock"></i>
                            <span>Deneme sürenizin bitmesine <strong style={{ color: '#B45309' }}>{status.daysLeft} gün</strong> kaldı.</span>
                        </div>
                        <Link href="/admin/settings/billing" style={{ background: '#D97706', color: 'white', padding: '6px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                            Paket Seç
                        </Link>
                    </div>
                )}

                {!loading && status?.type === 'premium' && (
                    <div style={{ background: '#EFF6FF', color: '#1E40AF', padding: '12px 24px', marginBottom: '24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #BFDBFE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-gem"></i>
                            <span><strong>Plusimum</strong> ayrıcalıklarını keşfedin: Özel Subdomain ve Markalı Site!</span>
                        </div>
                        <Link href="/admin/settings/billing" style={{ background: '#2563EB', color: 'white', padding: '6px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                            İncele
                        </Link>
                    </div>
                )}

                {children}
            </main>
        </div>
    )
}
