'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
    source?: string; // 'system' | 'restaurant' | 'qr' etc.
    customer_name: string;
    customer_phone?: string;
    address_type?: string;
    address_detail?: string;
    location_lat?: number;
    location_lng?: number;
    order_number?: number;
    customer_order_count?: number;
    building_number?: string;
    items: OrderItem[];
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    rejection_reason?: string | null;
    order_note?: string | null;
    neighborhood?: string;
    street?: string;
    apartment?: string;
    floor?: string;
    door_number?: string;
    block?: string;
    site_name?: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Settings State
    // Settings State
    const [printerHeader, setPrinterHeader] = useState('');
    const [printerFooter, setPrinterFooter] = useState('');
    const [printerCopyCount, setPrinterCopyCount] = useState(1);
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [orderToClose, setOrderToClose] = useState<Order | null>(null);
    const [orderToReject, setOrderToReject] = useState<Order | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectReasonCustom, setRejectReasonCustom] = useState('');

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
                    .select('id, name, slug, printer_header, printer_footer, printer_copy_count, whatsapp_number')
                    .eq('owner_id', user.id)
                    .single();

                if (restError || !rest) {
                    console.error("Restoran bilgisi çekilemedi:", restError);
                    setLoading(false);
                    return;
                }
                restId = rest.id;
                setRestaurantId(rest.id);
                setRestaurantName(rest.name || '');
                setRestaurantSlug(rest.slug || '');
                setPrinterHeader(rest.printer_header || '');
                setPrinterFooter(rest.printer_footer || '');
                setPrinterHeader(rest.printer_header || '');
                setPrinterFooter(rest.printer_footer || '');
                setPrinterCopyCount(rest.printer_copy_count || 1);
                setWhatsappNumber(rest.whatsapp_number || '');
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
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    const printOrder = (order: Order) => {
        const iframe = printFrameRef.current;
        if (!iframe) return;

        const dateStr = new Date(order.created_at).toLocaleString('tr-TR');

        let items: any[] = [];
        if (typeof order.items === 'string') {
            try { items = JSON.parse(order.items); } catch (e) { }
        } else if (Array.isArray(order.items)) {
            items = order.items;
        }

        const dashLine = "------------------------------------------------";

        // Payment Method Label Helper
        const getPaymentLabel = (method: string) => {
            if (method === 'cash') return 'Nakit';
            if (method === 'credit_card') return 'Kredi Kartı';
            if (method.startsWith('meal_card')) return `Yemek Kartı (${method.replace('meal_card_', '')})`;
            if (method === 'iban') return 'IBAN';
            return method;
        };

        // Address Construction
        let addressBlock = '';
        const addLine = (text: string) => { if (text) addressBlock += `<div>${text}</div>`; };

        addLine(`${order.neighborhood || ''} Mah. ${order.street || ''} Sok.`);
        if (order.site_name || order.block) addLine(`${order.site_name || ''} Sit. ${order.block || ''} Blok`);

        let buildingLine = '';
        if (order.building_number) buildingLine += `No:${order.building_number} `; // Note: check field mapping, usually it's building_number but interface says apartment for name maybe? DB schema: apartment -> apartment name, building_number -> No?
        // In the interface defined at top: apartment, door_number, floor.
        // Let's stick to the interface properties: apartment, door_number, floor.
        // If the user entered "Apartman Adı" into `apartment` and "Bina No" elsewhere...
        // Let's look at the Order interface again in file...
        // It has `apartment`, `door_number`, `floor`.
        // The menu page sends: `fullAddress` string to `address_detail`.
        // AND it sends structured data if the columns exist in DB.
        // If the admin page relies on `address_detail` it's safest for now.
        // The USER said "Müşteri: ... Şirinyalı ... (1. Çınar Apt.) ...".
        // Let's prefer `address_detail` if available because it is the constructed full string from the menu page.

        // Actually, let's use the structured fields if possible, but fallback to address_detail which is guaranteed to be full.
        // Menu page code: `address_detail: fullAddress`
        // So `address_detail` column HAS the full formatted address.
        // The admin page shows `order.address_detail`.

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Sipariş Fişi</title>
                <style>
                    @page { size: 80mm auto; margin: 0mm; }
                    body {
                        width: 80mm;
                        margin: 0 auto;
                        padding: 5px;
                        font-family: 'Courier New', Courier, monospace;
                        font-weight: bold;
                        color: black;
                        font-size: 16px;
                    }
                    .center { text-align: center; }
                    .left { text-align: left; }
                    .right { text-align: right; }
                    .bold { font-weight: 900; }
                    .separator { white-space: pre; overflow: hidden; margin: 5px 0; font-weight: normal; }
                    
                    .header-title { font-size: 14px; margin-bottom: 5px; font-weight: bold; }
                    .rest-name { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 10px 0; line-height: 1.2; }
                    
                    .customer-block { font-size: 18px; font-weight: bold; line-height: 1.3; text-align: left; }
                    .customer-label { font-size: 16px; text-decoration: underline; margin-bottom: 5px; display: block; }
                    
                    .product-row { display: flex; font-size: 18px; font-weight: bold; margin-bottom: 4px; }
                    .col-qty { width: 20%; text-align: left; }
                    .col-name { width: 55%; text-align: left; }
                    .col-price { width: 25%; text-align: right; }
                    .receipt-extra { font-size: 18px; font-weight: bold; font-style: italic; margin-top: 2px; line-height: 1.2; }
                    .receipt-excluded { color: #000; font-style: normal; }
                    
                    .total-row { display: flex; justify-content: space-between; font-size: 26px; font-weight: 900; margin-top: 10px; }
                    .payment-row { display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; margin-top: 5px; }
                    
                    .footer { margin-top: 20px; text-align: center; }
                    .qr-wrap { position: relative; width: 120px; height: 120px; margin: 10px auto; }
                    .qr-wrap .qr-img { width: 100%; height: 100%; display: block; }
                    .qr-wrap .qr-logo { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; object-fit: contain; background: white; padding: 4px; box-sizing: border-box; }
                    .footer-text { font-size: 12px; margin-top: 2px; font-weight: normal; }
                </style>
            </head>
            <body>
                 <div class="center header-title">OneQR - Menü Sistemleri</div>
                 <div class="center separator">${dashLine}</div>
                 
                 <div class="center rest-name">${restaurantName}</div>
                 
                 <div class="center separator">${dashLine}</div>
                 
                 <div class="customer-block">
                    <span class="customer-label">MÜŞTERİ BİLGİLERİ</span>
                    <div>${order.customer_name}</div>
                    ${order.customer_phone ? `<div>Tel: ${order.customer_phone}</div>` : ''}
                    <div style="margin-top: 5px; font-weight: normal;">
                        ${order.address_detail || 'Adres detayı yok'}
                    </div>
                 </div>
                 
                 <div class="center separator">${dashLine}</div>
                 
                 <div class="product-row" style="font-size: 16px; border-bottom: 1px solid black; padding-bottom: 2px;">
                    <div class="col-qty">Adet</div>
                    <div class="col-name">Ürün</div>
                    <div class="col-price">Tutar</div>
                </div>
                
                ${items.map((item: any) => {
                    const variants = item.selected_variants && item.selected_variants.length > 0 ? item.selected_variants.map((v: { name: string }) => v.name).join(', ') : item.variantName || '';
                    const excluded = item.excluded_ingredients && item.excluded_ingredients.length > 0 ? item.excluded_ingredients.join(', ') : '';
                    return `
                    <div class="product-row">
                        <div class="col-qty">${item.quantity}</div>
                        <div class="col-name">
                            ${item.name}
                            ${variants ? `<div class="receipt-extra">+ ${variants}</div>` : ''}
                            ${excluded ? `<div class="receipt-extra receipt-excluded">Çıkar: ${excluded}</div>` : ''}
                        </div>
                        <div class="col-price">${item.price * item.quantity} ₺</div>
                    </div>
                `;
                }).join('')}
                ${order.order_note ? `<div class="center separator">${dashLine}</div><div style="font-size: 16px; text-align: left;">Not: ${order.order_note}</div>` : ''}
                
                <div class="center separator">${dashLine}</div>
                
                <div class="total-row">
                    <span>TOPLAM</span>
                    <span>${order.total_amount} ₺</span>
                </div>
                
                <div class="center separator">${dashLine}</div>
                
                <div class="payment-row">
                    <span>ÖDEME: ${getPaymentLabel(order.payment_method).toUpperCase()}</span>
                </div>
                <div class="center separator">${dashLine}</div>
                
                <div class="footer">
                    <div style="font-size: 18px; font-weight: 900;">OneQR.tr</div>
                    <div class="qr-wrap">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=H&data=${encodeURIComponent(restaurantSlug ? `https://${restaurantSlug}.oneqr.tr` : 'https://oneqr.tr')}" class="qr-img" alt="QR Code" />
                        <img src="/oneqr-logo.png" class="qr-logo" alt="OneQR" />
                    </div>
                    <div class="footer-text">oneqr.tr ile oluşturuldu</div>
                    <div class="footer-text">${dateStr}</div>
                </div>
            </body>
            </html>
        `);
        doc.close();

        // Slight delay to ensure content loading/rendering before print (especially images)
        setTimeout(() => {
            iframe.contentWindow?.print();
        }, 500);
    };

    const handleAutoPrint = (order: Order) => {
        printOrder(order);
    };

    const handlePrintClick = (order: Order) => {
        printOrder(order);
    };

    const handleSendLocation = (order: Order) => {
        if (!order.location_lat || !order.location_lng) return;

        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${order.location_lat},${order.location_lng}`;

        // Helper to format payment method
        const getPaymentLabel = (method: string) => {
            if (method === 'cash') return 'Nakit';
            if (method === 'credit_card') return 'Kredi Kartı';
            if (method.startsWith('meal_card')) return `Yemek Kartı (${method.replace('meal_card_', '')})`;
            if (method === 'iban') return 'IBAN / Havale';
            return method;
        };

        let message = `Müşteri:\n`;
        message += `${order.customer_name}\n`;
        message += `${order.customer_phone || ''}\n`;

        // Address Lines
        let addressLine1 = '';
        if (order.neighborhood) addressLine1 += `${order.neighborhood} `;
        if (order.street) addressLine1 += `${order.street}`;
        if (addressLine1.trim()) message += `${addressLine1.trim()}\n`;

        let addressLine2 = '';
        if (order.site_name) addressLine2 += `${order.site_name} `;
        if (order.block) addressLine2 += `${order.block} `;
        if (order.apartment) addressLine2 += `${order.apartment} `;
        if (order.floor) addressLine2 += `Kat:${order.floor} `;
        if (order.door_number) addressLine2 += `No:${order.door_number}`;
        if (addressLine2.trim()) message += `${addressLine2.trim()}\n`;

        // Fallback or extra detail
        if (order.address_detail && !addressLine1 && !addressLine2) {
            message += `${order.address_detail}\n`;
        }

        if (order.location_lat && order.location_lng) {
            message += `(Konum Paylaşıldı)\n`;
            message += `${mapsLink}\n`;
        }

        message += `Adet Ürün Tutar\n`;

        let items: any[] = [];
        if (typeof order.items === 'string') {
            try { items = JSON.parse(order.items); } catch (e) { }
        } else if (Array.isArray(order.items)) {
            items = order.items;
        }

        items.forEach((item: any) => {
            const variants = item.selected_variants?.map((v: { name: string }) => v.name).join(', ') || item.variantName || '';
            const excluded = item.excluded_ingredients?.length ? ` [Çıkar: ${item.excluded_ingredients.join(', ')}]` : '';
            message += `${item.quantity}x ${item.name}${variants ? ` (+${variants})` : ''}${excluded} ${item.price * item.quantity} ₺\n`;
        });

        message += `TOPLAM: ${order.total_amount} ₺\n`;
        message += `Ödeme: ${getPaymentLabel(order.payment_method)}`;

        // Send to self (the restaurant owner's number)
        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    const closeOrder = (order: Order) => setOrderToClose(order);
    const openRejectModal = (order: Order) => {
        setOrderToReject(order);
        setRejectReason('');
        setRejectReasonCustom('');
    };

    const confirmCloseWithPayment = async (paymentMethod: 'cash' | 'credit_card') => {
        if (!orderToClose) return;
        const supabase = createClient();
        const { error } = await supabase
            .from('orders')
            .update({ status: 'completed', payment_method: paymentMethod })
            .eq('id', orderToClose.id);
        if (error) {
            alert('Güncelleme hatası: ' + error.message);
            return;
        }
        setOrders((prev) => prev.map((o) => (o.id === orderToClose.id ? { ...o, status: 'completed', payment_method: paymentMethod } : o)));
        setOrderToClose(null);
    };

    const approveOrder = async (order: Order) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('orders')
            .update({ status: 'processing' })
            .eq('id', order.id);
        if (error) {
            alert('Güncelleme hatası: ' + error.message);
            return;
        }
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'processing' } : o)));
    };

    const rejectOrder = async () => {
        if (!orderToReject) return;
        const reason = rejectReason === 'other' ? rejectReasonCustom : rejectReason;
        const supabase = createClient();
        const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled', rejection_reason: reason || null })
            .eq('id', orderToReject.id);
        if (error) {
            alert('Güncelleme hatası: ' + error.message);
            return;
        }
        setOrders((prev) => prev.map((o) => (o.id === orderToReject.id ? { ...o, status: 'cancelled', rejection_reason: reason || null } : o)));
        setOrderToReject(null);
        setRejectReason('');
        setRejectReasonCustom('');
    };

    const externalOrders = orders.filter(o => o.source === 'online');
    const REJECT_REASONS = [
        { value: 'stock', label: 'Stok yok' },
        { value: 'capacity', label: 'Kapasite dolu' },
        { value: 'address', label: 'Adres teslimat dışı' },
        { value: 'closed', label: 'İşletme kapalı' },
        { value: 'other', label: 'Diğer' }
    ];

    const renderOrderCard = (order: Order) => (
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
                        {order.order_number && (
                            <span style={{ color: '#F59E0B', marginRight: '8px' }}>#{order.order_number}</span>
                        )}
                        {order.customer_name}
                        {order.customer_order_count && (
                            <span style={{ fontWeight: 400, color: '#6B7280', fontSize: '0.9rem', marginLeft: '6px' }}>
                                ({order.customer_order_count})
                            </span>
                        )}
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
                        background: order.status === 'pending' ? '#FEF3C7' : order.status === 'processing' ? '#DBEAFE' : order.status === 'cancelled' ? '#FEE2E2' : '#ECFDF5',
                        color: order.status === 'pending' ? '#B45309' : order.status === 'processing' ? '#1D4ED8' : order.status === 'cancelled' ? '#DC2626' : '#047857',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-block', marginTop: '4px'
                    }}>
                        {order.status === 'pending' ? 'Beklemede' : order.status === 'processing' ? 'Onaylandı' : order.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
                    </div>
                    {order.status !== 'cancelled' && (
                        <div style={{
                            background: order.payment_method === 'cash' ? '#ECFDF5' : '#EFF6FF',
                            color: order.payment_method === 'cash' ? '#047857' : '#1D4ED8',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-block', marginTop: '4px', marginLeft: '4px'
                        }}>
                            {order.payment_method === 'cash' ? 'Nakit' : 'Kredi Kartı'}
                        </div>
                    )}
                </div>
            </div>
            {order.status === 'cancelled' && order.rejection_reason && (
                <div style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#B91C1C' }}>
                    <i className="fa-solid fa-times-circle" style={{ marginRight: '8px' }} /> Red sebebi: {REJECT_REASONS.find(r => r.value === order.rejection_reason)?.label || order.rejection_reason}
                </div>
            )}

            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '8px' }}>Sipariş Detayı</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.items.map((item: OrderItem, idx: number) => (
                        <div key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '8px 10px', borderRadius: '6px', fontSize: '0.9rem', color: '#374151' }}>
                            <div>
                                <strong style={{ color: '#111827' }}>{item.quantity}x</strong> {item.name}
                                {(item.selected_variants && item.selected_variants.length > 0) || (item.variantName) ? (
                                    <span style={{ fontStyle: 'italic', color: '#059669' }}> + {item.selected_variants?.map((v: { name: string }) => v.name).join(', ') || item.variantName}</span>
                                ) : null}
                            </div>
                            {item.excluded_ingredients && item.excluded_ingredients.length > 0 && (
                                <div style={{ fontSize: '0.8rem', color: '#DC2626', marginTop: '4px' }}>
                                    Çıkar: {item.excluded_ingredients.join(', ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {order.order_note && (
                    <div style={{ marginTop: '10px', padding: '8px 10px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '0.9rem', color: '#92400E' }}>
                        <strong>Not:</strong> {order.order_note}
                    </div>
                )}
            </div>

            <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', color: '#4B5563' }}>
                <i className="fa-solid fa-location-dot" style={{ marginRight: '8px', color: '#EF4444' }}></i>
                {order.location_lat != null && order.location_lng != null ? (
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${order.location_lat},${order.location_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563EB', fontWeight: 500, textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        {order.address_detail || 'Konuma git'}
                    </a>
                ) : (
                    order.address_detail
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                {order.status !== 'cancelled' && (
                    <button
                        onClick={() => handlePrintClick(order)}
                        style={{
                            background: 'white', border: '1px solid #D1D5DB', padding: '10px 20px', borderRadius: '8px',
                            color: '#374151', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <i className="fa-solid fa-print"></i> Yazdır
                    </button>
                )}

                {order.status === 'pending' && (
                    <>
                        <button
                            onClick={() => approveOrder(order)}
                            style={{
                                background: '#059669', border: 'none', padding: '10px 20px', borderRadius: '8px',
                                color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <i className="fa-solid fa-check"></i> Onayla
                        </button>
                        <button
                            onClick={() => openRejectModal(order)}
                            style={{
                                background: '#DC2626', border: 'none', padding: '10px 20px', borderRadius: '8px',
                                color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <i className="fa-solid fa-times"></i> Reddet
                        </button>
                    </>
                )}

                {order.status === 'processing' && (
                    <button
                        onClick={() => closeOrder(order)}
                        style={{
                            background: '#059669', border: 'none', padding: '10px 20px', borderRadius: '8px',
                            color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <i className="fa-solid fa-check"></i> Siparişi Kapat
                    </button>
                )}

                {order.location_lat && order.location_lng && order.status !== 'cancelled' && (
                    <button
                        onClick={() => handleSendLocation(order)}
                        style={{
                            background: '#25D366', border: 'none', padding: '10px 20px', borderRadius: '8px',
                            color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <i className="fa-brands fa-whatsapp"></i> Konum Gönder
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>Online Sipariş</h1>

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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {externalOrders.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#6B7280' }}>
                            Bu tarihte sipariş bulunmuyor.
                        </div>
                    ) : (
                        externalOrders.map(renderOrderCard)
                    )}
                </div>
            )}

            {/* Ödeme yöntemi seç modal - Siparişi kapat */}
            {orderToClose && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => setOrderToClose(null)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            maxWidth: '360px',
                            width: '100%',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>Siparişi kapat</div>
                        <div style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '16px' }}>
                            {orderToClose.customer_name} · {orderToClose.total_amount} ₺ — Ödeme nasıl alındı?
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => confirmCloseWithPayment('cash')}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: '#ECFDF5',
                                    color: '#047857',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                <i className="fa-solid fa-money-bill-wave" style={{ marginRight: '8px' }} /> Nakit
                            </button>
                            <button
                                type="button"
                                onClick={() => confirmCloseWithPayment('credit_card')}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: '#EFF6FF',
                                    color: '#1D4ED8',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                <i className="fa-solid fa-credit-card" style={{ marginRight: '8px' }} /> Kart
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOrderToClose(null)}
                            style={{
                                marginTop: '12px',
                                width: '100%',
                                padding: '10px',
                                background: 'transparent',
                                border: 'none',
                                color: '#6B7280',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            İptal
                        </button>
                    </div>
                </div>
            )}

            {/* Reddet modal */}
            {orderToReject && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => setOrderToReject(null)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            maxWidth: '400px',
                            width: '100%',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Siparişi reddet</div>
                        <div style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '16px' }}>
                            {orderToReject.customer_name} · {orderToReject.total_amount} ₺
                        </div>
                        <div style={{ marginBottom: '12px', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Red sebebi (opsiyonel)</div>
                        <select
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '8px', fontSize: '0.9rem' }}
                        >
                            <option value="">Seçin...</option>
                            {REJECT_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        {rejectReason === 'other' && (
                            <input
                                type="text"
                                placeholder="Sebep yazın"
                                value={rejectReasonCustom}
                                onChange={(e) => setRejectReasonCustom(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '12px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                            />
                        )}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => { setOrderToReject(null); setRejectReason(''); setRejectReasonCustom(''); }}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Vazgeç
                            </button>
                            <button
                                type="button"
                                onClick={rejectOrder}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#DC2626', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print functionality is handled via direct window.print() */}
            <iframe ref={printFrameRef} style={{ width: '0', height: '0', position: 'absolute', border: 'none', visibility: 'hidden' }} />
        </div>
    );
}
