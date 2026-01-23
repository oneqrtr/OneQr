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

                // 1. Get Restaurant ID
                const { data: restaurant } = await supabase
                    .from('restaurants')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (restaurant) {
                    // 2. Get Product Count
                    const { count: productCount } = await supabase
                        .from('products')
                        .select('*', { count: 'exact', head: true }) // head: true means do not return rows, just count
                        .eq('is_available', true)
                    // In a real scenario we'd join with categories -> restaurant, but currently simplified 
                    // Since we don't have direct restaurant_id on products, we need to filter by categories belonging to this restaurant
                    // But for v1 schema, let's do a join query or 2-step

                    // Actually, let's just get categories first
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
                        totalViews: 0, // Not tracking views yet
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

    return (
        <>
            <Topbar title="Genel Bakış" />
            <div className="content-wrapper">
                {/* Status Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-title">Toplam Kategori</div>
                        <div className="stat-value">{loading ? '-' : stats.categoryCount}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Aktif Ürünler</div>
                        <div className="stat-value">{loading ? '-' : stats.activeProducts}</div>
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

            </div>
        </>
    )
}
