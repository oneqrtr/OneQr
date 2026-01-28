'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type PlanTier = 'premium' | 'plusimum';
type PlanPeriod = 'monthly' | 'yearly';

export default function BillingPage() {
    const [loading, setLoading] = useState(false);
    const [currentPlan, setCurrentPlan] = useState('trial');
    const [endsAt, setEndsAt] = useState<string | null>(null);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    // Notification Form State
    const [selectedTier, setSelectedTier] = useState<PlanTier>('plusimum');
    const [selectedPeriod, setSelectedPeriod] = useState<PlanPeriod>('yearly');

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

    const calculateAmount = () => {
        let basePrice = 0;
        if (selectedTier === 'premium') {
            basePrice = selectedPeriod === 'monthly' ? 100 : 500;
        } else {
            basePrice = selectedPeriod === 'monthly' ? 200 : 1000;
        }
        // Adding VAT %20
        return basePrice * 1.20;
    };

    const handleNotifyPayment = async () => {
        if (!senderName.trim()) {
            alert('Lütfen gönderen adını giriniz.');
            return;
        }
        if (!restaurantId) return;

        setNotifLoading(true);
        const amount = calculateAmount();
        const planKey = `${selectedTier}_${selectedPeriod}`; // e.g., premium_monthly

        try {
            const { error } = await supabase
                .from('payment_notifications')
                .insert({
                    restaurant_id: restaurantId,
                    plan_type: planKey,
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
                                background: currentPlan === 'plusimum' ? '#DEF7EC' : currentPlan === 'premium' ? '#E0F2FE' : '#FEF3C7',
                                color: currentPlan === 'plusimum' ? '#03543F' : currentPlan === 'premium' ? '#0369A1' : '#92400E',
                                borderRadius: '20px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                textTransform: 'capitalize'
                            }}>
                                {currentPlan}
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
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#374151' }}>Paket Yükseltme</h3>

                {/* Tabs for Tier */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <button
                        onClick={() => setSelectedTier('plusimum')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: selectedTier === 'plusimum' ? '#2563EB' : 'white',
                            color: selectedTier === 'plusimum' ? 'white' : '#374151',
                            border: selectedTier === 'plusimum' ? 'none' : '1px solid #E5E7EB',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: selectedTier === 'plusimum' ? '0 10px 15px -3px rgba(37, 99, 235, 0.3)' : 'none',
                            position: 'relative'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-10px', right: '10px', background: '#F59E0B', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>ÖNERİLEN</div>
                        <div style={{ fontSize: '1.1rem' }}>PLUSIMUM</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Markalı Site & Subdomain</div>
                    </button>
                    <button
                        onClick={() => setSelectedTier('premium')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: selectedTier === 'premium' ? '#111827' : 'white',
                            color: selectedTier === 'premium' ? 'white' : '#374151',
                            border: selectedTier === 'premium' ? 'none' : '1px solid #E5E7EB',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        <div style={{ fontSize: '1.1rem' }}>PREMIUM</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Temel Dijital Menü</div>
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {/* Monthly Option */}
                    <div
                        onClick={() => setSelectedPeriod('monthly')}
                        style={{
                            background: selectedPeriod === 'monthly' ? '#EFF6FF' : 'white',
                            border: `2px solid ${selectedPeriod === 'monthly' ? '#2563EB' : 'var(--border-color)'}`,
                            borderRadius: '12px',
                            padding: '24px',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aylık Ödeme</h3>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563EB' }}>
                                {selectedTier === 'plusimum' ? '200' : '100'} TL
                            </div>
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>+ KDV</div>
                    </div>

                    {/* Yearly Option */}
                    <div
                        onClick={() => setSelectedPeriod('yearly')}
                        style={{
                            background: selectedPeriod === 'yearly' ? '#EFF6FF' : 'white',
                            border: `2px solid ${selectedPeriod === 'yearly' ? '#2563EB' : 'var(--border-color)'}`,
                            borderRadius: '12px',
                            padding: '24px',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Yıllık Ödeme</h3>
                            <div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563EB' }}>
                                    {selectedTier === 'plusimum' ? '1000' : '500'} TL
                                </div>
                            </div>
                        </div>
                        <div style={{ color: '#10B981', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                            2 Ay Bedava!
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>+ KDV</div>
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
                            <p><strong>Toplam Tutar:</strong> <span style={{ fontSize: '1.2rem', color: '#2563EB', fontWeight: 'bold' }}>{calculateAmount()} TL</span> (KDV Dahil)</p>
                            <p style={{ marginTop: '12px', fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic' }}>
                                Not: Açıklama kısmına işletme adınızı yazınız.
                            </p>
                        </div>
                    </div>

                    {/* Notification Form */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Ödeme Bildirimi</h4>

                        <div className="form-group">
                            <label className="form-label">Seçilen Paket</label>
                            <div style={{ padding: '12px', background: '#F3F4F6', borderRadius: '8px', fontWeight: 500, border: '1px solid #E5E7EB' }}>
                                <div style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{selectedTier} - {selectedPeriod === 'monthly' ? 'Aylık' : 'Yıllık'}</div>
                                <div style={{ color: '#2563EB' }}>{calculateAmount()} TL <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>(Ödenecek Tutar)</span></div>
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
