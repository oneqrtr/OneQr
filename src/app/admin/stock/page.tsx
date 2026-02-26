'use client';

import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    category_id: string;
    name: string;
    stock_quantity: number | null;
    stock_updated_at: string | null;
}

interface ProductRow {
    product: Product;
    categoryName: string;
    sold: number;
}

const LOW_STOCK_THRESHOLD = 10;

export default function StockPage() {
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [soldByProduct, setSoldByProduct] = useState<Record<string, number>>({});
    const [isBulkStock, setIsBulkStock] = useState(false);
    const [bulkStocks, setBulkStocks] = useState<Record<string, number | ''>>({});
    const [savingBulk, setSavingBulk] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            const { data: rest } = await supabase
                .from('restaurants')
                .select('id')
                .eq('owner_id', user.id)
                .single();
            if (!rest) {
                setLoading(false);
                return;
            }
            setRestaurantId(rest.id);

            const { data: cats } = await supabase
                .from('categories')
                .select('id, name')
                .eq('restaurant_id', rest.id)
                .order('display_order', { ascending: true });
            setCategories(cats || []);

            const catIds = (cats || []).map((c) => c.id);
            if (catIds.length === 0) {
                setProducts([]);
                setSoldByProduct({});
                setLoading(false);
                return;
            }

            const { data: prods } = await supabase
                .from('products')
                .select('id, category_id, name, stock_quantity, stock_updated_at')
                .in('category_id', catIds)
                .order('display_order', { ascending: true });
            setProducts(prods || []);

            const { data: ordersData } = await supabase
                .from('orders')
                .select('items')
                .eq('restaurant_id', rest.id)
                .eq('status', 'completed');
            const sold: Record<string, number> = {};
            (ordersData || []).forEach((row: { items: unknown }) => {
                const items = Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? (() => { try { return JSON.parse(row.items); } catch { return []; } })() : []);
                items.forEach((item: { product_id?: string; quantity?: number }) => {
                    const pid = item?.product_id;
                    const qty = typeof item?.quantity === 'number' ? item.quantity : 0;
                    if (pid && qty > 0) sold[pid] = (sold[pid] || 0) + qty;
                });
            });
            setSoldByProduct(sold);
            setLoading(false);
        };
        fetchData();
    }, []);

    const catMap: Record<string, string> = {};
    categories.forEach((c) => { catMap[c.id] = c.name; });
    const rows: ProductRow[] = products.map((p) => ({
        product: p,
        categoryName: catMap[p.category_id] || '-',
        sold: soldByProduct[p.id] || 0
    }));

    const lowStockRows = rows.filter((r) => r.product.stock_quantity != null && r.product.stock_quantity <= LOW_STOCK_THRESHOLD);
    const topSold = [...rows].sort((a, b) => b.sold - a.sold).slice(0, 10);
    const maxSold = Math.max(1, ...topSold.map((r) => r.sold));

    const enterBulkMode = () => {
        const initial: Record<string, number | ''> = {};
        products.forEach((p) => { initial[p.id] = p.stock_quantity != null ? p.stock_quantity : ''; });
        setBulkStocks(initial);
        setIsBulkStock(true);
    };

    const handleBulkStockChange = (productId: string, value: string) => {
        setBulkStocks((prev) => ({ ...prev, [productId]: value === '' ? '' : (parseInt(value, 10) || 0) }));
    };

    const saveBulkStock = async () => {
        setSavingBulk(true);
        const toUpdate: { id: string; stock_quantity: number | null }[] = [];
        products.forEach((p) => {
            const v = bulkStocks[p.id];
            const newVal = v === '' ? null : (typeof v === 'number' ? (v >= 0 ? v : null) : (parseInt(String(v), 10) >= 0 ? parseInt(String(v), 10) : null));
            const cur = p.stock_quantity;
            if (newVal !== cur) toUpdate.push({ id: p.id, stock_quantity: newVal });
        });
        const now = new Date().toISOString();
        for (const u of toUpdate) {
            await supabase
                .from('products')
                .update({ stock_quantity: u.stock_quantity, stock_updated_at: u.stock_quantity != null ? now : null })
                .eq('id', u.id);
        }
        setSavingBulk(false);
        setIsBulkStock(false);
        setBulkStocks({});
        if (toUpdate.length > 0) {
            const catIds = categories.map((c) => c.id);
            const { data: prods } = await supabase.from('products').select('id, category_id, name, stock_quantity, stock_updated_at').in('category_id', catIds);
            if (prods) setProducts(prods);
        }
    };

    if (loading) {
        return (
            <>
                <Topbar title="Stok Yönetimi" />
                <div className="content-wrapper"><div style={{ padding: '24px', textAlign: 'center' }}>Yükleniyor...</div></div>
            </>
        );
    }

    if (!restaurantId) {
        return (
            <>
                <Topbar title="Stok Yönetimi" />
                <div className="content-wrapper"><div style={{ padding: '24px', textAlign: 'center' }}>Yetkisiz erişim.</div></div>
            </>
        );
    }

    return (
        <>
            <Topbar title="Stok Yönetimi" />
            <div className="content-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0 }}>Stok Yönetimi</h1>
                    {!isBulkStock ? (
                        <button
                            type="button"
                            onClick={enterBulkMode}
                            style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #059669', background: 'white', color: '#059669', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            <i className="fa-solid fa-boxes-stacked" style={{ marginRight: '8px' }} /> Toplu Stok Güncelle
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => { setIsBulkStock(false); setBulkStocks({}); }} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #D1D5DB', background: 'white', fontWeight: 600, cursor: 'pointer' }}>İptal</button>
                            <button type="button" onClick={saveBulkStock} disabled={savingBulk} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontWeight: 600, cursor: savingBulk ? 'not-allowed' : 'pointer' }}>{savingBulk ? 'Kaydediliyor...' : 'Kaydet'}</button>
                        </div>
                    )}
                </div>

                {lowStockRows.length > 0 && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                        <div style={{ fontWeight: 700, color: '#B91C1C', marginBottom: '10px' }}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }} />Stok azalan ürünler ({LOW_STOCK_THRESHOLD} ve altı)</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {lowStockRows.map((r) => (
                                <span key={r.product.id} style={{ padding: '6px 12px', background: 'white', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '0.9rem' }}>{r.product.name}: <strong>{r.product.stock_quantity}</strong></span>
                            ))}
                        </div>
                    </div>
                )}

                {topSold.length > 0 && (
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', marginBottom: '24px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '16px', color: '#374151' }}>En çok satılan ürünler</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topSold.map((r) => (
                                <div key={r.product.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ flex: '0 0 180px', fontSize: '0.9rem', color: '#111827' }}>{r.product.name}</div>
                                    <div style={{ flex: 1, height: '24px', background: '#E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(r.sold / maxSold) * 100}%`, height: '100%', background: '#059669', borderRadius: '6px', minWidth: r.sold > 0 ? '4px' : 0 }} />
                                    </div>
                                    <div style={{ flex: '0 0 50px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{r.sold} adet</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#111827' }}>Ürün stok listesi</div>
                    {rows.length === 0 ? (
                        <div style={{ padding: '24px', color: '#6B7280', textAlign: 'center' }}>Henüz ürün yok. <Link href="/admin/menu" style={{ color: '#2563EB' }}>Menü Yönetimi</Link>nden ürün ekleyebilirsiniz.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Ürün</th>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Kategori</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Mevcut stok</th>
                                        {isBulkStock && <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Yeni stok</th>}
                                        <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Satılan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.product.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                            <td style={{ padding: '12px 16px', color: '#111827' }}>{r.product.name}</td>
                                            <td style={{ padding: '12px 16px', color: '#6B7280' }}>{r.categoryName}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>{r.product.stock_quantity != null ? r.product.stock_quantity : '—'}</td>
                                            {isBulkStock && (
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', textAlign: 'right' }}
                                                        value={bulkStocks[r.product.id] ?? (r.product.stock_quantity ?? '')}
                                                        onChange={(e) => handleBulkStockChange(r.product.id, e.target.value)}
                                                        placeholder="—"
                                                    />
                                                </td>
                                            )}
                                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{r.sold}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
