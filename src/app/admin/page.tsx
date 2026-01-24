'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalViews: 0,
        activeProducts: 0,
        categoryCount: 0
    });
    const [subscription, setSubscription] = useState<{
        plan: string;
        ends_at: string | null;
        status: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) return;

                // 1. Get Restaurant ID with simple retry logic
                let restaurant = null;
                for (let i = 0; i < 3; i++) {
                    const { data } = await supabase
                        .from('restaurants')
                        .select('id, plan, plan_ends_at, temp_status:status') // Alias status as temp_status to avoid conflict if any types issue
                        .eq('owner_id', user.id)
                        .maybeSingle();

                    if (data) {
                        restaurant = data;
                        break;
                    }
                    await new Promise(r => setTimeout(r, 1000));
                }

                if (!restaurant) {
                    setLoading(false);
                    return;
                }

                if (restaurant) {
                    // Set subscription data
                    setSubscription({
                        plan: restaurant.plan || 'trial',
                        ends_at: restaurant.plan_ends_at,
                        status: (restaurant as any).temp_status || 'active'
                    });

                    // 2. Get Product Count
                    const { data: categories } = await supabase
                        .from('categories')
                        .select('id')
                        .eq('restaurant_id', restaurant.id);

                    const categoryIds = categories?.map(c => c.id) || [];

                    let realProductCount = 0;
                    if (categoryIds.length > 0) {
                        const { count } = await supabase
                            .from('products')
                            .select('*', { count: 'exact', head: true })
                            .in('category_id', categoryIds)
                            .eq('is_available', true);
                        realProductCount = count || 0;
                    }

                    // 3. Get Analytics (Total Views)
                    const { count: viewCount } = await supabase
                        .from('analytics')
                        .select('*', { count: 'exact', head: true })
                        .eq('restaurant_id', restaurant.id)
                        .eq('event_type', 'view_menu');

                    setStats({
                        totalViews: viewCount || 0,
                        activeProducts: realProductCount,
                        categoryCount: categoryIds.length
                    });
                }
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    // Helper to calculate remaining days
    const getRemainingDays = () => {
        if (!subscription?.ends_at) return 0;
        const end = new Date(subscription.ends_at);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return <div className="p-8 text-center">Yükleniyor...</div>;
    }

    return (
        <>
            <Topbar title="Genel Bakış" />
            <div className="content-wrapper">

                {stats.categoryCount === 0 && stats.activeProducts === 0 ? (
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '40px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Henüz Restoran Kaydınız Yok</h2>
                        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Panel özelliklerini kullanabilmek için işletme kurulumunu tamamlamanız gerekiyor.</p>
                        <Link href="/onboarding" className="btn btn-primary">Kurulumu Tamamla</Link>
                    </div>
                ) : (
                    <>
                        {/* Status Cards */}
                        <div className="stats-grid" style={{ marginBottom: '24px' }}>
                            <div className="stat-card">
                                <div className="stat-title">Toplam Görüntülenme</div>
                                <div className="stat-value" style={{ color: '#2563EB' }}>{stats.totalViews}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>Menü Ziyaretçisi</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-title">Aktif Ürünler</div>
                                <div className="stat-value">{stats.activeProducts}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>Toplam Kalem</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-title">Toplam Kategori</div>
                                <div className="stat-value">{stats.categoryCount}</div>
                                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>Menü Başlığı</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-title">
                                    {subscription?.plan === 'trial' ? 'Kalan Deneme Süresi' : 'Abonelik Durumu'}
                                </div>
                                <div className={`stat-value ${getRemainingDays() < 3 ? 'text-red-500' : 'highlight-orange'}`}>
                                    {subscription?.status === 'passive' ? 'Pasif' :
                                        getRemainingDays() > 0 ? `${getRemainingDays()} Gün` : 'Süresiz'}
                                </div>
                                <div style={{ marginTop: '8px' }}>
                                    {subscription?.plan === 'trial' && (
                                        <Link href="/admin/settings/billing" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 500 }}>Şimdi Yükselt →</Link>
                                    )}
                                    {subscription?.plan === 'pro' && (
                                        <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 500 }}>Pro Paket Aktif</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Quick Actions Placeholders */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ padding: '10px', background: '#EFF6FF', borderRadius: '8px', color: '#2563EB' }}>
                                    <i className="fa-solid fa-chart-pie"></i>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Detaylı Analiz</h3>
                                    <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Menü performansınızı takip edin.</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '8px' }}>Bugünkü Ziyaretçi</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>--</div>
                                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Çok Yakında</div>
                                </div>
                                <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '8px' }}>En Çok Bakılan Ürün</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>--</div>
                                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Çok Yakında</div>
                                </div>
                                <div style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '8px' }}>QR Tarama Sayısı</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>--</div>
                                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Çok Yakında</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
