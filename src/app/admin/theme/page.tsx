'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';

const COLORS = [
    { name: 'Mavi', value: '#2563EB' },
    { name: 'Kırmızı', value: '#DC2626' },
    { name: 'Turuncu', value: '#F59E0B' },
    { name: 'Yeşil', value: '#10B981' },
    { name: 'Mor', value: '#7C3AED' },
    { name: 'Siyah', value: '#111827' },
];

export default function ThemePage() {
    const [themeColor, setThemeColor] = useState('#2563EB');
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchTheme = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: rest } = await supabase
                .from('restaurants')
                .select('id, theme_color')
                .eq('owner_id', user.id)
                .single();

            if (rest) {
                setRestaurantId(rest.id);
                setThemeColor(rest.theme_color || '#2563EB');
            }
        };
        fetchTheme();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        if (restaurantId) {
            await supabase
                .from('restaurants')
                .update({ theme_color: themeColor })
                .eq('id', restaurantId);
            alert('Tema rengi güncellendi!');
        }
        setLoading(false);
    };

    return (
        <>
            <Topbar title="Tema Ayarları" />
            <div className="content-wrapper">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>

                    {/* Color Selection */}
                    <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '24px' }}>Renk Seçimi</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {COLORS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setThemeColor(c.value)}
                                    style={{
                                        height: '60px',
                                        background: c.value,
                                        borderRadius: '8px',
                                        border: themeColor === c.value ? '3px solid #000' : '1px solid transparent',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    {themeColor === c.value && <i className="fa-solid fa-check" style={{ color: 'white' }}></i>}
                                </button>
                            ))}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Özel Renk Kodu</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    type="color"
                                    value={themeColor}
                                    onChange={e => setThemeColor(e.target.value)}
                                    style={{ width: '50px', height: '40px', padding: '0', border: 'none', background: 'none' }}
                                />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={themeColor}
                                    onChange={e => setThemeColor(e.target.value)}
                                />
                            </div>
                        </div>

                        <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }} disabled={loading}>
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>

                    {/* Live Preview */}
                    <div>
                        <h3 style={{ marginBottom: '16px' }}>Canlı Önizleme</h3>
                        <div style={{
                            background: '#F9FAFB',
                            border: '8px solid #111827',
                            borderRadius: '24px',
                            height: '600px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {/* Mock Mobile Header */}
                            <div style={{ background: 'white', padding: '20px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                <div style={{ width: '48px', height: '48px', background: themeColor, borderRadius: '50%', margin: '0 auto 8px' }}></div>
                                <div style={{ fontWeight: 'bold' }}>İşletme Adı</div>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '4px', justifyContent: 'center' }}>
                                    <div style={{ background: themeColor, color: 'white', padding: '6px 12px', borderRadius: '12px', fontSize: '0.7rem' }}>Kategori 1</div>
                                    <div style={{ background: '#eee', padding: '6px 12px', borderRadius: '12px', fontSize: '0.7rem' }}>Kategori 2</div>
                                </div>
                            </div>
                            {/* Mock Content */}
                            <div style={{ padding: '20px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', borderLeft: `3px solid ${themeColor}`, paddingLeft: '8px' }}>Kategori 1</div>
                                <div style={{ background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Örnek Ürün</div>
                                        <div style={{ fontSize: '0.9rem', color: themeColor, fontWeight: 'bold' }}>120 ₺</div>
                                    </div>
                                </div>
                                <div style={{ background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Diğer Ürün</div>
                                        <div style={{ fontSize: '0.9rem', color: themeColor, fontWeight: 'bold' }}>85 ₺</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
