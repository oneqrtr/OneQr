'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    phone_number?: string;
    status: string;
    plan: string;
    plan_ends_at?: string;
}

export default function SuperAdminPage() {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [activeTab, setActiveTab] = useState('restaurants');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Data State
    const [loading, setLoading] = useState(false);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

    const [paymentNotifications, setPaymentNotifications] = useState<any[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);

    const router = useRouter();
    const supabase = createClient();

    // Check Auth and Superadmin Status
    useEffect(() => {
        const checkAccess = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Not logged in
                router.push('/login?next=/superadmin');
                return;
            }

            // Try to fetch restaurants to verify superadmin access
            // We use 'superadmin_get_restaurants' which now checks 'is_super_admin()' implicitly
            const { error } = await supabase.rpc('superadmin_get_restaurants');

            if (error) {
                console.error('Access Denied', error);
                alert('Erişim Reddedildi: Bu sayfayı görüntüleme yetkiniz yok.');
                router.push('/'); // Redirect to home or admin dashboard
            } else {
                setIsAuthenticated(true);
                fetchRestaurants();
                fetchPayments();
            }
            setVerifying(false);
        };

        checkAccess();
    }, []);

    const fetchRestaurants = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('superadmin_get_restaurants');
        if (!error) {
            setRestaurants(data || []);
        }
        setLoading(false);
    };

    const fetchPayments = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('superadmin_get_payments');
        if (error) {
            console.error('Payment fetch error:', error);
        } else {
            const payments = data || [];
            setPaymentNotifications(payments);
            // Count unseen
            const unseen = payments.filter((p: any) => p.is_seen === false).length;
            setNotificationCount(unseen);
        }
        setLoading(false);
    };

    const markPaymentsSeen = async () => {
        const { error } = await supabase.rpc('superadmin_mark_payments_seen');
        if (!error) {
            setNotificationCount(0);
            // Optionally update local state's matches to is_seen=true to avoid refetch
            setPaymentNotifications(prev => prev.map(p => ({ ...p, is_seen: true })));
        }
    };

    // Effect to fetch data when tab changes 
    useEffect(() => {
        if (!isAuthenticated) return;

        if (activeTab === 'restaurants') {
            fetchRestaurants();
            fetchPayments(); // Check for notifications in background
        } else if (activeTab === 'payments') {
            fetchPayments().then(() => {
                // Mark as seen after fetching
                markPaymentsSeen();
            });
        }
    }, [activeTab, isAuthenticated]);

    const handlePaymentAction = async (id: string, action: 'approve' | 'reject') => {
        if (!confirm(`Bu ödemeyi ${action === 'approve' ? 'ONAYLAMAK' : 'REDDETMEK'} istediğinize emin misiniz?`)) return;

        const rpcName = action === 'approve' ? 'superadmin_approve_payment' : 'superadmin_reject_payment';

        const { error } = await supabase.rpc(rpcName, {
            notification_id: id
        });

        if (error) {
            alert('İşlem başarısız: ' + error.message);
        } else {
            alert(`Ödeme ${action === 'approve' ? 'onaylandı' : 'reddedildi'}.`);
            fetchPayments();
        }
    };

    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

    const handleUpdate = async (id: string, field: 'status' | 'plan' | 'details', value: any, newEndsAt?: string) => {
        // Optimistic update
        setRestaurants(prev => prev.map(r =>
            r.id === id ? {
                ...r,
                ...(field === 'status' ? { status: value } : {}),
                ...(field === 'plan' ? { plan: value, ...(newEndsAt ? { plan_ends_at: newEndsAt } : {}) } : {}),
                ...(field === 'details' ? { name: value.name, slug: value.slug, plan: value.plan, status: value.status, ...(value.ends_at ? { plan_ends_at: value.ends_at } : {}) } : {})
            } : r
        ));

        const current = restaurants.find(r => r.id === id);
        if (!current) return;

        // Prepare new values based on what Changed
        let newName = current.name;
        let newSlug = current.slug;
        let newStatus = current.status;
        let newPlan = current.plan;
        let newEndsAtVal = current.plan_ends_at;

        if (field === 'details') {
            newName = value.name;
            newSlug = value.slug;
            newStatus = value.status;
            newPlan = value.plan;
            newEndsAtVal = value.ends_at || current.plan_ends_at;
        } else if (field === 'status') {
            newStatus = value;
        } else if (field === 'plan') {
            newPlan = value;
            if (newEndsAt) newEndsAtVal = newEndsAt;
        }

        // Unified RPC Call
        const { error } = await supabase.rpc('superadmin_update_restaurant_details', {
            target_id: id,
            new_name: newName,
            new_slug: newSlug,
            new_status: newStatus,
            new_plan: newPlan,
            new_ends_at: newEndsAtVal
        });

        if (error) {
            alert('Güncelleme başarısız: ' + error.message);
            // Revert changes by refetching
            fetchRestaurants();
        } else {
            // Update local state completely with confirmed values if needed, 
            // but optimistic update usually suffices. 
            // We can update the selectedRestaurant if modal is open to reflect changes immediately there too.
            if (selectedRestaurant && selectedRestaurant.id === id) {
                setSelectedRestaurant(prev => prev ? ({
                    ...prev,
                    name: newName,
                    slug: newSlug,
                    status: newStatus,
                    plan: newPlan,
                    plan_ends_at: newEndsAtVal
                }) : null);
            }

            // Update list exact values
            setRestaurants(prev => prev.map(r =>
                r.id === id ? {
                    ...r,
                    name: newName,
                    slug: newSlug,
                    status: newStatus,
                    plan: newPlan,
                    plan_ends_at: newEndsAtVal
                } : r
            ));

            if (field === 'details') {
                setSelectedRestaurant(null); // Close modal only on full save
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} restoranını silmek istediğinize emin misiniz?`)) return;

        const { error } = await supabase.rpc('superadmin_delete_restaurant', {
            target_id: id
        });

        if (error) {
            alert('Silinemedi: ' + error.message);
        } else {
            alert('Restoran silindi.');
            fetchRestaurants();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        router.push('/login');
    };

    if (verifying) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yetki kontrolü yapılıyor...</div>;
    }

    if (!isAuthenticated) return null; // Will redirect in useEffect

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
            {/* CSS for Responsive Visibility */}
            <style jsx global>{`
                .desktop-view { display: block; }
                .mobile-view { display: none; }
                
                @media (max-width: 768px) {
                    .desktop-view { display: none !important; }
                    .mobile-view { display: block !important; }
                    .superadmin-content { width: 100% !important; margin-left: 0 !important; }
                    .superadmin-sidebar { transform: translateX(-100%); }
                    .superadmin-sidebar.open { transform: translateX(0); }
                }
                @media (min-width: 769px) {
                    .mobile-toggle { display: none !important; }
                    .superadmin-sidebar { transform: translateX(0) !important; position: sticky !important; height: 100vh; }
                }
            `}</style>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
            )}

            {/* Sidebar */}
            <div className={`superadmin-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
                width: '260px', background: '#111827', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0,
                position: 'fixed', top: 0, bottom: 0, left: 0, transition: 'transform 0.3s ease', zIndex: 50
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/logowhite.png" alt="OneQR" style={{ height: '32px' }} />
                    <span style={{ background: '#DC2626', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>SUPER</span>
                </div>

                <nav style={{ padding: '16px', flex: 1 }}>
                    <div onClick={() => { setActiveTab('restaurants'); setMobileMenuOpen(false); }} style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'restaurants' ? '#374151' : 'transparent', color: activeTab === 'restaurants' ? 'white' : '#9CA3AF' }}>
                        <i className="fa-solid fa-utensils"></i> Restoranlar
                    </div>
                    <div onClick={() => { setActiveTab('payments'); setMobileMenuOpen(false); }} style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: activeTab === 'payments' ? '#374151' : 'transparent', color: activeTab === 'payments' ? 'white' : '#9CA3AF', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className="fa-solid fa-credit-card"></i> Ödemeler
                        </div>
                        {notificationCount > 0 && (
                            <span style={{ background: '#EF4444', color: 'white', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>
                                {notificationCount}
                            </span>
                        )}
                    </div>
                </nav>

                <div style={{ padding: '16px', borderTop: '1px solid #374151' }}>
                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px' }}>
                        <i className="fa-solid fa-right-from-bracket"></i> Çıkış Yap
                    </button>
                </div>

                {/* Mobile Handle */}
                <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
                    position: 'absolute', right: '-24px', top: '80px', width: '24px', height: '40px', background: 'white', border: '1px solid #E5E7EB', borderLeft: 'none', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 60, boxShadow: '4px 0 6px rgba(0,0,0,0.05)'
                }}>
                    <i className={`fa-solid fa-chevron-${mobileMenuOpen ? 'left' : 'right'}`} style={{ fontSize: '0.8rem', color: '#6B7280' }}></i>
                </button>
            </div>

            {/* Content */}
            <div className="superadmin-content" style={{ flex: 1, overflowY: 'auto' }}>
                <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 30 }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827' }}>
                        {activeTab === 'restaurants' ? 'Restoran Yönetimi' : 'Ödeme Geçmişi'}
                    </h2>
                    {activeTab === 'restaurants' && (
                        <button onClick={() => fetchRestaurants()} className="btn btn-outline btn-sm">
                            <i className="fa-solid fa-sync"></i> <span className="desktop-view" style={{ display: 'inline' }}>Yenile</span>
                        </button>
                    )}
                </header>

                <div style={{ padding: '24px' }}>
                    {activeTab === 'restaurants' && (
                        <>
                            {/* Desktop Table View */}
                            <div className="desktop-view" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                        <tr>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>RESTORAN ADI</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>DURUM</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>PLAN</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>OLUŞTURULMA</th>
                                            <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280', textAlign: 'right' }}>İŞLEMLER</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {restaurants.map(rest => (
                                            <tr key={rest.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: 600 }}>{rest.name}</div>
                                                    <a href={`/menu/${rest.slug}`} target="_blank" style={{ color: '#2563EB', fontSize: '0.85rem' }}>/menu/{rest.slug} ↗</a>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div
                                                        onClick={() => handleUpdate(rest.id, 'status', rest.status === 'active' ? 'passive' : 'active')}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            cursor: 'pointer',
                                                            background: rest.status === 'active' ? '#E1EFFE' : '#F3F4F6',
                                                            padding: '4px 8px',
                                                            borderRadius: '20px',
                                                            width: 'fit-content'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '36px',
                                                            height: '20px',
                                                            background: rest.status === 'active' ? '#3B82F6' : '#9CA3AF',
                                                            borderRadius: '20px',
                                                            position: 'relative',
                                                            transition: 'background 0.3s'
                                                        }}>
                                                            <div style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                background: 'white',
                                                                borderRadius: '50%',
                                                                position: 'absolute',
                                                                top: '2px',
                                                                left: rest.status === 'active' ? '18px' : '2px',
                                                                transition: 'left 0.3s'
                                                            }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: rest.status === 'active' ? '#1E429F' : '#4B5563' }}>
                                                            {rest.status === 'active' ? 'Aktif' : 'Pasif'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{
                                                                background: rest.plan === 'pro' ? '#DEF7EC' : rest.plan === 'trial' ? '#FEF3C7' : '#F3F4F6',
                                                                color: rest.plan === 'pro' ? '#03543F' : rest.plan === 'trial' ? '#92400E' : '#374151',
                                                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600
                                                            }}>
                                                                {rest.plan === 'pro' ? 'Pro' : rest.plan === 'trial' ? 'Deneme' : rest.plan === 'expired' ? 'Doldu' : rest.plan}
                                                            </span>
                                                            <button onClick={() => setSelectedRestaurant(rest)} style={{ fontSize: '0.8rem', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Düzenle</button>
                                                        </div>
                                                        {rest.plan_ends_at && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Bitiş: {new Date(rest.plan_ends_at).toLocaleDateString()}</div>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', color: '#6B7280' }}>{new Date(rest.created_at).toLocaleDateString()}</td>
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <button onClick={() => handleDelete(rest.id, rest.name)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Sil</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile List View */}
                            <div className="mobile-view">
                                {restaurants.map(rest => (
                                    <div key={rest.id} style={{ background: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div>
                                                <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{rest.name}</h3>
                                                <a href={`/menu/${rest.slug}`} target="_blank" style={{ color: '#2563EB', fontSize: '0.9rem' }}>/menu/{rest.slug} ↗</a>
                                            </div>
                                            <button onClick={() => handleDelete(rest.id, rest.name)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '8px', borderRadius: '4px' }}>
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#6B7280' }}>Durum</label>
                                                <select value={rest.status || 'active'} onChange={(e) => handleUpdate(rest.id, 'status', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', background: rest.status === 'active' ? '#DEF7EC' : '#FDE8E8' }}>
                                                    <option value="active">Aktif</option>
                                                    <option value="passive">Pasif</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#6B7280' }}>Plan</label>
                                                <select value={rest.plan || 'trial'} onChange={(e) => handleUpdate(rest.id, 'plan', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                                                    <option value="trial">Deneme</option>
                                                    <option value="pro">Pro</option>
                                                    <option value="expired">Doldu</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '0.85rem', color: '#6B7280', display: 'flex', gap: '16px' }}>
                                            <span>📅 {new Date(rest.created_at).toLocaleDateString()}</span>
                                            <span>📞 {rest.phone_number || '-'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {restaurants.length === 0 && !loading && (
                                <p style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Kayıt bulunamadı.</p>
                            )}
                        </>
                    )}
                    {activeTab === 'payments' && (
                        <>
                            {paymentNotifications.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>Bekleyen ödeme bildirimi yok.</p>
                            ) : (
                                <div className="desktop-view" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                            <tr>
                                                <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>RESTORAN</th>
                                                <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>GONDEREN</th>
                                                <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>PAKET</th>
                                                <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>TUTAR</th>
                                                <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280' }}>TARIH</th>
                                                <th style={{ padding: '16px', fontSize: '0.85rem', color: '#6B7280', textAlign: 'right' }}>ISLEMLER</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentNotifications.map(p => (
                                                <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                    <td style={{ padding: '16px', fontWeight: 500 }}>{p.restaurant_name}</td>
                                                    <td style={{ padding: '16px' }}>{p.sender_name}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600,
                                                            background: p.plan_type.includes('yearly') ? '#FEF3C7' : '#EFF6FF',
                                                            color: p.plan_type.includes('yearly') ? '#92400E' : '#1E40AF',
                                                            textTransform: 'capitalize'
                                                        }}>
                                                            {p.plan_type.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', fontWeight: 600 }}>{p.amount} ₺</td>
                                                    <td style={{ padding: '16px', color: '#6B7280', fontSize: '0.85rem' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: '16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handlePaymentAction(p.id, 'approve')}
                                                            style={{ background: '#DEF7EC', color: '#03543F', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                                        >
                                                            Onayla
                                                        </button>
                                                        <button
                                                            onClick={() => handlePaymentAction(p.id, 'reject')}
                                                            style={{ background: '#FDE8E8', color: '#9B1C1C', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                                        >
                                                            Reddet
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            {/* Plan Edit Modal */}
            {selectedRestaurant && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div onClick={() => setSelectedRestaurant(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}></div>
                    <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', position: 'relative', zIndex: 10, padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', color: '#111827' }}>Plan Düzenle: {selectedRestaurant.name}</h3>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const newPlan = formData.get('plan') as string;
                            const newEndsAt = formData.get('plan_ends_at') as string;
                            const newName = formData.get('name') as string;
                            const newSlug = formData.get('slug') as string;
                            const newStatus = formData.get('status') as string;

                            handleUpdate(selectedRestaurant.id, 'details', {
                                name: newName,
                                slug: newSlug,
                                plan: newPlan,
                                status: newStatus,
                                ends_at: newEndsAt
                            });
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>İşletme Adı</label>
                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={selectedRestaurant.name}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                    İşletme Linki (Slug)
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#EF4444', fontWeight: 'normal' }}>Dikkat: Değiştirirseniz eski QR kodlar çalışmaz!</span>
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ background: '#F3F4F6', padding: '10px 12px', border: '1px solid #D1D5DB', borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#6B7280', fontSize: '0.9rem' }}>/menu/</span>
                                    <input
                                        name="slug"
                                        type="text"
                                        defaultValue={selectedRestaurant.slug}
                                        style={{ width: '100%', padding: '10px', borderRadius: '0 8px 8px 0', border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                                        required
                                        pattern="[a-z0-9-]+"
                                        title="Sadece küçük harf, rakam ve tire (-) kullanılabilir"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Durum</label>
                                    <select
                                        name="status"
                                        defaultValue={selectedRestaurant.status}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="passive">Pasif</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Plan Tipi</label>
                                    <select
                                        name="plan"
                                        defaultValue={selectedRestaurant.plan}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const dateInput = document.querySelector('input[name="plan_ends_at"]') as HTMLInputElement;
                                            if (dateInput) {
                                                const now = new Date();
                                                // Handle presets
                                                // We don't know exact period from simple plan name like 'premium', 
                                                // so we might default to +1 month or just leave current date.
                                                // Let's modify values to include period for helper logic only? 
                                                // No, value must be valid DB plan enum/text.

                                                if (val === 'trial') {
                                                    now.setDate(now.getDate() + 14);
                                                    dateInput.value = now.toISOString().split('T')[0];
                                                }
                                                // For others we don't auto-set date because we don't know if it's monthly or yearly context in this simple dropdown
                                            }
                                        }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                                    >
                                        <option value="freemium">Freemium</option>
                                        <option value="premium">Premium</option>
                                        <option value="plusimum">Plusimum</option>
                                        <option value="trial">Deneme (14 Gün)</option>
                                        <option value="expired">Süresi Dolmuş</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Bitiş Tarihi</label>
                                <input
                                    type="date"
                                    name="plan_ends_at"
                                    defaultValue={selectedRestaurant.plan_ends_at ? new Date(selectedRestaurant.plan_ends_at).toISOString().split('T')[0] : ''}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>
                                    Bu tarihte plan otomatik olarak sonlanacaktır.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRestaurant(null)}
                                    style={{ padding: '10px 16px', borderRadius: '8px', background: 'white', border: '1px solid #D1D5DB', color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '10px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
