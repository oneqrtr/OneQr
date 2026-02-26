'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

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
    table_number?: number | null;
    customer_name: string;
    customer_phone?: string;
    items: OrderItem[];
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    source?: string;
    order_note?: string | null;
}

interface CategoryRow {
    id: string;
    name: string;
    display_order?: number;
}

interface ProductRow {
    id: string;
    category_id: string;
    name: string;
    price: number;
    display_order?: number;
    image_url?: string;
    ingredients?: string[];
}

interface VariantRow {
    id: string;
    product_id: string;
    name: string;
    price: number;
}

export default function GarsonPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<{ id: string; name: string; theme_color?: string; table_count?: number } | null>(null);
    const [tableCount, setTableCount] = useState(10);
    const [orders, setOrders] = useState<Order[]>([]);
    const [tableStatusMap, setTableStatusMap] = useState<Record<number, string>>({});
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [variants, setVariants] = useState<VariantRow[]>([]);
    const [presetOptions, setPresetOptions] = useState<{ id: string; label: string; display_order: number }[]>([]);
    const [masaOrderNote, setMasaOrderNote] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [orderToClose, setOrderToClose] = useState<Order | null>(null);
    const [masaModalOpen, setMasaModalOpen] = useState(false);
    const [selectedTableNum, setSelectedTableNum] = useState<number | null>(null);
    const [masaCart, setMasaCart] = useState<{ product: ProductRow; quantity: number; selectedVariants: VariantRow[]; excludedIngredients: string[]; finalPrice: number }[]>([]);
    // Ödeme yöntemi garson tarafından seçilmez; kasa belirler. API için varsayılan gönderilir.
    const [masaProductModal, setMasaProductModal] = useState<ProductRow | null>(null);
    const [masaTempVariants, setMasaTempVariants] = useState<VariantRow[]>([]);
    const [masaTempExcluded, setMasaTempExcluded] = useState<string[]>([]);
    const [masaPreviewModal, setMasaPreviewModal] = useState(false);
    const [masaSubmitting, setMasaSubmitting] = useState(false);
    const [masaPresetModalOpen, setMasaPresetModalOpen] = useState(false);
    const [masaPresetSelected, setMasaPresetSelected] = useState<Set<string>>(new Set());
    const [masaPendingAdd, setMasaPendingAdd] = useState<{ product: ProductRow; selectedVariants: VariantRow[]; excludedIngredients: string[] } | null>(null);
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    const fetchData = async () => {
        if (!slug) return;
        setLoading(true);
        const dateStr = selectedDate.toISOString().slice(0, 10);
        const res = await fetch(`/api/garson/data?slug=${encodeURIComponent(slug)}&date=${dateStr}`);
        if (res.status === 401) {
            setAuthorized(false);
            setLoading(false);
            return;
        }
        if (!res.ok) {
            setLoading(false);
            return;
        }
        const data = await res.json();
        setRestaurant(data.restaurant);
        setTableCount(data.tableCount || 10);
        setOrders(data.orders || []);
        setTableStatusMap(data.tableStatusMap || {});
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setVariants(data.variants || []);
        setPresetOptions(data.presetOptions || []);
        setAuthorized(true);
        setLoading(false);
    };

    useEffect(() => {
        if (slug) fetchData();
    }, [slug, selectedDate.toISOString().slice(0, 10)]);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPinError('');
        const res = await fetch('/api/garson/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, pin })
        });
        const data = await res.json();
        if (!res.ok) {
            setPinError(data.error || 'Giriş başarısız');
            return;
        }
        setAuthorized(true);
        setPin('');
        fetchData();
    };

    const openOrdersByTable: Record<number, Order[]> = {};
    for (let t = 1; t <= tableCount; t++) openOrdersByTable[t] = [];
    orders.forEach((o) => {
        if (o.source !== 'restaurant') return;
        const tn = o.table_number != null ? o.table_number : 0;
        if (tn >= 1 && tn <= tableCount && o.status === 'pending') {
            openOrdersByTable[tn].push(o);
        }
    });

    const getPaymentLabel = (method: string) => {
        if (method === 'cash') return 'Nakit';
        if (method === 'credit_card') return 'Kredi Kartı';
        return method;
    };

    const printOrder = (order: Order) => {
        const iframe = printFrameRef.current;
        if (!iframe?.contentWindow?.document) return;
        const dateStr = new Date(order.created_at).toLocaleString('tr-TR');
        let items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
        if (typeof order.items === 'string') {
            try { items = JSON.parse(order.items); } catch { }
        }
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
            <div class="center">OneQR - Garson</div>
            <div class="center separator">${dashLine}</div>
            <div class="center rest-name">${restaurant?.name || ''}</div>
            <div class="center separator">${dashLine}</div>
            <div><strong>Masa: ${order.table_number ?? '-'}</strong></div>
            <div>${order.customer_name}</div>
            <div class="center separator">${dashLine}</div>
            <div class="product-row" style="border-bottom:1px solid #000;padding-bottom:2px;">
                <div class="col-qty">Adet</div><div class="col-name">Ürün</div><div class="col-price">Tutar</div>
            </div>
            ${items.map((item: OrderItem) => {
                const v = item.selected_variants?.map((x: { name: string }) => x.name).join(', ') || item.variantName || '';
                const ex = item.excluded_ingredients?.join(', ') || '';
                return `<div class="product-row"><div class="col-qty">${item.quantity}</div><div class="col-name">${item.name}${v ? `<div class="receipt-extra">+ ${v}</div>` : ''}${ex ? `<div class="receipt-extra">Çıkar: ${ex}</div>` : ''}</div><div class="col-price">${item.price * item.quantity} ₺</div></div>`;
            }).join('')}
            ${(order as Order & { order_note?: string | null }).order_note ? `<div class="center separator">${dashLine}</div><div class="product-row"><div class="col-name" style="width:100%">Not: ${(order as Order & { order_note?: string }).order_note}</div></div>` : ''}
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

    const confirmCloseOrder = async (paymentMethod: 'cash' | 'credit_card') => {
        if (!orderToClose) return;
        const res = await fetch('/api/garson/order/close', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, orderId: orderToClose.id, paymentMethod })
        });
        if (!res.ok) {
            alert('Kapatılamadı');
            return;
        }
        setOrders((prev) => prev.map((o) => (o.id === orderToClose.id ? { ...o, status: 'completed', payment_method: paymentMethod } : o)));
        setOrderToClose(null);
        fetchData();
    };

    const setBillRequested = async (tableNum: number) => {
        const res = await fetch('/api/garson/table-status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, tableNumber: tableNum, status: 'bill_requested' })
        });
        if (!res.ok) return;
        setTableStatusMap((prev) => ({ ...prev, [tableNum]: 'bill_requested' }));
    };

    const openProductForMasa = (product: ProductRow) => {
        setMasaProductModal(product);
        setMasaTempVariants([]);
        setMasaTempExcluded([]);
    };

    const addToMasaCart = (product: ProductRow, selectedVariants: VariantRow[], excludedIngredients: string[]) => {
        const price = product.price + selectedVariants.reduce((a, v) => a + v.price, 0);
        setMasaCart((prev) => {
            const key = JSON.stringify({ v: selectedVariants.map((x) => x.id).sort(), e: excludedIngredients.sort() });
            const existing = prev.find((x) => x.product.id === product.id && JSON.stringify({ v: x.selectedVariants.map((v) => v.id).sort(), e: x.excludedIngredients.sort() }) === key);
            if (existing) return prev.map((x) => (x === existing ? { ...x, quantity: x.quantity + 1 } : x));
            return [...prev, { product, quantity: 1, selectedVariants, excludedIngredients, finalPrice: price }];
        });
        setMasaProductModal(null);
    };

    const onMasaProductAddClick = (product: ProductRow, selectedVariants: VariantRow[], excludedIngredients: string[]) => {
        if (presetOptions.length > 0) {
            setMasaPendingAdd({ product, selectedVariants, excludedIngredients });
            setMasaPresetSelected(new Set());
            setMasaPresetModalOpen(true);
        } else {
            addToMasaCart(product, selectedVariants, excludedIngredients);
        }
    };

    const confirmMasaPreset = () => {
        if (masaPendingAdd) {
            const selectedLabels = presetOptions.filter((p) => masaPresetSelected.has(p.id)).map((p) => p.label);
            if (selectedLabels.length > 0) {
                setMasaOrderNote((prev) => (prev ? `${prev}, ${selectedLabels.join(', ')}` : selectedLabels.join(', ')));
            }
            addToMasaCart(masaPendingAdd.product, masaPendingAdd.selectedVariants, masaPendingAdd.excludedIngredients);
            setMasaPendingAdd(null);
            setMasaPresetModalOpen(false);
        }
    };

    const skipMasaPreset = () => {
        if (masaPendingAdd) {
            addToMasaCart(masaPendingAdd.product, masaPendingAdd.selectedVariants, masaPendingAdd.excludedIngredients);
            setMasaPendingAdd(null);
            setMasaPresetModalOpen(false);
        }
    };

    const removeFromMasaCart = (idx: number) => {
        setMasaCart((prev) => prev.filter((_, i) => i !== idx));
    };

    const submitMasaOrder = async () => {
        if (selectedTableNum == null || masaCart.length === 0) return;
        setMasaSubmitting(true);
        const totalAmount = masaCart.reduce((acc, x) => acc + x.finalPrice * x.quantity, 0);
        const orderItems = masaCart.map((x) => ({
            product_id: x.product.id,
            name: x.product.name + (x.selectedVariants.length ? ' - ' + x.selectedVariants.map((v) => v.name).join(', ') : ''),
            quantity: x.quantity,
            price: x.finalPrice,
            total_price: x.finalPrice * x.quantity,
            selected_variants: x.selectedVariants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
            excluded_ingredients: x.excludedIngredients || []
        }));
        const res = await fetch('/api/garson/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, tableNumber: selectedTableNum, items: orderItems, totalAmount, paymentMethod: 'cash', orderNote: masaOrderNote || undefined })
        });
        setMasaSubmitting(false);
        if (!res.ok) {
            const d = await res.json();
            alert(d.error || 'Sipariş gönderilemedi');
            return;
        }
        const { order } = await res.json();
        setMasaModalOpen(false);
        setMasaPreviewModal(false);
        setMasaCart([]);
        setMasaOrderNote('');
        setSelectedTableNum(null);
        setOrders((prev) => [order, ...prev]);
        setTableStatusMap((prev) => ({ ...prev, [selectedTableNum]: 'occupied' }));
        fetchData();
    };

    const formatTime = (s: string) => new Date(s).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const themeColor = restaurant?.theme_color || '#059669';

    if (!slug) {
        return <div style={{ padding: '24px', textAlign: 'center' }}>Geçersiz link</div>;
    }

    if (!authorized && !loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', padding: '24px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '360px', width: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>Garson Paneli</h1>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>Devam etmek için PIN girin</p>
                    <form onSubmit={handlePinSubmit}>
                        <input
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '1.1rem', textAlign: 'center', letterSpacing: '0.2em', boxSizing: 'border-box' }}
                        />
                        {pinError && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center' }}>{pinError}</p>}
                        <button type="submit" style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '10px', border: 'none', background: themeColor, color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                            Giriş
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading && !restaurant) {
        return <div style={{ padding: '24px', textAlign: 'center' }}>Yükleniyor...</div>;
    }

    return (
        <>
            <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>{restaurant?.name} — Masalar</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                            <button type="button" onClick={() => setSelectedDate((d) => { const x = new Date(d); x.setDate(x.getDate() - 1); return x; })} style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#6B7280' }}><i className="fa-solid fa-chevron-left" /></button>
                            <div style={{ padding: '8px 14px', fontWeight: 600, fontSize: '0.9rem', color: '#374151', minWidth: '110px', textAlign: 'center' }}>{selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</div>
                            <button type="button" onClick={() => setSelectedDate((d) => { const x = new Date(d); x.setDate(x.getDate() + 1); return x; })} style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#6B7280' }}><i className="fa-solid fa-chevron-right" /></button>
                        </div>
                        <button type="button" onClick={() => { setSelectedTableNum(null); setMasaModalOpen(true); }} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: themeColor, color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                            <i className="fa-solid fa-utensils" style={{ marginRight: '8px' }} /> Masa siparişi al
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNum) => {
                        const openList = openOrdersByTable[tableNum] || [];
                        const isOccupied = openList.length > 0;
                        const billRequested = tableStatusMap[tableNum] === 'bill_requested';
                        const tableStatusColor = billRequested ? '#DC2626' : isOccupied ? '#EA580C' : '#059669';
                        const tableStatusLabel = billRequested ? 'Hesap istendi' : isOccupied ? 'Dolu' : 'Boş';
                        return (
                            <div key={tableNum} style={{ background: 'white', borderRadius: '12px', border: `2px solid ${tableStatusColor}`, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => { setSelectedTableNum(tableNum); setMasaModalOpen(true); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTableNum(tableNum); setMasaModalOpen(true); } }}
                                    style={{ background: tableStatusColor, color: 'white', padding: '12px 16px', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <span>Masa {tableNum}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.95 }}>{tableStatusLabel}</span>
                                </div>
                                <div style={{ padding: '12px' }}>
                                    {isOccupied && !billRequested && (
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setBillRequested(tableNum); }} style={{ width: '100%', marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                                            <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }} /> Hesap istendi
                                        </button>
                                    )}
                                    {openList.length === 0 ? (
                                        <div style={{ color: '#9CA3AF', fontSize: '0.9rem', padding: '8px 0' }}>Sipariş yok</div>
                                    ) : (
                                        openList.map((order) => (
                                            <div key={order.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', marginBottom: '8px', background: '#F0FDF4' }}>
                                                <div style={{ fontWeight: 600, color: '#111827' }}>{order.customer_name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>{formatTime(order.created_at)} · {order.total_amount} ₺</div>
                                                <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '4px' }}>{(Array.isArray(order.items) ? order.items : []).map((it: OrderItem) => `${it.quantity}x ${it.name}`).join(', ')}</div>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                    <button type="button" onClick={() => setOrderToClose(order)} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#059669', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Kapat</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {orderToClose && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setOrderToClose(null)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Siparişi kapat</div>
                        <div style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '16px' }}>{orderToClose.customer_name} · {orderToClose.total_amount} ₺</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => setOrderToClose(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
                            <button type="button" onClick={() => confirmCloseOrder('cash')} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', background: themeColor, color: 'white', fontWeight: 700, cursor: 'pointer' }}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}

            {masaModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => { if (!masaSubmitting) { setMasaModalOpen(false); setMasaOrderNote(''); } }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: selectedTableNum != null ? '900px' : '480px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{selectedTableNum != null ? `Masa ${selectedTableNum} — Sipariş al` : 'Masa siparişi al'}</h2>
                            <button type="button" onClick={() => { setMasaModalOpen(false); setMasaOrderNote(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B7280' }}>&times;</button>
                        </div>
                        {selectedTableNum == null ? (
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '12px' }}>Masa seçin</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: '10px' }}>
                                    {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => (
                                        <button key={num} type="button" onClick={() => setSelectedTableNum(num)} style={{ padding: '14px', borderRadius: '10px', border: '2px solid #E5E7EB', background: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>{num}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '12px' }}>Ürünler</div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                        {categories.map((cat) => (
                                            <div key={cat.id} style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>{cat.name}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                                    {products.filter((p) => p.category_id === cat.id).map((prod) => (
                                                        <button key={prod.id} type="button" onClick={() => openProductForMasa(prod)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>
                                                            {prod.name} — {prod.price} ₺
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>Sepet</div>
                                    <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', marginBottom: '10px', fontSize: '0.9rem' }}>
                                        {masaCart.length === 0 ? 'Sepet boş' : masaCart.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
                                                <span>{item.quantity}x {item.product.name} = {item.finalPrice * item.quantity} ₺</span>
                                                <button type="button" onClick={() => removeFromMasaCart(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ fontWeight: 700, marginBottom: '12px' }}>Toplam: {masaCart.reduce((a, x) => a + x.finalPrice * x.quantity, 0)} ₺</div>
                                    <button type="button" onClick={() => setMasaPreviewModal(true)} disabled={masaSubmitting || masaCart.length === 0} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: themeColor, color: 'white', fontWeight: 700, cursor: masaSubmitting || masaCart.length === 0 ? 'not-allowed' : 'pointer', opacity: masaSubmitting || masaCart.length === 0 ? 0.7 : 1 }}>Siparişi Gönder</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {masaProductModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setMasaProductModal(null)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{masaProductModal.name}</h3>
                            <button type="button" onClick={() => setMasaProductModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B7280' }}>&times;</button>
                        </div>
                        {variants.filter((v) => v.product_id === masaProductModal.id).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>Varyasyon</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {variants.filter((v) => v.product_id === masaProductModal.id).map((v) => (
                                        <label key={v.id} style={{ padding: '8px 12px', borderRadius: '8px', border: masaTempVariants.some((x) => x.id === v.id) ? `2px solid ${themeColor}` : '1px solid #D1D5DB', background: masaTempVariants.some((x) => x.id === v.id) ? '#EFF6FF' : 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            <input type="checkbox" checked={masaTempVariants.some((x) => x.id === v.id)} onChange={(e) => { if (e.target.checked) setMasaTempVariants((p) => [...p, v]); else setMasaTempVariants((p) => p.filter((x) => x.id !== v.id)); }} style={{ display: 'none' }} />
                                            {v.name} (+{v.price} ₺)
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        {masaProductModal.ingredients && masaProductModal.ingredients.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>Çıkar</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {masaProductModal.ingredients.map((ing, idx) => (
                                        <label key={idx} style={{ padding: '6px 10px', borderRadius: '20px', border: masaTempExcluded.includes(ing) ? '1px dashed #EF4444' : '1px solid #E5E7EB', background: masaTempExcluded.includes(ing) ? '#FEF2F2' : '#F3F4F6', cursor: 'pointer', fontSize: '0.8rem' }}>
                                            <input type="checkbox" checked={masaTempExcluded.includes(ing)} onChange={(e) => { if (e.target.checked) setMasaTempExcluded((p) => [...p, ing]); else setMasaTempExcluded((p) => p.filter((i) => i !== ing)); }} style={{ display: 'none' }} />
                                            {ing} {masaTempExcluded.includes(ing) ? '(çıkar)' : ''}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button type="button" onClick={() => onMasaProductAddClick(masaProductModal, masaTempVariants, masaTempExcluded)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: themeColor, color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                            Sepete ekle · {masaProductModal.price + masaTempVariants.reduce((a, v) => a + v.price, 0)} ₺
                        </button>
                    </div>
                </div>
            )}

            {masaPreviewModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setMasaPreviewModal(false)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontWeight: 700, marginBottom: '16px' }}>Önizleme — Masa {selectedTableNum}</div>
                        <div style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                            {masaCart.map((item, idx) => (
                                <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>{item.quantity}x {item.product.name} = {item.finalPrice * item.quantity} ₺</div>
                            ))}
                        </div>
                        {masaOrderNote && <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '12px' }}>Not: {masaOrderNote}</div>}
                        <div style={{ fontWeight: 700, marginBottom: '16px' }}>Toplam: {masaCart.reduce((a, x) => a + x.finalPrice * x.quantity, 0)} ₺</div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => setMasaPreviewModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
                            <button type="button" onClick={submitMasaOrder} disabled={masaSubmitting} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: themeColor, color: 'white', fontWeight: 700, cursor: masaSubmitting ? 'not-allowed' : 'pointer' }}>{masaSubmitting ? 'Gönderiliyor...' : 'Onayla'}</button>
                        </div>
                    </div>
                </div>
            )}

            {masaPresetModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={skipMasaPreset}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Hazır ayarlar</div>
                        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>Seçenekler sipariş notuna ve fişe yazılır.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {presetOptions.map((p) => (
                                <label key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: masaPresetSelected.has(p.id) ? `2px solid ${themeColor}` : '1px solid #E5E7EB', background: masaPresetSelected.has(p.id) ? '#ECFDF5' : 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input type="checkbox" checked={masaPresetSelected.has(p.id)} onChange={(e) => setMasaPresetSelected((prev) => { const next = new Set(prev); if (e.target.checked) next.add(p.id); else next.delete(p.id); return next; })} style={{ display: 'none' }} />
                                    {p.label}
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={skipMasaPreset} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Atla</button>
                            <button type="button" onClick={confirmMasaPreset} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: themeColor, color: 'white', fontWeight: 700, cursor: 'pointer' }}>Tamam</button>
                        </div>
                    </div>
                </div>
            )}

            <iframe ref={printFrameRef} style={{ width: 0, height: 0, position: 'absolute', border: 'none', visibility: 'hidden' }} title="print" />
        </>
    );
}
