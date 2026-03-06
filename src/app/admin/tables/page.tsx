'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
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

interface CategoryRow { id: string; name: string; display_order?: number; show_preset_options?: boolean; }
interface ProductRow { id: string; category_id: string; name: string; price: number; paket_price?: number | null; display_order?: number; image_url?: string; ingredients?: string[]; }
interface VariantRow { id: string; product_id: string; name: string; price: number; }

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
    order_note?: string | null;
}

export default function TablesPage() {
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [tableCount, setTableCount] = useState(10);
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [restaurantThemeColor, setRestaurantThemeColor] = useState('#2563EB');
    const [restaurantLocationLat, setRestaurantLocationLat] = useState<number | null>(null);
    const [restaurantLocationLng, setRestaurantLocationLng] = useState<number | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [orderToClose, setOrderToClose] = useState<Order | null>(null);
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    // Masa modalı için ürün/kategori verisi (aynı fetch)
    const [modalCategories, setModalCategories] = useState<CategoryRow[]>([]);
    const [modalProducts, setModalProducts] = useState<ProductRow[]>([]);
    const [modalVariants, setModalVariants] = useState<VariantRow[]>([]);
    // Masa siparişi modal
    const [masaModalOpen, setMasaModalOpen] = useState(false);
    const [selectedTableNum, setSelectedTableNum] = useState<number | null>(null);
    const [masaCart, setMasaCart] = useState<{ product: ProductRow; quantity: number; selectedVariants: VariantRow[]; excludedIngredients: string[]; finalPrice: number }[]>([]);
    const [masaPayment, setMasaPayment] = useState<'cash' | 'credit_card'>('cash');
    const [masaProductModal, setMasaProductModal] = useState<ProductRow | null>(null);
    const [masaTempVariants, setMasaTempVariants] = useState<VariantRow[]>([]);
    const [masaTempExcluded, setMasaTempExcluded] = useState<string[]>([]);
    const [masaPreviewModal, setMasaPreviewModal] = useState(false);
    const [masaSubmitting, setMasaSubmitting] = useState(false);
    const [tableStatusMap, setTableStatusMap] = useState<Record<number, 'empty' | 'occupied' | 'bill_requested'>>({});
    const [presetOptions, setPresetOptions] = useState<{ id: string; label: string; display_order: number }[]>([]);
    const [masaOrderNote, setMasaOrderNote] = useState('');
    const [masaPresetModalOpen, setMasaPresetModalOpen] = useState(false);
    const [masaPresetSelected, setMasaPresetSelected] = useState<Set<string>>(new Set());
    const [masaPendingAdd, setMasaPendingAdd] = useState<{ product: ProductRow; selectedVariants: VariantRow[]; excludedIngredients: string[] } | null>(null);

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    useEffect(() => {
        let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
        let statusChannel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;

        const fetchData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: rest, error: restError } = await supabase
                .from('restaurants')
                .select('id, name, slug, table_count, theme_color, location_lat, location_lng')
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

            const { data: statusRows } = await supabase
                .from('table_status')
                .select('table_number, status')
                .eq('restaurant_id', rest.id);
            const statusMap: Record<number, 'empty' | 'occupied' | 'bill_requested'> = {};
            if (statusRows) {
                statusRows.forEach((r: { table_number: number; status: string }) => {
                    statusMap[r.table_number] = r.status as 'empty' | 'occupied' | 'bill_requested';
                });
            }
            setTableStatusMap(statusMap);

            if (channel) supabase.removeChannel(channel);
            if (statusChannel) supabase.removeChannel(statusChannel);
            if (isSameDay(selectedDate, new Date())) {
                channel = supabase
                    .channel('tables-orders-channel')
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
                            if ((newOrder as { source?: string }).source !== 'restaurant') return;
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

                statusChannel = supabase
                    .channel('tables-status-channel')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'table_status',
                            filter: `restaurant_id=eq.${rest.id}`
                        },
                        (payload) => {
                            const row = payload.new as { table_number: number; status: string };
                            setTableStatusMap(prev => ({ ...prev, [row.table_number]: row.status as 'empty' | 'occupied' | 'bill_requested' }));
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'table_status',
                            filter: `restaurant_id=eq.${rest.id}`
                        },
                        (payload) => {
                            const row = payload.new as { table_number: number; status: string };
                            setTableStatusMap(prev => ({ ...prev, [row.table_number]: row.status as 'empty' | 'occupied' | 'bill_requested' }));
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
            if (statusChannel) supabase.removeChannel(statusChannel);
        };
    }, [selectedDate]);

    useEffect(() => {
        if (!masaModalOpen || !restaurantId) return;
        const fetch = async () => {
            const supabase = createClient();
            const { data: cats } = await supabase.from('categories').select('id, name, display_order, show_preset_options').eq('restaurant_id', restaurantId).order('display_order', { ascending: true });
            setModalCategories(cats || []);
            if (!cats?.length) { setModalProducts([]); setModalVariants([]); setPresetOptions([]); return; }
            const catIds = cats.map(c => c.id);
            const { data: prods } = await supabase.from('products').select('id, category_id, name, price, display_order, image_url, ingredients').in('category_id', catIds).order('display_order', { ascending: true });
            setModalProducts(prods || []);
            const prodIds = (prods || []).map(p => p.id);
            const { data: vars } = await supabase.from('product_variants').select('id, product_id, name, price').in('product_id', prodIds);
            setModalVariants(vars || []);
            const { data: presets } = await supabase.from('menu_preset_options').select('id, label, display_order').eq('restaurant_id', restaurantId).order('display_order', { ascending: true });
            setPresetOptions(presets || []);
        };
        fetch();
    }, [masaModalOpen, restaurantId]);

    const openProductForMasa = (product: ProductRow) => {
        setMasaProductModal(product);
        setMasaTempVariants([]);
        setMasaTempExcluded([]);
    };

    const addToMasaCart = (product: ProductRow, selectedVariants: VariantRow[], excludedIngredients: string[]) => {
        const price = product.price + selectedVariants.reduce((a, v) => a + v.price, 0);
        setMasaCart(prev => {
            const key = JSON.stringify({ v: selectedVariants.map(x => x.id).sort(), e: excludedIngredients.sort() });
            const existing = prev.find(x => x.product.id === product.id && JSON.stringify({ v: x.selectedVariants.map(v => v.id).sort(), e: x.excludedIngredients.sort() }) === key);
            if (existing) return prev.map(x => x === existing ? { ...x, quantity: x.quantity + 1 } : x);
            return [...prev, { product, quantity: 1, selectedVariants, excludedIngredients, finalPrice: price }];
        });
        setMasaProductModal(null);
    };

    const onMasaProductAddClick = (product: ProductRow, selectedVariants: VariantRow[], excludedIngredients: string[]) => {
        const cat = modalCategories.find(c => c.id === product.category_id);
        const showPreset = presetOptions.length > 0 && (cat?.show_preset_options !== false);
        if (showPreset) {
            setMasaPendingAdd({ product, selectedVariants, excludedIngredients });
            setMasaPresetSelected(new Set());
            setMasaPresetModalOpen(true);
        } else {
            addToMasaCart(product, selectedVariants, excludedIngredients);
        }
    };

    const confirmMasaPreset = () => {
        if (masaPendingAdd) {
            const selectedLabels = presetOptions.filter(p => masaPresetSelected.has(p.id)).map(p => p.label);
            if (selectedLabels.length > 0) setMasaOrderNote(prev => prev ? `${prev}, ${selectedLabels.join(', ')}` : selectedLabels.join(', '));
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
        setMasaCart(prev => prev.filter((_, i) => i !== idx));
    };

    const updateMasaCartQuantity = (idx: number, delta: number) => {
        setMasaCart(prev => {
            const item = prev[idx];
            if (!item) return prev;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return prev.filter((_, i) => i !== idx);
            return prev.map((x, i) => i === idx ? { ...x, quantity: newQty } : x);
        });
    };

    const doSubmitMasaOrder = async (): Promise<Order | null> => {
        if (!restaurantId || selectedTableNum == null || masaCart.length === 0) return null;
        setMasaSubmitting(true);
        try {
            const supabase = createClient();
            const totalAmount = masaCart.reduce((acc, x) => acc + x.finalPrice * x.quantity, 0);
            const orderItems = masaCart.map(x => ({
                product_id: x.product.id,
                name: x.product.name + (x.selectedVariants.length ? ' - ' + x.selectedVariants.map(v => v.name).join(', ') : ''),
                quantity: x.quantity,
                price: x.finalPrice,
                total_price: x.finalPrice * x.quantity,
                selected_variants: x.selectedVariants.map(v => ({ id: v.id, name: v.name, price: v.price })),
                excluded_ingredients: x.excludedIngredients || []
            }));
            const { data: newOrder, error } = await supabase.from('orders').insert({
                restaurant_id: restaurantId,
                customer_name: `Masa ${selectedTableNum}`,
                table_number: selectedTableNum,
                items: orderItems,
                total_amount: totalAmount,
                payment_method: masaPayment,
                status: 'pending',
                source: 'restaurant',
                ...(masaOrderNote?.trim() && { order_note: masaOrderNote.trim() })
            }).select().single();
            if (error) throw error;
            await supabase.from('table_status').upsert(
                { restaurant_id: restaurantId, table_number: selectedTableNum, status: 'occupied', updated_at: new Date().toISOString() },
                { onConflict: 'restaurant_id,table_number' }
            );
            setTableStatusMap(prev => ({ ...prev, [selectedTableNum]: 'occupied' }));
            setMasaModalOpen(false);
            setMasaPreviewModal(false);
            setMasaCart([]);
            setMasaOrderNote('');
            setSelectedTableNum(null);
            setOrders(prev => [newOrder as Order, ...prev]);
            return newOrder as Order;
        } catch (e: any) {
            alert('Sipariş gönderilirken hata: ' + (e?.message || 'Bilinmeyen'));
            return null;
        } finally {
            setMasaSubmitting(false);
        }
    };

    const confirmAndSubmitMasa = async () => {
        const order = await doSubmitMasaOrder();
        if (order) {
            printOrder(order, false);
        }
    };

    const openOrdersByTable: Record<number, Order[]> = {};
    const closedOrdersByTable: Record<number, Order[]> = {};
    for (let t = 1; t <= tableCount; t++) {
        openOrdersByTable[t] = [];
        closedOrdersByTable[t] = [];
    }

    orders.forEach((o) => {
        if (o.source !== 'restaurant') return;
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

    const printOrder = (order: Order, isPaket = false) => {
        const iframe = printFrameRef.current;
        if (!iframe?.contentWindow?.document) return;

        const dateStr = new Date(order.created_at).toLocaleString('tr-TR');
        let items: any[] = [];
        if (typeof order.items === 'string') {
            try { items = JSON.parse(order.items); } catch { }
        } else if (Array.isArray(order.items)) items = order.items;

        const dashLine = '------------------------------------------------';
        const masaLine = isPaket ? '<div><strong>Paket Siparişi</strong></div>' : `<div><strong>Masa: ${order.table_number ?? '-'}</strong></div>`;

        if (isPaket) {
            const itemRows = items.map((item: any) => {
                const v = item.selected_variants?.map((x: { name: string }) => x.name).join(', ') || item.variantName || '';
                const ex = item.excluded_ingredients?.join(', ') || '';
                return `<div class="product-row"><div class="col-qty">${item.quantity}</div><div class="col-name">${item.name}${v ? `<div class="receipt-extra">+ ${v}</div>` : ''}${ex ? `<div class="receipt-extra receipt-excluded">Çıkar: ${ex}</div>` : ''}</div><div class="col-price">${item.price * item.quantity} ₺</div></div>`;
            });
            const kitchenRows = items.map((item: any) => {
                const v = item.selected_variants?.map((x: { name: string }) => x.name).join(', ') || item.variantName || '';
                const ex = item.excluded_ingredients?.join(', ') || '';
                return `<div style="margin-bottom: 10px; font-size: 18px; font-weight: bold;">${item.quantity}x ${item.name}</div>${v ? `<div style="font-size: 16px; font-style: italic; margin-bottom: 4px;">+ ${v}</div>` : ''}${ex ? `<div style="font-size: 16px; text-decoration: line-through; margin-bottom: 8px;">Çıkar: ${ex}</div>` : ''}`;
            });
            const courierRows = items.map((item: any) => {
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
            ${items.map((item: any) => {
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

    const closeOrder = (order: Order) => {
        setOrderToClose(order);
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
        const tableNum = orderToClose.source === 'restaurant' ? orderToClose.table_number : null;
        if (restaurantId && tableNum != null && tableNum >= 1 && tableNum <= tableCount) {
            const otherOpen = orders.filter(o => o.id !== orderToClose.id && o.source === 'restaurant' && o.table_number === tableNum && o.status === 'pending');
            if (otherOpen.length === 0) {
                await supabase.from('table_status').upsert(
                    { restaurant_id: restaurantId, table_number: tableNum, status: 'empty', updated_at: new Date().toISOString() },
                    { onConflict: 'restaurant_id,table_number' }
                );
                setTableStatusMap(prev => ({ ...prev, [tableNum]: 'empty' }));
            }
        }
        setOrderToClose(null);
    };

    const setTableStatusBillRequested = async (tableNum: number) => {
        if (!restaurantId) return;
        const supabase = createClient();
        const { error } = await supabase.from('table_status').upsert(
            { restaurant_id: restaurantId, table_number: tableNum, status: 'bill_requested', updated_at: new Date().toISOString() },
            { onConflict: 'restaurant_id,table_number' }
        );
        if (error) {
            alert('Güncelleme hatası: ' + error.message);
            return;
        }
        setTableStatusMap(prev => ({ ...prev, [tableNum]: 'bill_requested' }));
    };

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: '@media(max-width:768px){.paket-btn-desktop{display:none!important}}@media(max-width:600px){.paket-modal-grid{grid-template-columns:1fr!important}}' }} />
            <Topbar title="Restoran Siparişleri" />
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>Restoran Siparişleri</h1>
                        <button
                            type="button"
                            onClick={() => setMasaModalOpen(true)}
                            className="paket-btn-desktop"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                borderRadius: '10px',
                                border: '1px solid #059669',
                                background: 'white',
                                color: '#059669',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            <i className="fa-solid fa-utensils" />
                            Masa siparişi al
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

                {!loading && (() => {
                    const billRequestedTables = Object.entries(tableStatusMap)
                        .filter(([, status]) => status === 'bill_requested')
                        .map(([num]) => Number(num))
                        .sort((a, b) => a - b);
                    if (billRequestedTables.length === 0) return null;
                    return (
                        <div style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <i className="fa-solid fa-receipt" style={{ fontSize: '1.1rem' }} />
                            <span>Hesap istendi: Masa {billRequestedTables.join(', ')}</span>
                        </div>
                    );
                })()}

                {loading ? (
                    <div>Yükleniyor...</div>
                ) : (
                    <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNum) => {
                            const openList = openOrdersByTable[tableNum] || [];
                            const closedList = closedOrdersByTable[tableNum] || [];
                            const isOccupied = openList.length > 0;
                            const billRequested = tableStatusMap[tableNum] === 'bill_requested';
                            const tableStatusColor = billRequested ? '#DC2626' : isOccupied ? '#EA580C' : '#059669';
                            const tableStatusLabel = billRequested ? 'Hesap istendi' : isOccupied ? 'Dolu' : 'Boş';
                            return (
                                <div
                                    key={tableNum}
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        border: `2px solid ${tableStatusColor}`,
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => { setSelectedTableNum(tableNum); setMasaModalOpen(true); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTableNum(tableNum); setMasaModalOpen(true); } }}
                                        style={{
                                            background: tableStatusColor,
                                            color: 'white',
                                            padding: '12px 16px',
                                            fontWeight: 700,
                                            fontSize: '1.1rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <span>Masa {tableNum}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.95 }}>
                                            {tableStatusLabel}
                                        </span>
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        {isOccupied && !billRequested && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setTableStatusBillRequested(tableNum); }}
                                                style={{ width: '100%', marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                                            >
                                                <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }} /> Hesap istendi
                                            </button>
                                        )}
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
                    </>
                )}

                {/* Masa siparişi al modal */}
                {masaModalOpen && (
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
                        onClick={() => { if (!masaSubmitting) { setMasaModalOpen(false); setMasaOrderNote(''); } }}
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
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Masa siparişi al</h2>
                                <button type="button" onClick={() => { setMasaModalOpen(false); setMasaOrderNote(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B7280' }}>&times;</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', minHeight: '480px' }}>
                                {/* Sol: Ürünler */}
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Ürünler</div>
                                    <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        {modalCategories.map(cat => (
                                            <div key={cat.id} style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>{cat.name}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                    {modalProducts.filter(p => p.category_id === cat.id).map(prod => (
                                                        <button key={prod.id} type="button" onClick={() => openProductForMasa(prod)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', textAlign: 'left', minHeight: '100px' }}>
                                                            {prod.image_url ? <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }} /> : <div style={{ width: '100%', height: '70px', background: '#F3F4F6', borderRadius: '8px', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}><i className="fa-solid fa-image" /></div>}
                                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{prod.name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>{prod.price} ₺</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {modalCategories.length === 0 && <div style={{ gridColumn: '1 / -1', color: '#9CA3AF', fontSize: '0.9rem' }}>Henüz ürün yok</div>}
                                    </div>
                                </div>

                                {/* Orta: Sepet + Ödeme */}
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Sepet</div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                                        {masaCart.length === 0 ? <div style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Sepet boş</div> : masaCart.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '0.9rem', gap: '8px' }}>
                                                <span style={{ flex: 1 }}>{item.quantity}x {item.product.name}{item.selectedVariants.length ? ' (+ ' + item.selectedVariants.map(v => v.name).join(', ') + ')' : ''}{item.excludedIngredients.length ? ' [Çıkar: ' + item.excludedIngredients.join(', ') + ']' : ''} = {item.finalPrice * item.quantity} ₺</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <button type="button" onClick={() => updateMasaCartQuantity(idx, -1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>−</button>
                                                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                                                    <button type="button" onClick={() => updateMasaCartQuantity(idx, 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>+</button>
                                                    <button type="button" onClick={() => removeFromMasaCart(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '1.1rem', marginLeft: '4px' }}>&times;</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.2rem' }}>Toplam: {masaCart.reduce((a, x) => a + x.finalPrice * x.quantity, 0)} ₺</div>
                                    <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Ödeme</div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <button type="button" onClick={() => setMasaPayment('cash')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: masaPayment === 'cash' ? '2px solid #059669' : '1px solid #D1D5DB', background: masaPayment === 'cash' ? '#ECFDF5' : 'white', fontWeight: 600, cursor: 'pointer' }}>Nakit</button>
                                        <button type="button" onClick={() => setMasaPayment('credit_card')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: masaPayment === 'credit_card' ? '2px solid #2563EB' : '1px solid #D1D5DB', background: masaPayment === 'credit_card' ? '#EFF6FF' : 'white', fontWeight: 600, cursor: 'pointer' }}>Kart</button>
                                    </div>
                                    <button type="button" onClick={() => { if (selectedTableNum == null) { alert('Lütfen masa seçin.'); return; } setMasaPreviewModal(true); }} disabled={masaSubmitting || masaCart.length === 0} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontWeight: 700, cursor: masaSubmitting || masaCart.length === 0 ? 'not-allowed' : 'pointer', opacity: masaSubmitting || masaCart.length === 0 ? 0.7 : 1 }}>Siparişi Gönder</button>
                                </div>

                                {/* Sağ: Masa seçimi */}
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Masa seçin</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '10px' }}>
                                        {Array.from({ length: tableCount }, (_, i) => i + 1).map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setSelectedTableNum(num)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    borderRadius: '12px',
                                                    border: selectedTableNum === num ? '2px solid #059669' : '1px solid #E5E7EB',
                                                    background: selectedTableNum === num ? '#ECFDF5' : 'white',
                                                    color: selectedTableNum === num ? '#047857' : '#374151',
                                                    fontWeight: 700,
                                                    fontSize: '1.1rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: selectedTableNum === num ? '0 0 0 2px #059669' : 'none'
                                                }}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedTableNum != null && <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#059669', fontWeight: 600 }}><i className="fa-solid fa-check" style={{ marginRight: '6px' }} />Masa {selectedTableNum} seçildi</div>}
                                </div>
                            </div>

                            {/* Masa ürün seçenekleri modal */}
                            {masaProductModal && (
                                <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setMasaProductModal(null)}>
                                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{masaProductModal.name}</h3>
                                            <button type="button" onClick={() => setMasaProductModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6B7280' }}>&times;</button>
                                        </div>
                                        {masaProductModal.image_url && <img src={masaProductModal.image_url} alt={masaProductModal.name} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />}
                                        {modalVariants.filter(v => v.product_id === masaProductModal.id).length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151', fontSize: '0.9rem' }}>Varyasyon</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {modalVariants.filter(v => v.product_id === masaProductModal.id).map(v => (
                                                        <label key={v.id} style={{ padding: '10px 14px', borderRadius: '10px', border: masaTempVariants.some(x => x.id === v.id) ? `2px solid ${restaurantThemeColor}` : '1px solid #D1D5DB', background: masaTempVariants.some(x => x.id === v.id) ? '#EFF6FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                                            <input type="checkbox" checked={masaTempVariants.some(x => x.id === v.id)} onChange={e => { if (e.target.checked) setMasaTempVariants(p => [...p, v]); else setMasaTempVariants(p => p.filter(x => x.id !== v.id)); }} style={{ display: 'none' }} />
                                                            {v.name} (+{v.price} ₺)
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {masaProductModal.ingredients && masaProductModal.ingredients.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151', fontSize: '0.9rem' }}>Çıkarılacak malzemeler</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {masaProductModal.ingredients.map((ing, idx) => (
                                                        <label key={idx} style={{ padding: '8px 12px', borderRadius: '20px', border: masaTempExcluded.includes(ing) ? '1px dashed #EF4444' : '1px solid #E5E7EB', background: masaTempExcluded.includes(ing) ? '#FEF2F2' : '#F3F4F6', color: masaTempExcluded.includes(ing) ? '#EF4444' : '#374151', textDecoration: masaTempExcluded.includes(ing) ? 'line-through' : 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                            <input type="checkbox" checked={!masaTempExcluded.includes(ing)} onChange={e => { if (!e.target.checked) setMasaTempExcluded(p => [...p, ing]); else setMasaTempExcluded(p => p.filter(i => i !== ing)); }} style={{ display: 'none' }} />
                                                            {ing}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <button type="button" onClick={() => onMasaProductAddClick(masaProductModal, masaTempVariants, masaTempExcluded)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: restaurantThemeColor, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
                                            Sepete Ekle · {masaProductModal.price + masaTempVariants.reduce((a, v) => a + v.price, 0)} ₺
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Masa hazır ayarlar modal */}
                            {masaPresetModalOpen && (
                                <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={skipMasaPreset}>
                                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '100%' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Hazır ayarlar</div>
                                        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>Seçenekler sipariş notuna ve fişe yazılır.</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                            {presetOptions.map(p => (
                                                <label key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: masaPresetSelected.has(p.id) ? `2px solid ${restaurantThemeColor}` : '1px solid #E5E7EB', background: masaPresetSelected.has(p.id) ? '#ECFDF5' : 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    <input type="checkbox" checked={masaPresetSelected.has(p.id)} onChange={e => setMasaPresetSelected(prev => { const next = new Set(prev); if (e.target.checked) next.add(p.id); else next.delete(p.id); return next; })} style={{ display: 'none' }} />
                                                    {p.label}
                                                </label>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="button" onClick={skipMasaPreset} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Atla</button>
                                            <button type="button" onClick={confirmMasaPreset} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: restaurantThemeColor, color: 'white', fontWeight: 700, cursor: 'pointer' }}>Tamam</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Masa sipariş önizleme modal */}
                            {masaPreviewModal && (
                                <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setMasaPreviewModal(false)}>
                                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '16px' }}>Sipariş Önizleme</div>
                                        <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
                                            Masa {selectedTableNum}
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            {masaCart.map((item, idx) => (
                                                <div key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #E5E7EB', fontSize: '0.9rem' }}>{item.quantity}x {item.product.name}{item.selectedVariants.length ? ' (+ ' + item.selectedVariants.map(v => v.name).join(', ') + ')' : ''}{item.excludedIngredients.length ? ' [Çıkar: ' + item.excludedIngredients.join(', ') + ']' : ''} = {item.finalPrice * item.quantity} ₺</div>
                                            ))}
                                        </div>
                                        {masaOrderNote && <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '12px' }}>Not: {masaOrderNote}</div>}
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '16px' }}>Toplam: {masaCart.reduce((a, x) => a + x.finalPrice * x.quantity, 0)} ₺ · {masaPayment === 'cash' ? 'Nakit' : 'Kart'}</div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button type="button" onClick={() => setMasaPreviewModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
                                            <button type="button" onClick={confirmAndSubmitMasa} disabled={masaSubmitting} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontWeight: 700, cursor: masaSubmitting ? 'not-allowed' : 'pointer' }}>{masaSubmitting ? 'Gönderiliyor...' : 'Onayla ve Gönder'}</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Ödeme yöntemi seç modal */}
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

                <iframe ref={printFrameRef} style={{ width: 0, height: 0, position: 'absolute', border: 'none', visibility: 'hidden' }} title="print" />
            </div>
        </>
    );
}
