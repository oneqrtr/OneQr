'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';

interface Order {
    id: string;
    table_number?: number | null;
    total_amount: number;
    status: string;
    payment_method?: string;
}

export default function ReportPage() {
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [tableCount, setTableCount] = useState(10);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [orders, setOrders] = useState<Order[]>([]);

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
                .select('id, table_count')
                .eq('owner_id', user.id)
                .single();

            if (restError || !rest) {
                setLoading(false);
                return;
            }

            setRestaurantId(rest.id);
            setTableCount(Math.max(1, rest.table_count ?? 10));

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: ordersData } = await supabase
                .from('orders')
                .select('id, table_number, total_amount, status, payment_method')
                .eq('restaurant_id', rest.id)
                .eq('source', 'restaurant')
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString());

            setOrders(ordersData || []);
            setLoading(false);
        };

        fetchData();
    }, [selectedDate]);

    const tableStats: { tableNum: number; count: number; total: number }[] = [];
    for (let t = 1; t <= tableCount; t++) {
        const list = orders.filter((o) => (o.table_number ?? 0) === t);
        tableStats.push({
            tableNum: t,
            count: list.length,
            total: list.reduce((sum, o) => sum + o.total_amount, 0)
        });
    }

    const otherOrders = orders.filter((o) => {
        const tn = o.table_number ?? 0;
        return tn < 1 || tn > tableCount;
    });
    const grandTotal = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalCount = orders.length;

    const paymentBreakdown: Record<string, number> = {};
    orders.forEach((o) => {
        const method = o.payment_method === 'credit_card' ? 'credit_card' : o.payment_method === 'cash' ? 'cash' : 'other';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + o.total_amount;
    });
    const cashTotal = paymentBreakdown.cash || 0;
    const cardTotal = paymentBreakdown.credit_card || 0;
    const otherPaymentTotal = paymentBreakdown.other || 0;

    return (
        <>
            <Topbar title="Restoran Raporu" />
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>Restoran Raporu</h1>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                        <button
                            type="button"
                            onClick={() => setSelectedDate((d) => { const x = new Date(d); x.setDate(x.getDate() - 1); return x; })}
                            style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#6B7280' }}
                        >
                            <i className="fa-solid fa-chevron-left" />
                        </button>
                        <div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.9rem', color: '#374151', minWidth: '140px', textAlign: 'center' }}>
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
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Toplam Sipariş</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>{totalCount}</div>
                            </div>
                            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Günlük Ciro</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>{grandTotal.toLocaleString('tr-TR')} ₺</div>
                            </div>
                            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Nakit satış</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>{cashTotal.toLocaleString('tr-TR')} ₺</div>
                            </div>
                            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Kart satışı</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D4ED8' }}>{cardTotal.toLocaleString('tr-TR')} ₺</div>
                            </div>
                            {otherPaymentTotal > 0 && (
                                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Diğer ödeme</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6B7280' }}>{otherPaymentTotal.toLocaleString('tr-TR')} ₺</div>
                                </div>
                            )}
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#374151' }}>
                                Masa Bazlı Özet
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Masa</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Sipariş Sayısı</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Toplam Tutar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableStats.map((row) => (
                                        <tr key={row.tableNum} style={{ borderTop: '1px solid #F3F4F6' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827' }}>Masa {row.tableNum}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{row.count}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{row.total.toLocaleString('tr-TR')} ₺</td>
                                        </tr>
                                    ))}
                                    {otherOrders.length > 0 && (
                                        <tr style={{ borderTop: '1px solid #F3F4F6' }}>
                                            <td style={{ padding: '12px 16px', color: '#6B7280' }}>Diğer</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{otherOrders.length}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                                                {otherOrders.reduce((s, o) => s + o.total_amount, 0).toLocaleString('tr-TR')} ₺
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: '#F0FDF4', borderTop: '2px solid #059669' }}>
                                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#111827' }}>Toplam</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>{totalCount}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>{grandTotal.toLocaleString('tr-TR')} ₺</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
