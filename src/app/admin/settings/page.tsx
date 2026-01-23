'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [description, setDescription] = useState('');
    const [heroUrl, setHeroUrl] = useState('');

    // Contact Info States
    const [phoneNumber, setPhoneNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [isCallEnabled, setIsCallEnabled] = useState(false);
    const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(false);

    // Location States
    const [isLocationEnabled, setIsLocationEnabled] = useState(false);
    const [locationLat, setLocationLat] = useState<number | null>(null);
    const [locationLng, setLocationLng] = useState<number | null>(null);

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
                setDescription(rest.description || '');
                setHeroUrl(rest.hero_image_url || '');

                // Contact info
                setPhoneNumber(rest.phone_number || '');
                setWhatsappNumber(rest.whatsapp_number || '');
                setIsCallEnabled(rest.is_call_enabled || false);
                setIsWhatsappEnabled(rest.is_whatsapp_enabled || false);

                // Location
                setIsLocationEnabled(rest.is_location_enabled || false);
                setLocationLat(rest.location_lat);
                setLocationLng(rest.location_lng);

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
            .update({
                name: businessName,
                logo_url: logoUrl,
                description: description,
                hero_image_url: heroUrl,
                phone_number: phoneNumber,
                whatsapp_number: whatsappNumber,
                is_call_enabled: isCallEnabled,
                is_whatsapp_enabled: isWhatsappEnabled,
                is_location_enabled: isLocationEnabled,
                location_lat: locationLat,
                location_lng: locationLng
            })
            .eq('id', restaurantId);

        if (!error) {
            localStorage.setItem('oneqr_business_name', businessName);
            alert('Ayarlar kaydedildi.');
            router.refresh();
        } else {
            console.error(error);
            alert('Hata oluştu. (Veritabanını güncellediğinizden emin olun)');
        }
        setLoading(false);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Tarayıcınız konum servisini desteklemiyor.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocationLat(latitude);
                setLocationLng(longitude);
                alert('Mevcut konumunuz başarıyla alındı!');
            },
            (error) => {
                console.error(error);
                alert('Konum alınamadı. Lütfen tarayıcı ayarlarından konuma izin verin.');
            }
        );
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, bucket: string, setter: (url: string) => void) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) {
                return;
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            const targetBucket = 'logos';

            const { error: uploadError } = await supabase.storage
                .from(targetBucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from(targetBucket).getPublicUrl(filePath);
            setter(data.publicUrl);
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
                        {/* Basic Info Section */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Genel Bilgiler</h3>

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
                            <label className="form-label">İşletme Açıklaması</label>
                            <textarea
                                className="form-input"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Lezzetli yemeklerimizin tadına bakın..."
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* Contact Info Section */}
                        <div style={{ marginTop: '32px', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>İletişim Butonları</h3>

                            {/* Phone Settings */}
                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-phone" style={{ color: '#4F46E5' }}></i>
                                        Arama Butonu
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            id="callToggle"
                                            checked={isCallEnabled}
                                            onChange={(e) => setIsCallEnabled(e.target.checked)}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                    </div>
                                </div>
                                {isCallEnabled && (
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Telefon Numarası</label>
                                        <input
                                            className="form-input"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                            placeholder="0530 123 45 67"
                                            type="tel"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Whatsapp Settings */}
                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }}></i>
                                        Whatsapp Butonu
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            id="whatsappToggle"
                                            checked={isWhatsappEnabled}
                                            onChange={(e) => setIsWhatsappEnabled(e.target.checked)}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                    </div>
                                </div>
                                {isWhatsappEnabled && (
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Whatsapp Numarası (Sıfırsız)</label>
                                        <input
                                            className="form-input"
                                            value={whatsappNumber}
                                            onChange={e => setWhatsappNumber(e.target.value)}
                                            placeholder="5301234567"
                                            type="tel"
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>Başına 0 koymadan, bitişik yazınız.</p>
                                    </div>
                                )}
                            </div>

                            {/* Location Settings */}
                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-location-dot" style={{ color: '#EA4335' }}></i>
                                        Konum Butonu
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            id="locationToggle"
                                            checked={isLocationEnabled}
                                            onChange={(e) => setIsLocationEnabled(e.target.checked)}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                    </div>
                                </div>
                                {isLocationEnabled && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label" style={{ fontSize: '0.85rem' }}>Enlem (Lat)</label>
                                                <input
                                                    className="form-input"
                                                    value={locationLat ?? ''}
                                                    onChange={e => setLocationLat(parseFloat(e.target.value))}
                                                    type="number"
                                                    placeholder="41.0082"
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label" style={{ fontSize: '0.85rem' }}>Boylam (Lng)</label>
                                                <input
                                                    className="form-input"
                                                    value={locationLng ?? ''}
                                                    onChange={e => setLocationLng(parseFloat(e.target.value))}
                                                    type="number"
                                                    placeholder="28.9784"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            className="btn btn-outline btn-sm"
                                            style={{ alignSelf: 'start' }}
                                        >
                                            <i className="fa-solid fa-location-crosshairs"></i> Mevcut Konumumu Al
                                        </button>
                                        <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                            Müşterileriniz bu butona bastığında Google Haritalar'da bu konuma yönlendirilir.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '32px' }}>
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
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2rem', color: '#9CA3AF' }}>📷</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'logos', setLogoUrl)}
                                        disabled={uploading}
                                        style={{ marginBottom: '8px', width: '100%' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                        {uploading ? 'Yükleniyor...' : 'Önerilen: 500x500px kare görsel'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Kapak Görseli (Hero)</label>
                            <div style={{ marginTop: '8px' }}>
                                {heroUrl && (
                                    <div style={{
                                        width: '100%',
                                        height: '150px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        marginBottom: '12px',
                                        border: '1px solid var(--border-color)',
                                        background: '#F3F4F6'
                                    }}>
                                        <img src={heroUrl} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'hero', setHeroUrl)}
                                    disabled={uploading}
                                    style={{ width: '100%' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>
                                    {uploading ? 'Yükleniyor...' : 'Sayfanın en üstünde görünecek büyük görsel.'}
                                </p>
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
