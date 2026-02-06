'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    variantName?: string;
}

interface Order {
    id: string;
    restaurant_id: string;
    customer_name: string;
    customer_phone?: string;
    address_type?: string;
    address_detail?: string;
    location_lat?: number;
    location_lng?: number;
    order_number?: number;
    items: OrderItem[];
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Audio context ref for sound
    const audioContextRef = useRef<AudioContext | null>(null);

    const playNotificationSound = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            // "Din Din" pattern
            const playTone = (freq: number, startTime: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                gain.gain.setValueAtTime(0.5, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.stop(startTime + duration);
            };

            const now = ctx.currentTime;
            playTone(600, now, 0.3);
            setTimeout(() => playTone(800, now + 0.2, 0.4), 200);

        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    useEffect(() => {
        let channel: any = null;

        const fetchOrders = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.error("Kullanıcı oturumu bulunamadı.");
                setLoading(false);
                return;
            }

            // Get Restaurant ID
            let restId = restaurantId;
            if (!restId) {
                const { data: rest, error: restError } = await supabase
                    .from('restaurants')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (restError || !rest) {
                    console.error("Restoran bilgisi çekilemedi:", restError);
                    setLoading(false);
                    return;
                }
                restId = rest.id;
                setRestaurantId(rest.id);
            }

            if (restId) {
                // Calculate Start and End of Selected Date
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);

                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);

                // Fetch orders for the selected date range
                const { data: existingOrders } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', restId)
                    .gte('created_at', startOfDay.toISOString())
                    .lte('created_at', endOfDay.toISOString())
                    .order('created_at', { ascending: false });

                if (existingOrders) {
                    setOrders(existingOrders);
                } else {
                    setOrders([]);
                }

                // Subscribe to Realtime (Only if viewing TODAY)
                if (channel) supabase.removeChannel(channel);

                if (isSameDay(selectedDate, new Date())) {
                    channel = supabase
                        .channel('orders-channel')
                        .on(
                            'postgres_changes',
                            {
                                event: 'INSERT',
                                schema: 'public',
                                table: 'orders',
                                filter: `restaurant_id=eq.${restId}`
                            },
                            (payload) => {
                                const newOrder = payload.new as Order;
                                const orderDate = new Date(newOrder.created_at);
                                // Double check (though DB timezone matches)
                                if (isSameDay(orderDate, new Date())) {
                                    setOrders(prev => [newOrder, ...prev]);
                                    playNotificationSound();
                                    handleAutoPrint(newOrder);
                                }
                            }
                        )
                        .subscribe();
                }
            }

