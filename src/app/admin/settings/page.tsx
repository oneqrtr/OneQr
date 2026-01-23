'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const router = useRouter();

    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: rest } = await supabase
                .from('restaurants')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (rest) {
                setBusinessName(rest.name);
                setLogoUrl(rest.logo_url || '');
                setRestaurantId(rest.id);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!restaurantId) return;

        const { error } = await supabase
            .from('restaurants')
            .update({ name: businessName, logo_url: logoUrl })
            .eq('id', restaurantId);

        if (!error) {
            localStorage.setItem('oneqr_business_name', businessName);
            alert('Ayarlar kaydedildi.');
            router.refresh();
        } else {
            alert('Hata oluştu.');
        }
        setLoading(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('Bir resim seçmelisiniz.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
            setLogoUrl(data.publicUrl);
        } catch (error: any) {
            alert('Yükleme hatası: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Topbar title="İşletme Ayarları" />
            <div className="content-wrapper">
                <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '600px' }}>
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="form-label">İşletme Adı</label>
                            <input
                                className="form-input"
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Logo</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: '#F3F4F6',
                                    overflow: 'hidden',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2rem', color: '#9CA3AF' }}>📷</span>
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                        style={{ marginBottom: '8px' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                        {uploading ? 'Yükleniyor...' : 'Önerilen: 500x500px kare görsel'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
                                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
