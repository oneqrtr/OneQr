'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DEFAULT_COVERS = [
    { id: 'pizza', src: '/images/defaults/cover_pizza.png', label: 'Pizza & İtalyan' },
    { id: 'burger', src: '/images/defaults/cover_burger.png', label: 'Burger & Fast Food' },
    { id: 'steak', src: '/images/defaults/cover_steak.png', label: 'Steakhouse & Et' },
    { id: 'coffee', src: '/images/defaults/cover_coffee.png', label: 'Kafe & Kahve' },
    { id: 'dessert', src: '/images/defaults/cover_dessert.png', label: 'Tatlı & Pastane' },
    { id: 'healthy', src: '/images/defaults/cover_healthy.png', label: 'Sağlıklı & Salata' },
];

const THEME_COLORS = [
    { id: 'blue', value: '#2563EB', label: 'Mavi' },
    { id: 'red', value: '#DC2626', label: 'Kırmızı' },
    { id: 'orange', value: '#EA580C', label: 'Turuncu' },
    { id: 'green', value: '#059669', label: 'Yeşil' },
    { id: 'purple', value: '#7C3AED', label: 'Mor' },
    { id: 'black', value: '#111827', label: 'Siyah' },
];

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [description, setDescription] = useState('');

    // Theme States
    const [heroUrl, setHeroUrl] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#2563EB');
    const [heroTab, setHeroTab] = useState<'upload' | 'gallery'>('gallery');

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
                setPrimaryColor(rest.primary_color || '#2563EB');

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
                primary_color: primaryColor,
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
            alert('Hata oluştu. Lütfen veritabanı ayarlarınızı kontrol edin (primary_color sütunu ekli mi?).');
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

            // Bucket name fix if needed, assuming 'logos' or separate buckets
            const targetBucket = bucket === 'hero' ? 'hero' : 'logos';
            // Note: If 'hero' bucket doesn't exist, this might fail unless using a single public bucket.
            // Safe fallback to 'logos' if unsure, but code used 'logos' for logo upload.
            // Let's use 'logos' for all for simplicity unless user has specific 'banners' bucket.
            // Retaining original logic which passed 'logos' for logos. 
            // For Hero, let's try 'logos' as well to be safe, or just reuse the logic.
            const safeBucket = 'logos';

            const { error: uploadError } = await supabase.storage
                .from(safeBucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from(safeBucket).getPublicUrl(filePath);
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
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '40px',
                    maxWidth: '1200px'
                }}>
                    <style jsx>{`
                        @media (min-width: 1024px) {
                            div.content-wrapper > div {
                                grid-template-columns: 1fr 400px !important;
                            }
                        }
                    `}</style>

                    {/* LEFT COLUMN: FORM */}
                    <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <form onSubmit={handleSave}>
                            {/* General Info */}
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>Genel Bilgiler</h3>

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
                                            Önerilen: 500x500px kare görsel
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Theme Settings */}
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>Görünüm ve Tema</h3>

                            <div className="form-group">
                                <label className="form-label" style={{ marginBottom: '12px' }}>Tema Rengi</label>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {THEME_COLORS.map(color => (
                                        <button
                                            key={color.id}
                                            type="button"
                                            onClick={() => setPrimaryColor(color.value)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: color.value,
                                                border: primaryColor === color.value ? '3px solid white' : '1px solid transparent',
                                                boxShadow: primaryColor === color.value ? `0 0 0 2px ${color.value}` : 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            title={color.label}
                                        />
                                    ))}
                                    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            style={{
                                                width: '100%', height: '100%', opacity: 0, cursor: 'pointer', position: 'absolute', top: 0, left: 0, zIndex: 2
                                            }}
                                        />
                                        <div style={{
                                            width: '100%', height: '100%', borderRadius: '50%',
                                            background: `conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)`,
                                            border: '1px solid #ddd',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <i className="fa-solid fa-plus" style={{ color: 'white', textShadow: '0 0 2px black', fontSize: '12px' }}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '24px' }}>
                                <label className="form-label">Kapak Görseli (Hero)</label>

                                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                                    <button
                                        type="button"
                                        onClick={() => setHeroTab('gallery')}
                                        style={{
                                            padding: '8px 16px',
                                            borderBottom: heroTab === 'gallery' ? `2px solid ${primaryColor}` : '2px solid transparent',
                                            color: heroTab === 'gallery' ? primaryColor : '#6B7280',
                                            fontWeight: 500,
                                            background: 'none', border: 'none', borderBottom: heroTab === 'gallery' ? `2px solid ${primaryColor}` : 'none', cursor: 'pointer'
                                        }}
                                    >
                                        Hazır Şablonlar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setHeroTab('upload')}
                                        style={{
                                            padding: '8px 16px',
                                            borderBottom: heroTab === 'upload' ? `2px solid ${primaryColor}` : '2px solid transparent',
                                            color: heroTab === 'upload' ? primaryColor : '#6B7280',
                                            fontWeight: 500,
                                            background: 'none', border: 'none', borderBottom: heroTab === 'upload' ? `2px solid ${primaryColor}` : 'none', cursor: 'pointer'
                                        }}
                                    >
                                        Kendi Görselim
                                    </button>
                                </div>

                                {heroTab === 'gallery' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                                        {DEFAULT_COVERS.map((cover) => (
                                            <div
                                                key={cover.id}
                                                onClick={() => setHeroUrl(cover.src)}
                                                style={{
                                                    aspectRatio: '16/9',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    border: heroUrl === cover.src ? `3px solid ${primaryColor}` : '1px solid transparent',
                                                    position: 'relative'
                                                }}
                                            >
                                                <img src={cover.src} alt={cover.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                {heroUrl === cover.src && (
                                                    <div style={{ position: 'absolute', top: 4, right: 4, background: primaryColor, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <i className="fa-solid fa-check" style={{ color: 'white', fontSize: '10px' }}></i>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'logos', setHeroUrl)}
                                            disabled={uploading}
                                            style={{ width: '100%', padding: '10px', border: '1px dashed #D1D5DB', borderRadius: '8px' }}
                                        />
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '8px' }}>
                                            Bilgisayarınızdan bir görsel yükleyin.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Contact Info */}
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>İletişim</h3>

                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-phone" style={{ color: primaryColor }}></i>
                                        Arama Butonu
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isCallEnabled}
                                            onChange={(e) => setIsCallEnabled(e.target.checked)}
                                        />
                                    </div>
                                </div>
                                {isCallEnabled && (
                                    <input
                                        className="form-input"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        placeholder="0530 123 45 67"
                                        type="tel"
                                    />
                                )}
                            </div>

                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }}></i>
                                        Whatsapp Butonu
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isWhatsappEnabled}
                                            onChange={(e) => setIsWhatsappEnabled(e.target.checked)}
                                        />
                                    </div>
                                </div>
                                {isWhatsappEnabled && (
                                    <input
                                        className="form-input"
                                        value={whatsappNumber}
                                        onChange={e => setWhatsappNumber(e.target.value)}
                                        placeholder="5301234567 (Başına 0 koymadan)"
                                        type="tel"
                                    />
                                )}
                            </div>

                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-location-dot" style={{ color: '#EA4335' }}></i>
                                        Konum Butonu
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isLocationEnabled}
                                            onChange={(e) => setIsLocationEnabled(e.target.checked)}
                                        />
                                    </div>
                                </div>
                                {isLocationEnabled && (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                className="form-input"
                                                value={locationLat ?? ''}
                                                onChange={e => setLocationLat(parseFloat(e.target.value))}
                                                type="number"
                                                placeholder="Lat"
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                className="form-input"
                                                value={locationLng ?? ''}
                                                onChange={e => setLocationLng(parseFloat(e.target.value))}
                                                type="number"
                                                placeholder="Lng"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            className="btn btn-outline"
                                            style={{ height: '42px', padding: '0 12px' }}
                                            title="Konumumu Al"
                                        >
                                            <i className="fa-solid fa-location-crosshairs"></i>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" disabled={loading || uploading} style={{ background: primaryColor }}>
                                    {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <div className="preview-column">
                        <div style={{
                            position: 'sticky',
                            top: '100px',
                            background: '#111827',
                            border: '12px solid #111827',
                            borderRadius: '40px',
                            width: '320px',
                            height: '650px',
                            margin: '0 auto',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}>
                            {/* Phone Header */}
                            <div style={{ height: '30px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', fontSize: '10px', color: 'black' }}>
                                <span>12:00</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <i className="fa-solid fa-signal"></i>
                                    <i className="fa-solid fa-wifi"></i>
                                    <i className="fa-solid fa-battery-full"></i>
                                </div>
                            </div>

                            {/* App Content */}
                            <div style={{ background: '#F9FAFB', height: '100%', overflowY: 'auto' }}>
                                {/* Hero Section */}
                                <div style={{ position: 'relative', height: '180px', background: '#ddd' }}>
                                    {heroUrl ? (
                                        <img src={heroUrl} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: primaryColor, opacity: 0.1 }}></div>
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-40px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        padding: '4px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6' }}>
                                            {logoUrl ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div style={{ marginTop: '50px', textAlign: 'center', padding: '0 20px' }}>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>{businessName || 'İşletme Adı'}</h2>
                                    <p style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '4px' }}>{description || 'İşletme açıklaması burada görünecek.'}</p>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                                    {isCallEnabled && (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: primaryColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                            <i className="fa-solid fa-phone"></i>
                                        </div>
                                    )}
                                    {isWhatsappEnabled && (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                            <i className="fa-brands fa-whatsapp"></i>
                                        </div>
                                    )}
                                    {isLocationEnabled && (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EA4335', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                            <i className="fa-solid fa-location-dot"></i>
                                        </div>
                                    )}
                                </div>

                                {/* Placeholder Categories */}
                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                        {['Popüler', 'Ana Yemek', 'İçecekler', 'Tatlılar'].map((cat, i) => (
                                            <div key={i} style={{
                                                padding: '6px 16px',
                                                background: i === 0 ? primaryColor : 'white',
                                                color: i === 0 ? 'white' : '#374151',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                border: '1px solid #E5E7EB',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {cat}
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} style={{ background: 'white', padding: '12px', borderRadius: '12px', display: 'flex', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                <div style={{ width: '80px', height: '80px', background: '#F3F4F6', borderRadius: '8px' }}></div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ height: '14px', width: '80%', background: '#eee', borderRadius: '4px', marginBottom: '8px' }}></div>
                                                    <div style={{ height: '10px', width: '60%', background: '#f9fafb', borderRadius: '4px' }}></div>
                                                    <div style={{ marginTop: '12px', color: primaryColor, fontWeight: 700 }}>250 ₺</div>
                                                </div>
                                            </div>
                                        ))}
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