            setLoading(false);
        };

        fetchOrders();

        return () => {
            if (channel) {
                const supabase = createClient();
                supabase.removeChannel(channel);
            }
        };
    }, [selectedDate]); // Refetch when date changes

    const handleAutoPrint = (order: Order) => {
        setPrintingOrder(order);
        // Small delay to allow state update then print
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const handlePrintClick = (order: Order) => {
        setPrintingOrder(order);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    // Print Template Component inside
    const PrintTemplate = ({ order }: { order: Order }) => (
        <div id="print-area" style={{ display: 'none' }}>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { 
                        display: block !important; 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        padding: 20px;
                        font-family: monospace;
                        color: black;
                    }
                    .no-print { display: none; }
                }
            `}</style>
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px dashed black', paddingBottom: '10px' }}>
                <h1 style={{ fontSize: '24px', margin: '0 0 10px' }}>OneQR Menü</h1>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Sipariş Fişi #{order.order_number || '?'}</h2>
                <p style={{ margin: '5px 0' }}>{formatDate(order.created_at)}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>Müşteri:</div>
                <div>{order.customer_name}</div>
                <div>{order.customer_phone}</div>
                <div style={{ marginTop: '5px' }}>{order.address_detail}</div>
                {order.address_type === 'location' && <div>(Konum Paylaşıldı)</div>}
            </div>

            <div style={{ borderBottom: '1px dashed black', marginBottom: '10px' }}></div>

            <table style={{ width: '100%', marginBottom: '20px', fontSize: '14px' }}>
                <thead>
                    <tr style={{ textAlign: 'left' }}>
                        <th>Adet</th>
                        <th>Ürün</th>
                        <th style={{ textAlign: 'right' }}>Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, idx) => (
                        <tr key={idx}>
                            <td style={{ verticalAlign: 'top', width: '40px' }}>{item.quantity}x</td>
                            <td style={{ verticalAlign: 'top' }}>
                                {item.name}
                                {item.variantName && <div style={{ fontSize: '12px' }}>({item.variantName})</div>}
                            </td>
                            <td style={{ verticalAlign: 'top', textAlign: 'right' }}>{item.price * item.quantity} ₺</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderBottom: '1px dashed black', marginBottom: '10px' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                <span>TOPLAM:</span>
                <span>{order.total_amount} ₺</span>
            </div>
            <div style={{ marginTop: '10px', textAlign: 'right' }}>
                Ödeme: {order.payment_method === 'cash' ? 'Nakit' : 'Kredi Kartı'}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>Gelen Siparişler</h1>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                        <button
                            onClick={() => {
                                const prevDay = new Date(selectedDate);
                                prevDay.setDate(prevDay.getDate() - 1);
                                setSelectedDate(prevDay);
                            }}
                            style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', borderRight: '1px solid #E5E7EB', color: '#6B7280' }}
                        >
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.9rem', color: '#374151', minWidth: '120px', textAlign: 'center' }}>
                            {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <button
                            onClick={() => {
                                const nextDay = new Date(selectedDate);
                                nextDay.setDate(nextDay.getDate() + 1);
                                setSelectedDate(nextDay);
                            }}
                            style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', borderLeft: '1px solid #E5E7EB', color: '#6B7280' }}
                        >
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div>Yükleniyor...</div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {orders.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#6B7280' }}>
                            Henüz sipariş bulunmuyor.
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} style={{
                                background: 'white',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '1px solid #E5E7EB',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
                                            <span style={{ color: '#F59E0B', marginRight: '8px' }}>#{order.order_number}</span>
                                            {order.customer_name}
                                        </div>
                                        <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>{formatDate(order.created_at)}</div>
                                        <div style={{ color: '#374151', fontSize: '0.9rem', marginTop: '4px' }}>
                                            <i className="fa-solid fa-phone" style={{ marginRight: '6px', color: '#9CA3AF' }}></i>
                                            {order.customer_phone || '-'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{order.total_amount} ₺</div>
                                        <div style={{
                                            background: order.payment_method === 'cash' ? '#ECFDF5' : '#EFF6FF',
                                            color: order.payment_method === 'cash' ? '#047857' : '#1D4ED8',
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-block', marginTop: '4px'
                                        }}>
                                            {order.payment_method === 'cash' ? 'Nakit' : 'Kredi Kartı'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '8px' }}>Sipariş Detayı</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {order.items.map((item, idx) => (
                                            <span key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '6px 10px', borderRadius: '6px', fontSize: '0.9rem', color: '#374151' }}>
                                                <strong style={{ color: '#111827' }}>{item.quantity}x</strong> {item.name} {item.variantName ? `(${item.variantName})` : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', color: '#4B5563' }}>
                                    <i className="fa-solid fa-location-dot" style={{ marginRight: '8px', color: '#EF4444' }}></i>
                                    {order.address_detail}
                                    {order.address_type === 'location' && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${order.location_lat},${order.location_lng}`}
                                            target="_blank"
                                            style={{ color: '#2563EB', marginLeft: '8px', fontWeight: 500 }}
                                        >
                                            Haritada Gör
                                        </a>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                                    <button
                                        onClick={() => handlePrintClick(order)}
                                        style={{
                                            background: 'white', border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: '8px',
                                            color: '#374151', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        <i className="fa-solid fa-print"></i> Yazdır
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Configured for printing */}
            {printingOrder && <PrintTemplate order={printingOrder} />}
        </div>
    );
}
