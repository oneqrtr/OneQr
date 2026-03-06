'use client';

import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';

interface RawMaterial {
    id: string;
    restaurant_id: string;
    name: string;
    unit: string;
    current_stock: number;
    updated_at: string;
}

interface StockMovement {
    id: string;
    raw_material_id: string;
    movement_type: string;
    quantity: number;
    order_id: string | null;
    note: string | null;
    created_at: string;
    raw_material?: RawMaterial;
}

const UNITS = ['gr', 'ml', 'adet', 'kg', 'lt'];
const MOVEMENT_TYPES: { value: string; label: string }[] = [
    { value: 'intake', label: 'Giriş' },
    { value: 'adjustment', label: 'Manuel düzeltme' },
    { value: 'waste', label: 'Fire' },
    { value: 'order_consumption', label: 'Sipariş tüketimi' }
];

export default function RawMaterialsPage() {
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [activeTab, setActiveTab] = useState<'materials' | 'movements'>('materials');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formUnit, setFormUnit] = useState('adet');
    const [saving, setSaving] = useState(false);

    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [movementMaterialId, setMovementMaterialId] = useState<string | null>(null);
    const [movementType, setMovementType] = useState<'intake' | 'adjustment' | 'waste'>('intake');
    const [movementQuantity, setMovementQuantity] = useState<string>('');
    const [movementNote, setMovementNote] = useState('');
    const [movementSaving, setMovementSaving] = useState(false);

    const [movementFilterMaterial, setMovementFilterMaterial] = useState<string>('');
    const [movementFilterType, setMovementFilterType] = useState<string>('');

    const supabase = createClient();

    const fetchRawMaterials = async () => {
        if (!restaurantId) return;
        const { data } = await supabase
            .from('raw_materials')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('name');
        setRawMaterials(data || []);
    };

    const fetchMovements = async () => {
        if (!restaurantId) return;
        const { data: movData } = await supabase
            .from('stock_movements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);
        const list = (movData || []) as StockMovement[];
        const ids = [...new Set(list.map((m) => m.raw_material_id))];
        if (ids.length > 0) {
            const { data: mats } = await supabase.from('raw_materials').select('id, name, unit').in('id', ids);
            const matMap: Record<string, RawMaterial> = {};
            (mats || []).forEach((m) => { matMap[m.id] = m as RawMaterial; });
            list.forEach((m) => { m.raw_material = matMap[m.raw_material_id]; });
        }
        setMovements(list);
    };

    useEffect(() => {
        const init = async () => {
            const sup = createClient();
            const { data: { user } } = await sup.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            const { data: rest } = await sup.from('restaurants').select('id').eq('owner_id', user.id).single();
            if (!rest) {
                setLoading(false);
                return;
            }
            setRestaurantId(rest.id);
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (restaurantId) {
            fetchRawMaterials();
            fetchMovements();
        }
    }, [restaurantId]);

    const openAdd = () => {
        setEditingId(null);
        setFormName('');
        setFormUnit('adet');
        setModalOpen(true);
    };

    const openEdit = (m: RawMaterial) => {
        setEditingId(m.id);
        setFormName(m.name);
        setFormUnit(m.unit);
        setModalOpen(true);
    };

    const handleSaveMaterial = async () => {
        if (!restaurantId || !formName.trim()) return;
        setSaving(true);
        try {
            if (editingId) {
                await supabase
                    .from('raw_materials')
                    .update({ name: formName.trim(), unit: formUnit })
                    .eq('id', editingId);
            } else {
                await supabase.from('raw_materials').insert({
                    restaurant_id: restaurantId,
                    name: formName.trim(),
                    unit: formUnit,
                    current_stock: 0
                });
            }
            await fetchRawMaterials();
            setModalOpen(false);
        } catch (e) {
            alert('Kaydetme hatası.');
        } finally {
            setSaving(false);
        }
    };

    const openAddMovement = (materialId: string) => {
        setMovementMaterialId(materialId);
        setMovementType('intake');
        setMovementQuantity('');
        setMovementNote('');
        setMovementModalOpen(true);
    };

    const handleSaveMovement = async () => {
        if (!movementMaterialId || movementQuantity === '') return;
        const q = parseFloat(movementQuantity);
        if (isNaN(q) || q === 0) return;
        const mat = rawMaterials.find((m) => m.id === movementMaterialId);
        if (!mat) return;
        let delta = q;
        if (movementType === 'waste' || (movementType === 'adjustment' && q < 0)) {
            delta = -Math.abs(q);
        } else if (movementType === 'intake' || (movementType === 'adjustment' && q > 0)) {
            delta = Math.abs(q);
        }
        setMovementSaving(true);
        try {
            const newStock = Math.max(0, mat.current_stock + delta);
            const actualDelta = newStock - mat.current_stock;
            if (actualDelta === 0 && delta !== 0) {
                alert('Stok yetersiz. Çıkış miktarı mevcut stoktan fazla olamaz.');
                setMovementSaving(false);
                return;
            }
            await supabase.from('raw_materials').update({ current_stock: newStock, updated_at: new Date().toISOString() }).eq('id', movementMaterialId);
            await supabase.from('stock_movements').insert({
                raw_material_id: movementMaterialId,
                movement_type: movementType,
                quantity: actualDelta,
                note: movementNote.trim() || null
            });
            await fetchRawMaterials();
            await fetchMovements();
            setMovementModalOpen(false);
        } catch (e) {
            alert('Hareket kaydedilirken hata oluştu.');
        } finally {
            setMovementSaving(false);
        }
    };

    const filteredMovements = movements.filter((m) => {
        if (movementFilterMaterial && m.raw_material_id !== movementFilterMaterial) return false;
        if (movementFilterType && m.movement_type !== movementFilterType) return false;
        return true;
    });

    const getMovementTypeLabel = (t: string) => MOVEMENT_TYPES.find((x) => x.value === t)?.label ?? t;

    if (loading) {
        return (
            <>
                <Topbar title="Ham Maddeler" />
                <div className="content-wrapper"><div style={{ padding: '24px', textAlign: 'center' }}>Yükleniyor...</div></div>
            </>
        );
    }

    if (!restaurantId) {
        return (
            <>
                <Topbar title="Ham Maddeler" />
                <div className="content-wrapper"><div style={{ padding: '24px', textAlign: 'center' }}>Yetkisiz erişim.</div></div>
            </>
        );
    }

    return (
        <>
            <Topbar title="Ham Maddeler" />
            <div className="content-wrapper" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0 }}>Ham Maddeler</h1>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('materials')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: activeTab === 'materials' ? '2px solid #059669' : '1px solid #E5E7EB',
                                background: activeTab === 'materials' ? '#ECFDF5' : 'white',
                                color: activeTab === 'materials' ? '#059669' : '#374151',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Ham Maddeler
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('movements')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: activeTab === 'movements' ? '2px solid #059669' : '1px solid #E5E7EB',
                                background: activeTab === 'movements' ? '#ECFDF5' : 'white',
                                color: activeTab === 'movements' ? '#059669' : '#374151',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Stok Hareketleri
                        </button>
                        {activeTab === 'materials' && (
                            <button
                                type="button"
                                onClick={openAdd}
                                style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #059669', background: '#059669', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} /> Ham madde ekle
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === 'materials' && (
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, color: '#111827' }}>Ham madde listesi</div>
                        {rawMaterials.length === 0 ? (
                            <div style={{ padding: '24px', color: '#6B7280', textAlign: 'center' }}>Henüz ham madde tanımlanmamış. &quot;Ham madde ekle&quot; ile ekleyebilirsiniz.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ background: '#F9FAFB' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Ad</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Birim</th>
                                            <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Mevcut stok</th>
                                            <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rawMaterials.map((m) => (
                                            <tr key={m.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                                <td style={{ padding: '12px 16px', color: '#111827' }}>{m.name}</td>
                                                <td style={{ padding: '12px 16px', color: '#6B7280' }}>{m.unit}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{Number(m.current_stock)} {m.unit}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    <button type="button" onClick={() => openEdit(m)} style={{ marginRight: '8px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>Düzenle</button>
                                                    <button type="button" onClick={() => openAddMovement(m.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #059669', background: '#ECFDF5', color: '#059669', cursor: 'pointer', fontSize: '0.85rem' }}>Stok hareketi</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'movements' && (
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#111827', marginRight: '8px' }}>Stok hareketleri</span>
                            <select value={movementFilterMaterial} onChange={(e) => setMovementFilterMaterial(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.9rem' }}>
                                <option value="">Tüm ham maddeler</option>
                                {rawMaterials.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <select value={movementFilterType} onChange={(e) => setMovementFilterType(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.9rem' }}>
                                <option value="">Tüm tipler</option>
                                {MOVEMENT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        {filteredMovements.length === 0 ? (
                            <div style={{ padding: '24px', color: '#6B7280', textAlign: 'center' }}>Kayıt yok.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ background: '#F9FAFB' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Tarih</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Ham madde</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Tip</th>
                                            <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Miktar</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>Not</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMovements.map((mov) => (
                                            <tr key={mov.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                                <td style={{ padding: '12px 16px', color: '#6B7280' }}>{new Date(mov.created_at).toLocaleString('tr-TR')}</td>
                                                <td style={{ padding: '12px 16px', color: '#111827' }}>{mov.raw_material?.name ?? '-'}</td>
                                                <td style={{ padding: '12px 16px', color: '#374151' }}>{getMovementTypeLabel(mov.movement_type)}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: mov.quantity >= 0 ? '#059669' : '#DC2626' }}>{mov.quantity >= 0 ? '+' : ''}{mov.quantity}</td>
                                                <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: '0.85rem' }}>{mov.note || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {modalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => !saving && setModalOpen(false)}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>{editingId ? 'Ham madde düzenle' : 'Yeni ham madde'}</h3>
                        <div style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Ad</label>
                            <input type="text" className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Örn: Kıyma" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Birim</label>
                            <select value={formUnit} onChange={(e) => setFormUnit(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                                {UNITS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => !saving && setModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>İptal</button>
                            <button type="button" onClick={handleSaveMaterial} disabled={saving || !formName.trim()} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                        </div>
                    </div>
                </div>
            )}

            {movementModalOpen && movementMaterialId && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => !movementSaving && setMovementModalOpen(false)}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Stok hareketi</h3>
                        <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#6B7280' }}>{rawMaterials.find((m) => m.id === movementMaterialId)?.name} — Mevcut: {rawMaterials.find((m) => m.id === movementMaterialId)?.current_stock} {rawMaterials.find((m) => m.id === movementMaterialId)?.unit}</p>
                        <div style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Hareket tipi</label>
                            <select value={movementType} onChange={(e) => setMovementType(e.target.value as 'intake' | 'adjustment' | 'waste')} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                                <option value="intake">Giriş</option>
                                <option value="adjustment">Manuel düzeltme</option>
                                <option value="waste">Fire</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Miktar (pozitif girin; fire için çıkış uygulanır)</label>
                            <input type="number" step="any" min="0" className="form-input" value={movementQuantity} onChange={(e) => setMovementQuantity(e.target.value)} placeholder="0" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Not (isteğe bağlı)</label>
                            <input type="text" className="form-input" value={movementNote} onChange={(e) => setMovementNote(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => !movementSaving && setMovementModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>İptal</button>
                            <button type="button" onClick={handleSaveMovement} disabled={movementSaving || !movementQuantity} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontWeight: 600, cursor: movementSaving ? 'not-allowed' : 'pointer' }}>{movementSaving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
