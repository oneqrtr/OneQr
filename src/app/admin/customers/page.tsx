'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';

interface Customer {
    id: string;
    restaurant_id: string;
    name: string;
    phone: string;
    address_detail?: string;
    location_lat?: number;
    location_lng?: number;
    payment_preference?: string;
    notes?: string;
    created_at: string;
}

interface OrderRow {
    id: string;
    customer_name: string;
    customer_phone?: string;
    address_detail?: string;
    items: unknown;
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
}

export default function CustomersPage() {
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [orderHistory, setOrderHistory] = useState<OrderRow[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: rest, error: restError } = await supabase
                .from('restaurants')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (restError || !rest) {
                setLoading(false);
                return;
            }

            setRestaurantId(rest.id);

            const { data: custData } = await supabase
                .from('customers')
                .select('*')
                .eq('restaurant_id', rest.id)
                .order('created_at', { ascending: false });

            setCustomers(custData || []);
            setLoading(false);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedCustomer || !restaurantId) {
            setOrderHistory([]);
            return;
        }
        setLoadingHistory(true);
        const fetchHistory = async () => {
            const supabase = createClient();
            const { data: byId } = await supabase
                .from('orders')
                .select('id, customer_name, customer_phone, address_detail, items, total_amount, payment_method, status, created_at')
                .eq('restaurant_id', restaurantId)
                .eq('customer_id', selectedCustomer.id)
                .order('created_at', { ascending: false })
                .limit(50);
            const { data: byPhone } = await supabase
                .from('orders')
                .select('id, customer_name, customer_phone, address_detail, items, total_amount, payment_method, status, created_at')
                .eq('restaurant_id', restaurantId)
                .eq('customer_phone', selectedCustomer.phone)
                .order('created_at', { ascending: false })
                .limit(50);
            const seen = new Set<string>();
            const merged = [...(byId || []), ...(byPhone || [])].filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);
            setOrderHistory(merged);
            setLoadingHistory(false);
        };
        fetchHistory();
    }, [selectedCustomer, restaurantId]);

    const filteredCustomers = customers.filter(
        c =>
            !searchQuery ||
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone || '').includes(searchQuery)
    );

    const getPaymentLabel = (m: string) => {
        if (m === 'cash') return 'Nakit';
        if (m === 'credit_card') return 'Kredi Kartı';
        return m;
    };

    return (
        <>
            <Topbar title="Müşteriler" />
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>Müşteriler</h1>
                    <input
                        type="text"
                        placeholder="İsim veya telefon ile ara..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', minWidth: '240px', fontSize: '0.9rem' }}
                    />
                </div>

                {loading ? (
                    <div>Yükleniyor...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151' }}>Müşteri Listesi</div>
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {filteredCustomers.length === 0 ? (
                                    <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>Henüz müşteri kaydı yok. Paket siparişi al ekranından yeni müşteri ekleyebilirsiniz.</div>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => setSelectedCustomer(c)}
                                            style={{
                                                padding: '16px',
                                                borderBottom: '1px solid #F3F4F6',
                                                cursor: 'pointer',
                                                background: selectedCustomer?.id === c.id ? '#EFF6FF' : 'white',
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, color: '#111827' }}>{c.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>{c.phone || '-'}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                            {selectedCustomer ? (
                                <>
                                    <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151' }}>
                                        {selectedCustomer.name} — Sipariş Geçmişi
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '16px' }}>
                                            Tel: {selectedCustomer.phone} · Ödeme: {getPaymentLabel(selectedCustomer.payment_preference || 'cash')}
                                            {selectedCustomer.address_detail && <><br />Adres: {selectedCustomer.address_detail}</>}
                                        </div>
                                        {loadingHistory ? (
                                            <div>Yükleniyor...</div>
                                        ) : orderHistory.length === 0 ? (
                                            <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Henüz sipariş yok</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {orderHistory.map(o => {
                                                    const items = Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? (() => { try { return JSON.parse(o.items); } catch { return []; } })() : []);
                                                    const itemStr = (items as { name?: string; quantity?: number }[]).map((i: { name?: string; quantity?: number }) => `${i.quantity || 1}x ${i.name || ''}`).join(', ');
                                                    return (
                                                        <div key={o.id} style={{ padding: '12px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.9rem' }}>
                                                            <div style={{ fontWeight: 600, color: '#111827' }}>{new Date(o.created_at).toLocaleString('tr-TR')}</div>
                                                            <div style={{ color: '#374151', marginTop: '4px' }}>{itemStr}</div>
                                                            <div style={{ color: '#6B7280', marginTop: '4px' }}>{o.total_amount} ₺ · {getPaymentLabel(o.payment_method)} · {o.status}</div>
                                                            {o.address_detail && <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px' }}>{o.address_detail}</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>Detay görmek için bir müşteri seçin</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
