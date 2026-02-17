'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import Topbar from '@/components/Topbar';

interface OrderItem {
    id?: string;
    name: string;
    quantity: number;
    price: number;
    variantName?: string;
    selected_variants?: { id?: string; name: string; price?: number }[];
    excluded_ingredients?: string[];
}

interface Order {
    id: string;
    restaurant_id: string;
    source?: string;
    table_number?: number | null;
    customer_name: string;
    customer_phone?: string;
    address_detail?: string;
    items: OrderItem[];
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
}

export default function TablesPage() {
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [tableCount, setTableCount] = useState(10);
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

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
                .select('id, name, slug, table_count')
                .eq('owner_id', user.id)
                .single();

            if (restError || !rest) {
                setLoading(false);
                return;
            }

            setRestaurantId(rest.id);
            setRestaurantName(rest.name || '');
            setRestaurantSlug(rest.slug || '');
            setTableCount(Math.max(1, rest.table_count ?? 10));

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: ordersData } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', rest.id)
                .eq('source', 'restaurant')
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: false });

            setOrders(ordersData || []);
            setLoading(false);
        };

        fetchData();
    }, [selectedDate]);

    const openOrdersByTable: Record<number, Order[]> = {};
    const closedOrdersByTable: Record<number, Order[]> = {};
    for (let t = 1; t <= tableCount; t++) {
        openOrdersByTable[t] = [];
        closedOrdersByTable[t] = [];
    }
    orders.forEach((o) => {
        const tn = o.table_number != null ? o.table_number : 0;
        if (tn >= 1 && tn <= tableCount) {
            if (o.status === 'pending') openOrdersByTable[tn].push(o);
            else closedOrdersByTable[tn].push(o);
        }
    });

    const getPaymentLabel = (method: string) => {
        if (method === 'cash') return 'Nakit';
        if (method === 'credit_card') return 'Kredi Kartı';
        if (method.startsWith('meal_card')) return 'Yemek Kartı';
        return method;
    };

    const printOrder = (order: Order) => {
        const iframe = printFrameRef.current;
        if (!iframe?.contentWindow?.document) return;

        const dateStr = new Date(order.created_at).toLocaleString('tr-TR');
        let items: any[] = [];
        if (typeof order.items === 'string') {
            try { items = JSON.parse(order.items); } catch { }
        } else if (Array.isArray(order.items)) items = order.items;

        const dashLine = '------------------------------------------------';
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html><head><title>Sipariş Fişi</title>
            <style>
                @page { size: 80mm auto; margin: 0mm; }
                body { width: 80mm; margin: 0 auto; padding: 5px; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px; }
                .center { text-align: center; }
                .separator { white-space: pre; margin: 5px 0; }
                .rest-name { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 10px 0; }
                .product-row { display: flex; font-size: 18px; margin-bottom: 4px; }
                .col-qty { width: 20%; }
                .col-name { width: 55%; }
                .col-price { width: 25%; text-align: right; }
                .receipt-extra { font-size: 18px; font-style: italic; margin-top: 2px; }
                .total-row { display: flex; justify-content: space-between; font-size: 26px; font-weight: 900; margin-top: 10px; }
                .footer { margin-top: 20px; text-align: center; font-size: 12px; }
            </style></head><body>
            <div class="center">OneQR - Menü Sistemleri</div>
            <div class="center separator">${dashLine}</div>
            <div class="center rest-name">${restaurantName}</div>
            <div class="center separator">${dashLine}</div>
            <div><strong>Masa: ${order.table_number ?? '-'}</strong></div>
            <div>${order.customer_name}</div>
            ${order.customer_phone ? `<div>Tel: ${order.customer_phone}</div>` : ''}
            <div class="center separator">${dashLine}</div>
            <div class="product-row" style="border-bottom:1px solid #000;padding-bottom:2px;">
                <div class="col-qty">Adet</div><div class="col-name">Ürün</div><div class="col-price">Tutar</div>
            </div>
            ${items.map((item: any) => {
                const v = item.selected_variants?.map((x: { name: string }) => x.name).join(', ') || item.variantName || '';
                const ex = item.excluded_ingredients?.join(', ') || '';
                return `<div class="product-row"><div class="col-qty">${item.quantity}</div><div class="col-name">${item.name}${v ? `<div class="receipt-extra">+ ${v}</div>` : ''}${ex ? `<div class="receipt-extra">Çıkar: ${ex}</div>` : ''}</div><div class="col-price">${item.price * item.quantity} ₺</div></div>`;
            }).join('')}
            <div class="center separator">${dashLine}</div>
            <div class="total-row"><span>TOPLAM</span><span>${order.total_amount} ₺</span></div>
            <div class="center separator">${dashLine}</div>
            <div>ÖDEME: ${getPaymentLabel(order.payment_method).toUpperCase()}</div>
            <div class="footer">${dateStr}</div>
            </body></html>
        `);
        doc.close();
        setTimeout(() => iframe.contentWindow?.print(), 500);
    };

    const closeOrder = async (order: Order) => {
        if (!confirm('Bu siparişi kapatmak istediğinize emin misiniz? (Ödeme alındı)')) return;
        const supabase = createClient();
        const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id);
        if (error) {
            alert('Güncelleme hatası: ' + error.message);
            return;
        }
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'completed' } : o)));
    };

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <Topbar title="Restoran Siparişleri" />
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>Masalar</h1>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                        <button
                            type="button"
                            onClick={() => setSelectedDate((d) => { const x = new Date(d); x.setDate(x.getDate() - 1); return x; })}
                            style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#6B7280' }}
                        >
                            <i className="fa-solid fa-chevron-left" />
                        </button>
                        <div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.9rem', color: '#374151', minWidth: '120px', textAlign: 'center' }}>
                            {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedDate((d) => { const x = new Date(d); x.setDate(x.getDate() + 1); return x; })}
                            style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#6B7280' }}
                        >
                            <i className="fa-solid fa-chevron-right" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div>Yükleniyor...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNum) => {
                            const openList = openOrdersByTable[tableNum] || [];
                            const closedList = closedOrdersByTable[tableNum] || [];
                            return (
                                <div
                                    key={tableNum}
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        border: '1px solid #E5E7EB',
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div style={{ background: '#059669', color: 'white', padding: '12px 16px', fontWeight: 700, fontSize: '1.1rem' }}>
                                        Masa {tableNum}
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        {openList.length === 0 && closedList.length === 0 ? (
                                            <div style={{ color: '#9CA3AF', fontSize: '0.9rem', padding: '12px 0' }}>Sipariş yok</div>
                                        ) : (
                                            <>
                                                {openList.map((order) => (
                                                    <div
                                                        key={order.id}
                                                        style={{
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px',
                                                            padding: '12px',
                                                            marginBottom: '10px',
                                                            background: '#F0FDF4'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600, color: '#111827' }}>{order.customer_name}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                                                            {formatTime(order.created_at)} · {order.total_amount} ₺
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '6px' }}>
                                                            {order.items.map((it: OrderItem) => `${it.quantity}x ${it.name}`).join(', ')}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => printOrder(order)}
                                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                <i className="fa-solid fa-print" style={{ marginRight: '4px' }} /> Yazdır
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => closeOrder(order)}
                                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#059669', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                Siparişi Kapat
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {closedList.length > 0 && (
                                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #E5E7EB' }}>
                                                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '6px' }}>Kapatılan siparişler</div>
                                                        {closedList.map((order) => (
                                                            <div key={order.id} style={{ fontSize: '0.85rem', color: '#6B7280', padding: '6px 0' }}>
                                                                {order.customer_name} · {order.total_amount} ₺ · {formatTime(order.created_at)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <iframe ref={printFrameRef} style={{ width: 0, height: 0, position: 'absolute', border: 'none', visibility: 'hidden' }} title="print" />
            </div>
        </>
    );
}
