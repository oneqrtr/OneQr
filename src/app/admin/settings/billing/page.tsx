'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BillingPage() {
    const [loading, setLoading] = useState(false);
    const [currentPlan, setCurrentPlan] = useState('trial');
    const [endsAt, setEndsAt] = useState<string | null>(null);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    // Notification Form State
    const [selectedPlan, setSelectedPlan] = useState('monthly'); // monthly, yearly
    const [senderName, setSenderName] = useState('');
    const [notifLoading, setNotifLoading] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchPlan = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: rest } = await supabase
                .from('restaurants')
                .select('id, plan, plan_ends_at')
                .eq('owner_id', user.id)
                .single();

            if (rest) {
                setRestaurantId(rest.id);
                setCurrentPlan(rest.plan || 'trial');
                setEndsAt(rest.plan_ends_at);
            }
        };
        fetchPlan();
    }, []);

    const handleNotifyPayment = async () => {
        if (!senderName.trim()) {
            alert('Lütfen gönderen adını giriniz.');
            return;
        }
        if (!restaurantId) return;

        setNotifLoading(true);
        const amount = selectedPlan === 'monthly' ? 179 : 1199;

        try {
            const { error } = await supabase
                .from('payment_notifications')
                .insert({
                    restaurant_id: restaurantId,
                    plan_type: selectedPlan,
                    amount: amount,
                    sender_name: senderName,
                    status: 'pending'
                });

            if (error) throw error;

            alert('Ödeme bildiriminiz alındı! Kontrol edildikten sonra paketiniz aktif edilecektir.');
            setSenderName('');
        } catch (err: any) {
            console.error(err);
            alert('Hata: ' + err.message);
        } finally {
            setNotifLoading(false);
        }
    };

    return (
        <>
            <Topbar title="Abonelik ve Ödeme" />
            <div className="content-wrapper">
                {/* Current Plan Card */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Mevcut Planınız</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                padding: '4px 12px',
                                background: currentPlan === 'pro' || currentPlan === 'monthly' || currentPlan === 'yearly' ? '#DEF7EC' : '#FEF3C7',
                                color: currentPlan === 'pro' || currentPlan === 'monthly' || currentPlan === 'yearly' ? '#03543F' : '#92400E',
                                borderRadius: '20px',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                {currentPlan === 'monthly' ? 'Aylık Pro' : currentPlan === 'yearly' ? 'Yıllık Pro' : currentPlan === 'trial' ? 'Deneme Sürümü' : currentPlan}
                            </span>
                            {endsAt && (
                                <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                                    (Bitiş: {new Date(endsAt).toLocaleDateString('tr-TR')})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Plan Selection Grid */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#374151' }}>Paket Seçimi</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {/* Monthly Card */}
                    <div
                        onClick={() => setSelectedPlan('monthly')}
                        style={{
                            background: selectedPlan === 'monthly' ? '#EFF6FF' : 'white',
                            border: `2px solid ${selectedPlan === 'monthly' ? '#2563EB' : 'var(--border-color)'}`,
                            borderRadius: '12px',
                            padding: '24px',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aylık</h3>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563EB' }}>149 TL</div>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#4B5563', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            <li>✅ Sınırsız Kategori & Ürün</li>
                            <li>✅ QR Kod Özelleştirme</li>
                            <li>✅ 7/24 Destek</li>
                        </ul>
                    </div>

                    {/* Yearly Card */}
                    <div
                        onClick={() => setSelectedPlan('yearly')}
                        style={{
                            background: selectedPlan === 'yearly' ? '#EFF6FF' : 'white',
                            border: `2px solid ${selectedPlan === 'yearly' ? '#2563EB' : 'var(--border-color)'}`,
                            borderRadius: '12px',
                            padding: '24px',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#F59E0B', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>EN POPÜLER</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Yıllık Pro</h3>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563EB' }}>999 TL</div>
                                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>/yıl + KDV</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#16A34A', fontWeight: 600, marginBottom: '8px' }}>
                            Aylık sadece 83 ₺'ye geliyor!
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>
                            İşletmeniz için en mantıklı seçim. Neredeyse yarı fiyatına!
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#4B5563', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            <li>✅ Net %45 İndirim</li>
                            <li>✅ 789 ₺ Cebinizde Kalsın</li>
                            <li>✅ Kurulum & Menü Giriş Desteği</li>
                        </ul>
                    </div>
                </div>

                {/* Payment Instructions & Form */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Instructions */}
                    <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '12px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-building-columns"></i> Banka Bilgileri
                        </h4>
                        <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.8' }}>
                            <p>Lütfen ödemeyi aşağıdaki IBAN numarasına gönderiniz.</p>
                            <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', margin: '12px 0', fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem', color: '#111827' }}>
                                TR00 0000 0000 0000 0000 0000 00
                            </div>
                            <p><strong>Alıcı:</strong> OneQR Teknoloji A.Ş.</p>
                            <p><strong>Açıklama:</strong> {selectedPlan === 'monthly' ? 'Aylık' : 'Yıllık'} Paket Ödemesi</p>
                            <p style={{ marginTop: '12px', fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic' }}>
                                Not: Faturanız, ödeme onaylandıktan sonra kayıtlı e-posta adresinize gönderilecektir.
                            </p>
                        </div>
                    </div>

                    {/* Notification Form */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Ödeme Bildirimi</h4>
                        <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '16px' }}>
                            Ödemeyi yaptıktan sonra lütfen aşağıdaki formu doldurun.
                        </p>

                        <div className="form-group">
                            <label className="form-label">Seçilen Paket</label>
                            <div style={{ padding: '10px', background: '#F3F4F6', borderRadius: '8px', fontWeight: 500 }}>
                                {selectedPlan === 'monthly' ? 'Aylık Paket (179 TL - KDV Dahil)' : 'Yıllık Paket (1199 TL - KDV Dahil)'}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Gönderen İsim Soyisim</label>
                            <input
                                className="form-input"
                                placeholder="Örn: Ahmet Yılmaz"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '8px' }}
                            onClick={handleNotifyPayment}
                            disabled={notifLoading}
                        >
                            {notifLoading ? 'Bildiriliyor...' : 'Ödeme Yaptım, Bildir'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
