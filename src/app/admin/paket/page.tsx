'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Topbar from '@/components/Topbar';

const KonumMapModal = dynamic(() => import('@/components/KonumMapModal'), { ssr: false });

interface OrderItem {
    id?: string;
    name: string;
    quantity: number;
    price: number;
    variantName?: string;
    selected_variants?: { id?: string; name: string; price?: number }[];
    excluded_ingredients?: string[];
}

interface CategoryRow { id: string; name: string; display_order?: number; }
interface ProductRow { id: string; category_id: string; name: string; price: number; paket_price?: number | null; display_order?: number; image_url?: string; ingredients?: string[]; }
interface VariantRow { id: string; product_id: string; name: string; price: number; paket_price?: number | null; }

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

interface Order {
    id: string;
    restaurant_id: string;
    source?: string;
    customer_id?: string | null;
    customer_name: string;
    customer_phone?: string;
    address_detail?: string;
    location_lat?: number | null;
    location_lng?: number | null;
    table_number?: number | null;
    items: OrderItem[];
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    order_note?: string | null;
}

function getPaketPrice(p: ProductRow): number {
    return p.paket_price != null && p.paket_price > 0 ? p.paket_price : p.price;
}

export default function PaketPage() {
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [restaurantThemeColor, setRestaurantThemeColor] = useState('#2563EB');
    const [restaurantLocationLat, setRestaurantLocationLat] = useState<number | null>(null);
    const [restaurantLocationLng, setRestaurantLocationLng] = useState<number | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [orderToClose, setOrderToClose] = useState<Order | null>(null);
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    // Paket modal data
    const [modalCategories, setModalCategories] = useState<CategoryRow[]>([]);
    const [modalProducts, setModalProducts] = useState<ProductRow[]>([]);
    const [modalVariants, setModalVariants] = useState<VariantRow[]>([]);
    const [paketModalOpen, setPaketModalOpen] = useState(false);
    const [paketCart, setPaketCart] = useState<{ product: ProductRow; quantity: number; selectedVariants: VariantRow[]; excludedIngredients: string[]; finalPrice: number }[]>([]);
    const [paketPayment, setPaketPayment] = useState<'cash' | 'credit_card'>('cash');
    const [paketProductModal, setPaketProductModal] = useState<ProductRow | null>(null);
    const [paketTempVariants, setPaketTempVariants] = useState<VariantRow[]>([]);
    const [paketTempExcluded, setPaketTempExcluded] = useState<string[]>([]);
    const [paketPreviewModal, setPaketPreviewModal] = useState(false);
    const [paketSubmitting, setPaketSubmitting] = useState(false);
    const [presetOptions, setPresetOptions] = useState<{ id: string; label: string; display_order: number }[]>([]);
    const [paketOrderNote, setPaketOrderNote] = useState('');
    const [paketPresetModalOpen, setPaketPresetModalOpen] = useState(false);
    const [paketPresetSelected, setPaketPresetSelected] = useState<Set<string>>(new Set());
    const [paketPendingAdd, setPaketPendingAdd] = useState<{ product: ProductRow; selectedVariants: VariantRow[]; excludedIngredients: string[] } | null>(null);

    // Customer
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerLocationLat, setCustomerLocationLat] = useState<number | null>(null);
    const [customerLocationLng, setCustomerLocationLng] = useState<number | null>(null);
    const [customerNotes, setCustomerNotes] = useState('');
    const [konumModalOpen, setKonumModalOpen] = useState(false);

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    // Initial load: restaurant + orders (source system, date range)
    useEffect(() => {
        let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: rest, error: restError } = await supabase
                .from('restaurants')
                .select('id, name, slug, theme_color, location_lat, location_lng')
                .eq('owner_id', user.id)
                .single();

            if (restError || !rest) {
                setLoading(false);
                return;
            }

            setRestaurantId(rest.id);
            setRestaurantName(rest.name || '');
            setRestaurantSlug(rest.slug || '');
            setRestaurantThemeColor(rest.theme_color || '#2563EB');
            setRestaurantLocationLat(rest.location_lat ?? null);
            setRestaurantLocationLng(rest.location_lng ?? null);

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: ordersData } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', rest.id)
                .eq('source', 'system')
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: false });

            setOrders(ordersData || []);

            if (channel) supabase.removeChannel(channel);
            if (isSameDay(selectedDate, new Date())) {
                channel = supabase
                    .channel('paket-orders-channel')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'orders',
                            filter: `restaurant_id=eq.${rest.id}`
                        },
                        (payload) => {
                            const newOrder = payload.new as Order;
                            if ((newOrder as { source?: string }).source !== 'system') return;
                            const orderDate = new Date(newOrder.created_at);
                            if (!isSameDay(orderDate, selectedDate)) return;
                            setOrders(prev => [newOrder as Order, ...prev]);
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'orders',
                            filter: `restaurant_id=eq.${rest.id}`
                        },
                        (payload) => {
                            const updated = payload.new as Order;
                            setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
                        }
                    )
                    .subscribe();
            }

            setLoading(false);
        };

        fetchData();

        return () => {
            const supabase = createClient();
            if (channel) supabase.removeChannel(channel);
        };
    }, [selectedDate]);

    // When paket modal opens: fetch categories, products (with paket_price), variants (price, paket_price), presetOptions
    useEffect(() => {
        if (!paketModalOpen || !restaurantId) return;
        const fetchModal = async () => {
            const supabase = createClient();
            const { data: cats } = await supabase.from('categories').select('id, name, display_order').eq('restaurant_id', restaurantId).order('display_order', { ascending: true });
            setModalCategories(cats || []);
            if (!cats?.length) { setModalProducts([]); setModalVariants([]); setPresetOptions([]); return; }
            const catIds = cats.map(c => c.id);
            const { data: prods } = await supabase.from('products').select('id, category_id, name, price, paket_price, display_order, image_url, ingredients').in('category_id', catIds).order('display_order', { ascending: true });
            setModalProducts(prods || []);
            const prodIds = (prods || []).map(p => p.id);
            const { data: vars } = await supabase.from('product_variants').select('id, product_id, name, price, paket_price').in('product_id', prodIds);
            setModalVariants(vars || []);
            const { data: presets } = await supabase.from('menu_preset_options').select('id, label, display_order').eq('restaurant_id', restaurantId).order('display_order', { ascending: true });
            setPresetOptions(presets || []);
        };
        fetchModal();
    }, [paketModalOpen, restaurantId]);

    // Fetch customers for search (when modal is open we can filter by search; also for map pins)
    useEffect(() => {
        if (!restaurantId) return;
        const fetchCustomers = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('customers').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
            setCustomers(data || []);
        };
        fetchCustomers();
    }, [restaurantId, paketModalOpen]);

    const openProductForPaket = (product: ProductRow) => {
        setPaketProductModal(product);
        setPaketTempVariants([]);
        setPaketTempExcluded([]);
    };

    const getVariantPaketPrice = (v: VariantRow) => (v.paket_price != null && v.paket_price > 0 ? v.paket_price : v.price);

    const addToPaketCart = (product: ProductRow, selectedVariants: VariantRow[], excludedIngredients: string[]) => {
        const basePrice = getPaketPrice(product);
        const variantTotal = selectedVariants.reduce((a, v) => a + getVariantPaketPrice(v), 0);
        const price = basePrice + variantTotal;
        setPaketCart(prev => {
            const key = JSON.stringify({ v: selectedVariants.map(x => x.id).sort(), e: excludedIngredients.sort() });
            const existing = prev.find(x => x.product.id === product.id && JSON.stringify({ v: x.selectedVariants.map(v => v.id).sort(), e: x.excludedIngredients.sort() }) === key);
            if (existing) return prev.map(x => x === existing ? { ...x, quantity: x.quantity + 1 } : x);
            return [...prev, { product, quantity: 1, selectedVariants, excludedIngredients, finalPrice: price }];
        });
        setPaketProductModal(null);
    };

    const onPaketProductAddClick = (product: ProductRow, selectedVariants: VariantRow[], excludedIngredients: string[]) => {
        if (presetOptions.length > 0) {
            setPaketPendingAdd({ product, selectedVariants, excludedIngredients });
            setPaketPresetSelected(new Set());
            setPaketPresetModalOpen(true);
        } else {
            addToPaketCart(product, selectedVariants, excludedIngredients);
        }
    };

    const confirmPaketPreset = () => {
        if (paketPendingAdd) {
            const selectedLabels = presetOptions.filter(p => paketPresetSelected.has(p.id)).map(p => p.label);
            if (selectedLabels.length > 0) setPaketOrderNote(prev => prev ? `${prev}, ${selectedLabels.join(', ')}` : selectedLabels.join(', '));
            addToPaketCart(paketPendingAdd.product, paketPendingAdd.selectedVariants, paketPendingAdd.excludedIngredients);
            setPaketPendingAdd(null);
            setPaketPresetModalOpen(false);
        }
    };

    const skipPaketPreset = () => {
        if (paketPendingAdd) {
            addToPaketCart(paketPendingAdd.product, paketPendingAdd.selectedVariants, paketPendingAdd.excludedIngredients);
            setPaketPendingAdd(null);
            setPaketPresetModalOpen(false);
        }
    };

    const removeFromPaketCart = (idx: number) => {
        setPaketCart(prev => prev.filter((_, i) => i !== idx));
    };

    const doSubmitPaketOrder = async (): Promise<Order | null> => {
        if (!restaurantId || paketCart.length === 0) return null;
        const name = selectedCustomer?.name ?? customerName.trim();
        const phone = selectedCustomer?.phone ?? customerPhone.trim();
        const address = selectedCustomer?.address_detail ?? customerAddress.trim();
        if (!name || !phone || !address) {
            alert('Lütfen müşteri adı, telefon ve adres alanlarını doldurun.');
            return null;
        }
        setPaketSubmitting(true);
        try {
            const supabase = createClient();
            const totalAmount = paketCart.reduce((acc, x) => acc + x.finalPrice * x.quantity, 0);
            const orderItems = paketCart.map(x => ({
                product_id: x.product.id,
                name: x.product.name + (x.selectedVariants.length ? ' - ' + x.selectedVariants.map(v => v.name).join(', ') : ''),
                quantity: x.quantity,
                price: x.finalPrice,
                total_price: x.finalPrice * x.quantity,
                selected_variants: x.selectedVariants.map(v => ({ id: v.id, name: v.name, price: getVariantPaketPrice(v) })),
                excluded_ingredients: x.excludedIngredients || []
            }));
            const insertPayload: Record<string, unknown> = {
                restaurant_id: restaurantId,
                source: 'system',
                customer_name: name,
                customer_phone: phone || null,
                address_detail: address || null,
                location_lat: selectedCustomer?.location_lat ?? customerLocationLat,
                location_lng: selectedCustomer?.location_lng ?? customerLocationLng,
                items: orderItems,
                total_amount: totalAmount,
                payment_method: paketPayment,
                status: 'pending',
                ...((paketOrderNote?.trim() || customerNotes?.trim()) && { order_note: [paketOrderNote?.trim(), customerNotes?.trim()].filter(Boolean).join(', ') })
            };
            if (selectedCustomer?.id) insertPayload.customer_id = selectedCustomer.id;

            const { data: newOrder, error } = await supabase.from('orders').insert(insertPayload).select().single();
            if (error) throw error;

            setPaketModalOpen(false);
            setPaketPreviewModal(false);
            setPaketCart([]);
            setPaketOrderNote('');
            setSelectedCustomer(null);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerAddress('');
            setCustomerLocationLat(null);
            setCustomerLocationLng(null);
            setCustomerNotes('');
            setOrders(prev => [newOrder as Order, ...prev]);
            return newOrder as Order;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Bilinmeyen';
            alert('Sipariş gönderilirken hata: ' + msg);
            return null;
        } finally {
            setPaketSubmitting(false);
        }
    };

    const confirmAndSubmitPaket = async () => {
        const order = await doSubmitPaketOrder();
        if (order) printOrder(order, true);
    };

    const openNewCustomer = () => {
        setSelectedCustomer(null);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setCustomerLocationLat(null);
        setCustomerLocationLng(null);
        setCustomerNotes('');
    };

    const selectCustomer = (c: Customer) => {
        setSelectedCustomer(c);
        setCustomerName(c.name);
        setCustomerPhone(c.phone);
        setCustomerAddress(c.address_detail ?? '');
        setCustomerLocationLat(c.location_lat ?? null);
        setCustomerLocationLng(c.location_lng ?? null);
        setCustomerNotes(c.notes ?? '');
    };

    const filteredCustomersForSearch = customers.filter(
        c => !customerSearch.trim() ||
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            (c.phone || '').includes(customerSearch)
    );

    const customerPinsForMap = customers.filter(c => c.location_lat != null && c.location_lng != null).map(c => ({
        id: c.id,
        name: c.name,
        lat: c.location_lat!,
        lng: c.location_lng!
    }));

    const getPaymentLabel = (method: string) => {
        if (method === 'cash') return 'Nakit';
        if (method === 'credit_card') return 'Kredi Kartı';
        if (method.startsWith('meal_card')) return 'Yemek Kartı';
        return method;
    };

    const printOrder = (order: Order, isPaket = false) => {
        const iframe = printFrameRef.current;
        if (!iframe?.contentWindow?.document) return;

        const dateStr = new Date(order.created_at).toLocaleString('tr-TR');
        let items: OrderItem[] = [];
        if (typeof order.items === 'string') {
            try { items = JSON.parse(order.items); } catch { }
        } else if (Array.isArray(order.items)) items = order.items;

        const dashLine = '------------------------------------------------';
        const masaLine = isPaket ? '<div><strong>Paket Siparişi</strong></div>' : `<div><strong>Masa: ${order.table_number ?? '-'}</strong></div>`;

        if (isPaket) {
            const itemRows = items.map((item: OrderItem) => {
                const v = item.selected_variants?.map((x: { name: string }) => x.name).join(', ') || item.variantName || '';
                const ex = item.excluded_ingredients?.join(', ') || '';
                return `<div class="product-row"><div class="col-qty">${item.quantity}</div><div class="col-name">${item.name}${v ? `<div class="receipt-extra">+ ${v}</div>` : ''}${ex ? `<div class="receipt-extra receipt-excluded">Çıkar: ${ex}</div>` : ''}</div><div class="col-price">${item.price * item.quantity} ₺</div></div>`;
            });
            const kitchenRows = items.map((item: OrderItem) => {
                const v = item.selected_variants?.map((x: { name: string }) => x.name).join(', ') || item.variantName || '';
                const ex = item.excluded_ingredients?.join(', ') || '';
                return `<div style="margin-bottom: 10px; font-size: 18px; font-weight: bold;">${item.quantity}x ${item.name}</div>${v ? `<div style="font-size: 16px; font-style: italic; margin-bottom: 4px;">+ ${v}</div>` : ''}${ex ? `<div style="font-size: 16px; text-decoration: line-through; margin-bottom: 8px;">Çıkar: ${ex}</div>` : ''}`;
            });
            const courierRows = items.map((item: OrderItem) => {
                const v = item.selected_variants?.map((x: { name: string }) => x.name).join(', ') || item.variantName || '';
                const ex = item.excluded_ingredients?.join(', ') || '';
                return `<div class="product-row"><div class="col-qty">${item.quantity}</div><div class="col-name">${item.name}${v ? ` + ${v}` : ''}${ex ? ` (Çıkar: ${ex})` : ''}</div><div class="col-price">${item.price * item.quantity} ₺</div></div>`;
            });
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=H&data=${encodeURIComponent(restaurantSlug ? `https://${restaurantSlug}.oneqr.tr` : 'https://oneqr.tr')}`;
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`
            <html><head><title>Paket Sipariş Fişi</title>
            <style>
                @page { size: 80mm auto; margin: 0mm; }
                body { width: 80mm; margin: 0 auto; padding: 5px; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px; color: #000; }
                .center { text-align: center; }
                .separator { white-space: pre; margin: 5px 0; font-weight: normal; }
                .rest-name { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 10px 0; line-height: 1.2; }
                .customer-block { font-size: 18px; font-weight: bold; line-height: 1.3; text-align: left; }
                .customer-label { font-size: 16px; text-decoration: underline; margin-bottom: 5px; display: block; }
                .product-row { font-size: 18px; font-weight: bold; margin-bottom: 6px; line-height: 1.2; }
                .product-row .col-qty, .product-row .col-name, .product-row .col-price { display: inline-block; }
                .col-qty { width: 18%; }
                .col-name { width: 57%; }
                .col-price { width: 25%; text-align: right; }
                .receipt-extra { font-size: 18px; font-weight: bold; font-style: italic; margin-top: 2px; line-height: 1.2; }
                .receipt-excluded { font-style: normal; }
                .total-row { display: flex; justify-content: space-between; font-size: 26px; font-weight: 900; margin-top: 10px; }
                .payment-row { font-size: 20px; font-weight: bold; margin-top: 5px; }
                .footer { margin-top: 20px; text-align: center; }
                .qr-wrap { position: relative; width: 120px; height: 120px; margin: 10px auto; }
                .qr-wrap .qr-img { width: 100%; height: 100%; display: block; }
                .qr-wrap .qr-logo { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; object-fit: contain; background: white; padding: 4px; box-sizing: border-box; }
                .footer-text { font-size: 12px; margin-top: 2px; font-weight: normal; }
                .page-break { page-break-after: always; }
            </style></head><body>
            <div class="center" style="font-size: 14px; font-weight: bold;">OneQR - Menü Sistemleri</div>
            <div class="center separator">${dashLine}</div>
            <div class="center rest-name">${restaurantName}</div>
            <div class="center separator">${dashLine}</div>
            ${masaLine}
            <div class="customer-block" style="margin-top: 8px;">
                <span class="customer-label">MÜŞTERİ BİLGİLERİ</span>
                <div>${order.customer_name}</div>
                ${order.customer_phone ? `<div>Tel: ${order.customer_phone}</div>` : ''}
                <div style="margin-top: 5px; font-weight: normal;">${order.address_detail || 'Adres detayı yok'}</div>
            </div>
            <div class="center separator">${dashLine}</div>
            <div class="product-row" style="font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 2px;">
                <div class="col-qty">Adet</div><div class="col-name">Ürün</div><div class="col-price">Tutar</div>
            </div>
            ${itemRows.join('')}
            ${order.order_note ? `<div class="center separator">${dashLine}</div><div style="font-size: 16px;">Not: ${order.order_note}</div>` : ''}
            <div class="center separator">${dashLine}</div>
            <div class="total-row"><span>TOPLAM</span><span>${order.total_amount} ₺</span></div>
            <div class="center separator">${dashLine}</div>
            <div class="payment-row">ÖDEME: ${getPaymentLabel(order.payment_method).toUpperCase()}</div>
            <div class="center separator">${dashLine}</div>
            <div class="footer">
                <div style="font-size: 18px; font-weight: 900;">OneQR.tr</div>
                <div class="qr-wrap">
                    <img src="${qrUrl}" class="qr-img" alt="QR Code" />
                    <img src="/oneqr-logo.png" class="qr-logo" alt="OneQR" />
                </div>
                <div class="footer-text">oneqr.tr ile oluşturuldu</div>
                <div class="footer-text">${dateStr}</div>
            </div>
            <div class="page-break"></div>
            <div class="center rest-name" style="font-size: 20px;">MUTFAK FİŞİ</div>
            <div class="center" style="font-size: 14px; margin-bottom: 8px;">Paket Siparişi</div>
            <div class="center separator">${dashLine}</div>
            <div class="center rest-name">${restaurantName}</div>
            <div class="center separator">${dashLine}</div>
            ${kitchenRows.join('')}
            <div class="center separator">${dashLine}</div>
            <div class="footer-text">${dateStr}</div>
            <div class="page-break"></div>
            <div class="center rest-name" style="font-size: 20px;">KURYE FİŞİ</div>
            <div class="center" style="font-size: 14px; margin-bottom: 8px;">Paket Siparişi</div>
            <div class="center separator">${dashLine}</div>
            <div class="center rest-name">${restaurantName}</div>
            <div class="center separator">${dashLine}</div>
            <div class="product-row" style="font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 2px;">
                <div class="col-qty">Adet</div><div class="col-name">Ürün</div><div class="col-price">Tutar</div>
            </div>
            ${courierRows.join('')}
            <div class="center separator">${dashLine}</div>
            <div class="total-row"><span>TOPLAM</span><span>${order.total_amount} ₺</span></div>
            <div class="center separator">${dashLine}</div>
            <div class="footer-text">${dateStr}</div>
            </body></html>
            `);
            doc.close();
            setTimeout(() => iframe.contentWindow?.print(), 800);
            return;
        }

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
            ${masaLine}
            <div>${order.customer_name}</div>
            ${order.customer_phone ? `<div>Tel: ${order.customer_phone}</div>` : ''}
            <div class="center separator">${dashLine}</div>
            <div class="product-row" style="border-bottom:1px solid #000;padding-bottom:2px;">
                <div class="col-qty">Adet</div><div class="col-name">Ürün</div><div class="col-price">Tutar</div>
            </div>
            ${items.map((item: OrderItem) => {
                const v = item.selected_variants?.map((x: { name: string }) => x.name).join(', ') || item.variantName || '';
                const ex = item.excluded_ingredients?.join(', ') || '';
                return `<div class="product-row"><div class="col-qty">${item.quantity}</div><div class="col-name">${item.name}${v ? `<div class="receipt-extra">+ ${v}</div>` : ''}${ex ? `<div class="receipt-extra">Çıkar: ${ex}</div>` : ''}</div><div class="col-price">${item.price * item.quantity} ₺</div></div>`;
            }).join('')}
            ${order.order_note ? `<div class="center separator">${dashLine}</div><div style="font-size: 16px;">Not: ${order.order_note}</div>` : ''}
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

    const closeOrder = (order: Order) => setOrderToClose(order);

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

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const openOrders = orders.filter(o => o.status === 'pending');
    const closedOrders = orders.filter(o => o.status !== 'pending');

    const canSubmit = () => {
        const name = selectedCustomer?.name ?? customerName.trim();
        const phone = selectedCustomer?.phone ?? customerPhone.trim();
        const address = selectedCustomer?.address_detail ?? customerAddress.trim();
        return name && phone && address && paketCart.length > 0;
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: '@media(max-width:768px){.paket-btn-desktop{display:none!important}}@media(max-width:600px){.paket-modal-grid{grid-template-columns:1fr!important}}' }} />
            <Topbar title="Paket Siparişleri" />
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>Paket Siparişleri</h1>
                        <button
                            type="button"
                            onClick={() => setPaketModalOpen(true)}
                            className="paket-btn-desktop"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                borderRadius: '10px',
                                border: `1px solid ${restaurantThemeColor}`,
                                background: 'white',
                                color: restaurantThemeColor,
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            <i className="fa-solid fa-box" />
                            Paket siparişi al
                        </button>
                    </div>
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
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>Açık siparişler</h2>
                            {openOrders.length === 0 ? (
                                <div style={{ color: '#9CA3AF', fontSize: '0.9rem', padding: '16px', background: '#F9FAFB', borderRadius: '10px' }}>Açık paket siparişi yok</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                                    {openOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            style={{
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                background: '#F0FDF4'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, color: '#111827' }}>{order.customer_name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                                                {formatTime(order.created_at)} · {order.total_amount} ₺
                                            </div>
                                            {order.address_detail && (
                                                <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>{order.address_detail}</div>
                                            )}
                                            <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '6px' }}>
                                                {Array.isArray(order.items) ? order.items.map((it: OrderItem) => `${it.quantity}x ${it.name}`).join(', ') : ''}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => printOrder(order, true)}
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
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>Kapatılan siparişler</h2>
                            {closedOrders.length === 0 ? (
                                <div style={{ color: '#9CA3AF', fontSize: '0.9rem', padding: '16px', background: '#F9FAFB', borderRadius: '10px' }}>Kapatılan paket siparişi yok</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                    {closedOrders.map((order) => (
                                        <div key={order.id} style={{ fontSize: '0.9rem', color: '#6B7280', padding: '12px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                                            {order.customer_name} · {order.total_amount} ₺ · {formatTime(order.created_at)} · {getPaymentLabel(order.payment_method)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Paket siparişi al modal */}
                {paketModalOpen && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px'
                        }}
                        onClick={() => { if (!paketSubmitting) setPaketModalOpen(false); }}
                    >
                        <div
                            style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '24px',
                                maxWidth: '1100px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Paket siparişi al</h2>
                                <button type="button" onClick={() => { if (!paketSubmitting) setPaketModalOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B7280' }}>&times;</button>
                            </div>

                            <div className="paket-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', minHeight: '480px' }}>
                                {/* Sol: Ürünler */}
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Ürünler</div>
                                    <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        {modalCategories.map(cat => (
                                            <div key={cat.id} style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>{cat.name}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                    {modalProducts.filter(p => p.category_id === cat.id).map(prod => (
                                                        <button
                                                            key={prod.id}
                                                            type="button"
                                                            onClick={() => openProductForPaket(prod)}
                                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', textAlign: 'left', minHeight: '100px' }}
                                                        >
                                                            {prod.image_url ? <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }} /> : <div style={{ width: '100%', height: '70px', background: '#F3F4F6', borderRadius: '8px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}><i className="fa-solid fa-image" /></div>}
                                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{prod.name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>{getPaketPrice(prod)} ₺</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {modalCategories.length === 0 && <div style={{ gridColumn: '1 / -1', color: '#9CA3AF', fontSize: '0.9rem' }}>Henüz ürün yok</div>}
                                    </div>
                                </div>

                                {/* Orta: Sepet + Ödeme + Siparişi Gönder */}
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Sepet</div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                                        {paketCart.length === 0 ? <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Sepet boş</div> : paketCart.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '0.9rem' }}>
                                                <span>{item.quantity}x {item.product.name}{item.selectedVariants.length ? ' (+ ' + item.selectedVariants.map(v => v.name).join(', ') + ')' : ''}{item.excludedIngredients.length ? ' [Çıkar: ' + item.excludedIngredients.join(', ') + ']' : ''} = {item.finalPrice * item.quantity} ₺</span>
                                                <button type="button" onClick={() => removeFromPaketCart(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '1rem' }}>&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.2rem' }}>Toplam: {paketCart.reduce((a, x) => a + x.finalPrice * x.quantity, 0)} ₺</div>
                                    <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Ödeme</div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <button type="button" onClick={() => setPaketPayment('cash')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: paketPayment === 'cash' ? `2px solid ${restaurantThemeColor}` : '1px solid #D1D5DB', background: paketPayment === 'cash' ? '#ECFDF5' : 'white', fontWeight: 600, cursor: 'pointer' }}>Nakit</button>
                                        <button type="button" onClick={() => setPaketPayment('credit_card')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: paketPayment === 'credit_card' ? `2px solid ${restaurantThemeColor}` : '1px solid #D1D5DB', background: paketPayment === 'credit_card' ? '#EFF6FF' : 'white', fontWeight: 600, cursor: 'pointer' }}>Kart</button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!canSubmit()) { alert('Lütfen müşteri adı, telefon ve adres doldurun.'); return; }
                                            setPaketPreviewModal(true);
                                        }}
                                        disabled={paketSubmitting || paketCart.length === 0}
                                        style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: restaurantThemeColor, color: 'white', fontWeight: 700, cursor: paketSubmitting || paketCart.length === 0 ? 'not-allowed' : 'pointer', opacity: paketSubmitting || paketCart.length === 0 ? 0.7 : 1 }}
                                    >
                                        Siparişi Gönder
                                    </button>
                                </div>

                                {/* Sağ: Müşteri */}
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Müşteri</div>
                                    <input
                                        type="text"
                                        placeholder="Müşteri ara (ad veya telefon)"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '10px', fontSize: '0.9rem' }}
                                    />
                                    <button type="button" onClick={openNewCustomer} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer', marginBottom: '12px', fontSize: '0.85rem' }}>
                                        Yeni müşteri
                                    </button>
                                    {customerSearch.trim() && filteredCustomersForSearch.length > 0 && (
                                        <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '12px' }}>
                                            {filteredCustomersForSearch.slice(0, 5).map(c => (
                                                <button key={c.id} type="button" onClick={() => selectCustomer(c)} style={{ display: 'block', width: '100%', padding: '10px 12px', textAlign: 'left', border: 'none', background: selectedCustomer?.id === c.id ? '#ECFDF5' : 'white', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid #F3F4F6' }}>
                                                    {c.name} · {c.phone}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input type="text" placeholder="Ad Soyad" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.9rem' }} />
                                        <input type="tel" placeholder="Telefon" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.9rem' }} />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <textarea placeholder="Adres" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows={2} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.9rem', resize: 'vertical' }} />
                                            <button type="button" onClick={() => setKonumModalOpen(true)} title="Konum seç" style={{ padding: '10px', borderRadius: '8px', border: `2px solid ${restaurantThemeColor}`, background: '#EFF6FF', color: restaurantThemeColor, cursor: 'pointer', alignSelf: 'flex-start' }}>
                                                <i className="fa-solid fa-map-marker-alt" />
                                            </button>
                                        </div>
                                        <input type="text" placeholder="Notlar" value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.9rem' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Ürün seçenekleri modal */}
                            {paketProductModal && (
                                <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setPaketProductModal(null)}>
                                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{paketProductModal.name}</h3>
                                            <button type="button" onClick={() => setPaketProductModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B7280' }}>&times;</button>
                                        </div>
                                        {paketProductModal.image_url && <img src={paketProductModal.image_url} alt={paketProductModal.name} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />}
                                        {modalVariants.filter(v => v.product_id === paketProductModal.id).length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151', fontSize: '0.9rem' }}>Varyasyon</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {modalVariants.filter(v => v.product_id === paketProductModal.id).map(v => (
                                                        <label key={v.id} style={{ padding: '10px 14px', borderRadius: '10px', border: paketTempVariants.some(x => x.id === v.id) ? `2px solid ${restaurantThemeColor}` : '1px solid #D1D5DB', background: paketTempVariants.some(x => x.id === v.id) ? '#EFF6FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                                            <input type="checkbox" checked={paketTempVariants.some(x => x.id === v.id)} onChange={e => { if (e.target.checked) setPaketTempVariants(p => [...p, v]); else setPaketTempVariants(p => p.filter(x => x.id !== v.id)); }} style={{ display: 'none' }} />
                                                            {v.name} (+{getVariantPaketPrice(v)} ₺)
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {paketProductModal.ingredients && paketProductModal.ingredients.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151', fontSize: '0.9rem' }}>Çıkarılacak malzemeler</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {paketProductModal.ingredients.map((ing, idx) => (
                                                        <label key={idx} style={{ padding: '8px 12px', borderRadius: '20px', border: paketTempExcluded.includes(ing) ? '1px dashed #EF4444' : '1px solid #E5E7EB', background: paketTempExcluded.includes(ing) ? '#FEF2F2' : '#F3F4F6', color: paketTempExcluded.includes(ing) ? '#EF4444' : '#374151', textDecoration: paketTempExcluded.includes(ing) ? 'line-through' : 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                            <input type="checkbox" checked={!paketTempExcluded.includes(ing)} onChange={e => { if (!e.target.checked) setPaketTempExcluded(p => [...p, ing]); else setPaketTempExcluded(p => p.filter(i => i !== ing)); }} style={{ display: 'none' }} />
                                                            {ing}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <button type="button" onClick={() => onPaketProductAddClick(paketProductModal, paketTempVariants, paketTempExcluded)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: restaurantThemeColor, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                                            Sepete Ekle · {getPaketPrice(paketProductModal) + paketTempVariants.reduce((a, v) => a + getVariantPaketPrice(v), 0)} ₺
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Hazır ayarlar modal */}
                            {paketPresetModalOpen && (
                                <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={skipPaketPreset}>
                                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Hazır ayarlar</div>
                                        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>Seçenekler sipariş notuna ve fişe yazılır.</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                            {presetOptions.map(p => (
                                                <label key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: paketPresetSelected.has(p.id) ? `2px solid ${restaurantThemeColor}` : '1px solid #E5E7EB', background: paketPresetSelected.has(p.id) ? '#ECFDF5' : 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    <input type="checkbox" checked={paketPresetSelected.has(p.id)} onChange={e => setPaketPresetSelected(prev => { const next = new Set(prev); if (e.target.checked) next.add(p.id); else next.delete(p.id); return next; })} style={{ display: 'none' }} />
                                                    {p.label}
                                                </label>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="button" onClick={skipPaketPreset} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Atla</button>
                                            <button type="button" onClick={confirmPaketPreset} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: restaurantThemeColor, color: 'white', fontWeight: 700, cursor: 'pointer' }}>Tamam</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sipariş önizleme modal */}
                            {paketPreviewModal && (
                                <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setPaketPreviewModal(false)}>
                                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '16px' }}>Sipariş Önizleme</div>
                                        <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
                                            {selectedCustomer?.name ?? customerName} · {selectedCustomer?.phone ?? customerPhone}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '8px' }}>{selectedCustomer?.address_detail ?? customerAddress}</div>
                                        <div style={{ marginBottom: '16px' }}>
                                            {paketCart.map((item, idx) => (
                                                <div key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem' }}>{item.quantity}x {item.product.name}{item.selectedVariants.length ? ' (+ ' + item.selectedVariants.map(v => v.name).join(', ') + ')' : ''}{item.excludedIngredients.length ? ' [Çıkar: ' + item.excludedIngredients.join(', ') + ']' : ''} = {item.finalPrice * item.quantity} ₺</div>
                                            ))}
                                        </div>
                                        {paketOrderNote && <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '12px' }}>Not: {paketOrderNote}</div>}
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '16px' }}>Toplam: {paketCart.reduce((a, x) => a + x.finalPrice * x.quantity, 0)} ₺ · {paketPayment === 'cash' ? 'Nakit' : 'Kart'}</div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button type="button" onClick={() => setPaketPreviewModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
                                            <button type="button" onClick={confirmAndSubmitPaket} disabled={paketSubmitting} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontWeight: 700, cursor: paketSubmitting ? 'not-allowed' : 'pointer' }}>{paketSubmitting ? 'Gönderiliyor...' : 'Onayla ve Gönder'}</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Konum harita modal */}
                {konumModalOpen && (
                    <KonumMapModal
                        isOpen={konumModalOpen}
                        onClose={() => setKonumModalOpen(false)}
                        onSelect={(lat, lng) => { setCustomerLocationLat(lat); setCustomerLocationLng(lng); setKonumModalOpen(false); }}
                        onSelectCustomer={(id, lat, lng) => { const c = customers.find(x => x.id === id); if (c) { selectCustomer(c); setCustomerLocationLat(lat); setCustomerLocationLng(lng); } setKonumModalOpen(false); }}
                        themeColor={restaurantThemeColor}
                        selectedLat={customerLocationLat}
                        selectedLng={customerLocationLng}
                        centerLat={restaurantLocationLat}
                        centerLng={restaurantLocationLng}
                        restaurantName={restaurantName}
                        customerPins={customerPinsForMap}
                    />
                )}

                {/* Ödeme yöntemi seç modal (Siparişi Kapat) */}
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
                                <button type="button" onClick={() => confirmCloseWithPayment('cash')} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', background: '#ECFDF5', color: '#047857', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                                    <i className="fa-solid fa-money-bill-wave" style={{ marginRight: '8px' }} /> Nakit
                                </button>
                                <button type="button" onClick={() => confirmCloseWithPayment('credit_card')} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                                    <i className="fa-solid fa-credit-card" style={{ marginRight: '8px' }} /> Kart
                                </button>
                            </div>
                            <button type="button" onClick={() => setOrderToClose(null)} style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.9rem' }}>
                                İptal
                            </button>
                        </div>
                    </div>
                )}

                <iframe ref={printFrameRef} style={{ width: 0, height: 0, position: 'absolute', border: 'none', visibility: 'hidden' }} title="print" />
            </div>
        </>
    );
}
