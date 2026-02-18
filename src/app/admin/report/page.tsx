'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState, useRef } from 'react';
import Topbar from '@/components/Topbar';
import jsPDF from 'jspdf';

interface OrderRow {
    id: string;
    table_number?: number | null;
    total_amount: number;
    status: string;
    payment_method?: string;
    created_at: string;
    items?: { name?: string; quantity?: number; price?: number }[];
}

type PeriodType = 'day' | 'week' | 'month';

function getRange(period: PeriodType, date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    const end = new Date(date);
    if (period === 'day') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        end.setTime(start.getTime());
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
    }
    return { start, end };
}

function getPrevRange(period: PeriodType, date: Date): { start: Date; end: Date } {
    const prev = new Date(date);
    if (period === 'day') prev.setDate(prev.getDate() - 1);
    else if (period === 'week') prev.setDate(prev.getDate() - 7);
    else prev.setMonth(prev.getMonth() - 1);
    return getRange(period, prev);
}

export default function ReportPage() {
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [tableCount, setTableCount] = useState(10);
    const [period, setPeriod] = useState<PeriodType>('day');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [compareWithPrev, setCompareWithPrev] = useState(false);
    const [prevOrders, setPrevOrders] = useState<OrderRow[]>([]);
    const reportRef = useRef<HTMLDivElement>(null);

    const range = getRange(period, selectedDate);

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

            const { start: rangeStart, end: rangeEnd } = getRange(period, selectedDate);

            const { data: ordersData } = await supabase
                .from('orders')
                .select('id, table_number, total_amount, status, payment_method, created_at, items')
                .eq('restaurant_id', rest.id)
                .eq('source', 'restaurant')
                .gte('created_at', rangeStart.toISOString())
                .lte('created_at', rangeEnd.toISOString());

            setOrders(ordersData || []);

            if (compareWithPrev) {
                const { start: prevStart, end: prevEnd } = getPrevRange(period, selectedDate);
                const { data: prevData } = await supabase
                    .from('orders')
                    .select('id, table_number, total_amount, status, payment_method, created_at, items')
                    .eq('restaurant_id', rest.id)
                    .eq('source', 'restaurant')
                    .gte('created_at', prevStart.toISOString())
                    .lte('created_at', prevEnd.toISOString());
                setPrevOrders(prevData || []);
            } else {
                setPrevOrders([]);
            }
            setLoading(false);
        };

        fetchData();
    }, [period, selectedDate.getTime(), compareWithPrev]);

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
    const prevGrandTotal = prevOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const prevTotalCount = prevOrders.length;
    const totalDiff = grandTotal - prevGrandTotal;
    const totalDiffPct = prevGrandTotal > 0 ? Math.round((totalDiff / prevGrandTotal) * 100) : 0;
    const countDiff = totalCount - prevTotalCount;
    const countDiffPct = prevTotalCount > 0 ? Math.round((countDiff / prevTotalCount) * 100) : 0;

    const paymentBreakdown: Record<string, number> = {};
    orders.forEach((o) => {
        const method = o.payment_method === 'credit_card' ? 'credit_card' : o.payment_method === 'cash' ? 'cash' : 'other';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + o.total_amount;
    });
    const cashTotal = paymentBreakdown.cash || 0;
    const cardTotal = paymentBreakdown.credit_card || 0;
    const otherPaymentTotal = paymentBreakdown.other || 0;

    const productAgg: Record<string, { quantity: number; total: number }> = {};
    orders.forEach((o) => {
        const items = Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? (() => { try { return JSON.parse(o.items as string); } catch { return []; } })() : []);
        items.forEach((it: { name?: string; quantity?: number; price?: number }) => {
            const name = it?.name || 'Belirsiz';
            const qty = typeof it?.quantity === 'number' ? it.quantity : 0;
            const price = typeof it?.price === 'number' ? it.price : 0;
            if (!productAgg[name]) productAgg[name] = { quantity: 0, total: 0 };
            productAgg[name].quantity += qty;
            productAgg[name].total += qty * price;
        });
    });
    const productRows = Object.entries(productAgg)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total);

    const daysInRange: { date: Date; label: string; total: number }[] = [];
    if (period === 'day') {
        daysInRange.push({
            date: range.start,
            label: range.start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
            total: grandTotal
        });
    } else {
        const cur = new Date(range.start);
        while (cur <= range.end) {
            const dayStart = new Date(cur);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(cur);
            dayEnd.setHours(23, 59, 59, 999);
            const total = orders
                .filter((o) => {
                    const d = new Date(o.created_at);
                    return d >= dayStart && d <= dayEnd;
                })
                .reduce((s, o) => s + o.total_amount, 0);
            daysInRange.push({
                date: new Date(cur),
                label: cur.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
                total
            });
            cur.setDate(cur.getDate() + 1);
        }
    }
    const maxDayTotal = Math.max(1, ...daysInRange.map((d) => d.total));

    const periodLabel = period === 'day'
        ? selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        : period === 'week'
            ? `${range.start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${range.end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : selectedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    const stepDate = (delta: number) => {
        setSelectedDate((d) => {
            const x = new Date(d);
            if (period === 'day') x.setDate(x.getDate() + delta);
            else if (period === 'week') x.setDate(x.getDate() + delta * 7);
            else x.setMonth(x.getMonth() + delta);
            return x;
        });
    };

    const exportCSV = () => {
        const rows: string[][] = [
            ['Restoran Raporu', periodLabel],
            [],
            ['Özet', '', ''],
            ['Toplam Sipariş', String(totalCount), ''],
            ['Toplam Ciro (₺)', grandTotal.toLocaleString('tr-TR'), ''],
            ['Nakit (₺)', cashTotal.toLocaleString('tr-TR'), ''],
            ['Kart (₺)', cardTotal.toLocaleString('tr-TR'), ''],
            [],
            ['Masa Bazlı', 'Sipariş', 'Tutar (₺)'],
            ...tableStats.map((r) => ['Masa ' + r.tableNum, String(r.count), r.total.toLocaleString('tr-TR')]),
            ...(otherOrders.length ? [['Diğer', String(otherOrders.length), otherOrders.reduce((s, o) => s + o.total_amount, 0).toLocaleString('tr-TR')]] : []),
            [],
            ['Ürün Bazlı', 'Adet', 'Tutar (₺)'],
            ...productRows.map((r) => [r.name, String(r.quantity), r.total.toLocaleString('tr-TR')])
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapor-${period}-${selectedDate.toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportPDF = () => {
        if (!reportRef.current) return;
        const el = reportRef.current;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const lineH = 7;
        let y = 20;
        pdf.setFontSize(16);
        pdf.text('Restoran Raporu', 20, y);
        y += lineH;
        pdf.setFontSize(10);
        pdf.text(periodLabel, 20, y);
        y += lineH * 2;
        pdf.text(`Toplam Sipariş: ${totalCount}`, 20, y);
        y += lineH;
        pdf.text(`Toplam Ciro: ${grandTotal.toLocaleString('tr-TR')} ₺`, 20, y);
        y += lineH * 2;
        pdf.text('Masa Bazlı', 20, y);
        y += lineH;
        tableStats.forEach((r) => {
            pdf.text(`Masa ${r.tableNum}: ${r.count} sipariş, ${r.total.toLocaleString('tr-TR')} ₺`, 25, y);
            y += lineH;
        });
        y += lineH;
        pdf.text('Ürün Bazlı (ilk 20)', 20, y);
        y += lineH;
        productRows.slice(0, 20).forEach((r) => {
            pdf.text(`${r.name}: ${r.quantity} adet, ${r.total.toLocaleString('tr-TR')} ₺`, 25, y);
            y += lineH;
        });
        pdf.save(`rapor-${period}-${selectedDate.toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <>
            <Topbar title="Restoran Raporu" />
            <div style={{ padding: '24px' }} ref={reportRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111827', margin: 0 }}>Restoran Raporu</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as PeriodType)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                            <option value="day">Gün</option>
                            <option value="week">Hafta</option>
                            <option value="month">Ay</option>
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                            <button type="button" onClick={() => stepDate(-1)} style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#6B7280' }}>
                                <i className="fa-solid fa-chevron-left" />
                            </button>
                            <div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.9rem', color: '#374151', minWidth: '180px', textAlign: 'center' }}>
                                {periodLabel}
                            </div>
                            <button type="button" onClick={() => stepDate(1)} style={{ border: 'none', background: 'transparent', padding: '8px 12px', cursor: 'pointer', color: '#6B7280' }}>
                                <i className="fa-solid fa-chevron-right" />
                            </button>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={compareWithPrev} onChange={(e) => setCompareWithPrev(e.target.checked)} />
                            Önceki dönemle karşılaştır
                        </label>
                        <button type="button" onClick={exportCSV} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #059669', background: '#ECFDF5', color: '#047857', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                            <i className="fa-solid fa-file-csv" style={{ marginRight: '6px' }} /> Excel
                        </button>
                        <button type="button" onClick={exportPDF} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #2563EB', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                            <i className="fa-solid fa-file-pdf" style={{ marginRight: '6px' }} /> PDF
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
                                {compareWithPrev && (
                                    <div style={{ fontSize: '0.85rem', color: countDiff >= 0 ? '#059669' : '#DC2626', marginTop: '4px' }}>
                                        {countDiff >= 0 ? '+' : ''}{countDiff} ({countDiffPct >= 0 ? '+' : ''}{countDiffPct}%)
                                    </div>
                                )}
                            </div>
                            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Toplam Ciro</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>{grandTotal.toLocaleString('tr-TR')} ₺</div>
                                {compareWithPrev && (
                                    <div style={{ fontSize: '0.85rem', color: totalDiff >= 0 ? '#059669' : '#DC2626', marginTop: '4px' }}>
                                        {totalDiff >= 0 ? '+' : ''}{totalDiff.toLocaleString('tr-TR')} ₺ ({totalDiffPct >= 0 ? '+' : ''}{totalDiffPct}%)
                                    </div>
                                )}
                            </div>
                            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Nakit</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>{cashTotal.toLocaleString('tr-TR')} ₺</div>
                            </div>
                            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Kart</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D4ED8' }}>{cardTotal.toLocaleString('tr-TR')} ₺</div>
                            </div>
                            {otherPaymentTotal > 0 && (
                                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '4px' }}>Diğer ödeme</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6B7280' }}>{otherPaymentTotal.toLocaleString('tr-TR')} ₺</div>
                                </div>
                            )}
                        </div>

                        {daysInRange.length > 0 && (
                            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', marginBottom: '24px' }}>
                                <div style={{ fontWeight: 700, color: '#374151', marginBottom: '16px' }}>Günlük Ciro</div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
                                    {daysInRange.map((d, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '32px',
                                                    height: `${Math.max(4, (d.total / maxDayTotal) * 100)}px`,
                                                    background: '#059669',
                                                    borderRadius: '6px 6px 0 0',
                                                    minHeight: '4px'
                                                }}
                                                title={`${d.label}: ${d.total.toLocaleString('tr-TR')} ₺`}
                                            />
                                            <span style={{ fontSize: '0.7rem', color: '#6B7280', whiteSpace: 'nowrap' }}>{d.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: '24px' }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#374151' }}>Masa Bazlı Özet</div>
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

                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#374151' }}>Ürün Bazlı Satış</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Ürün</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Adet</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Tutar</th>
                                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>Bu dönemde ürün satışı yok</td>
                                        </tr>
                                    ) : (
                                        productRows.map((r, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>{r.name}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#374151' }}>{r.quantity}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{r.total.toLocaleString('tr-TR')} ₺</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#6B7280' }}>
                                                    {grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0}%
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
