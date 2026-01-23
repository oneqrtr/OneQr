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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) return;

                // 1. Get Restaurant ID with simple retry logic
                // Retry up to 3 times with 1s delay to handle replication lag
                let restaurant = null;
                for (let i = 0; i < 3; i++) {
                    const { data } = await supabase
                        .from('restaurants')
                        .select('id')
                        .eq('owner_id', user.id)
                        .maybeSingle();

                    if (data) {
                        restaurant = data;
                        break;
                    }
                    // Wait 1s before retry
                    await new Promise(r => setTimeout(r, 1000));
                }

                if (!restaurant) {
                    setLoading(false);
                    return; // Stop here, render empty state or onboarding prompt in UI
                }

                if (restaurant) {
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

                    setStats({
                        totalViews: 0,
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

    if (loading) {
        return <div className="p-8 text-center">Yükleniyor...</div>;
    }

    // If no stats loaded (meaning no restaurant), show setup prompt
    if (stats.categoryCount === 0 && stats.activeProducts === 0 && !loading) {
        // We can check if we actually have a restaurant by checking if stats were updated or use a separate state. 
        // But to be safe let's add a separate state for 'hasRestaurant'.
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
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-title">Toplam Kategori</div>
                                <div className="stat-value">{stats.categoryCount}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-title">Aktif Ürünler</div>
                                <div className="stat-value">{stats.activeProducts}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-title">Kalan Deneme Süresi</div>
                                <div className="stat-value highlight-orange">7 Gün</div>
                                <div style={{ marginTop: '8px' }}>
                                    <Link href="#" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 500 }}>Şimdi Yükselt →</Link>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Quick Actions Placeholders */}
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', color: '#E5E7EB', marginBottom: '16px' }}>
                                <i className="fa-solid fa-chart-line"></i>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Analitik Verileri</h3>
                            <p style={{ color: 'var(--text-light)', maxWidth: '400px' }}>Detaylı ziyaretçi istatistikleri ve sipariş trendleri yakında burada olacak.</p>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
