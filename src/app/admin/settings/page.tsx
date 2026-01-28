'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [description, setDescription] = useState('');

    // Contact Info States
    const [phoneNumber, setPhoneNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [isCallEnabled, setIsCallEnabled] = useState(false);
    const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(false);

    // Location States
    const [isLocationEnabled, setIsLocationEnabled] = useState(false);
    const [locationLat, setLocationLat] = useState<number | null>(null);
    const [locationLng, setLocationLng] = useState<number | null>(null);

    // Social Media & Wifi States
    const [instagramUrl, setInstagramUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [googleReviewUrl, setGoogleReviewUrl] = useState('');
    const [wifiSsid, setWifiSsid] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');

    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [plan, setPlan] = useState('freemium');
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
                setDescription(rest.description || '');
                setPlan(rest.plan || 'freemium');

                // Contact info
                setPhoneNumber(rest.phone_number || '');
                setWhatsappNumber(rest.whatsapp_number || '');
                setIsCallEnabled(rest.is_call_enabled || false);
                setIsWhatsappEnabled(rest.is_whatsapp_enabled || false);

                // Location
                setIsLocationEnabled(rest.is_location_enabled || false);
                setLocationLat(rest.location_lat);
                setLocationLng(rest.location_lng);

                // Social & Wifi
                setInstagramUrl(rest.instagram_url || '');
                setTwitterUrl(rest.twitter_url || '');
                // Default to custom subdomain if no website is set
                setWebsiteUrl(rest.website_url || `https://${rest.slug}.oneqr.tr`);
                setGoogleReviewUrl(rest.google_review_url || '');
                setWifiSsid(rest.wifi_ssid || '');
                setWifiPassword(rest.wifi_password || '');

                setRestaurantId(rest.id);
            }
        };
        fetchSettings();
    }, []);

    const isEligibleForAdvanced = plan === 'plusimum' || plan === 'trial' || plan === 'freemium';

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!restaurantId) return;

        const { error } = await supabase
            .from('restaurants')
            .update({
                name: businessName,
                description: description,
                phone_number: phoneNumber,
                whatsapp_number: whatsappNumber,
                is_call_enabled: isCallEnabled,
                is_whatsapp_enabled: isWhatsappEnabled,
                is_location_enabled: isLocationEnabled,
                location_lat: locationLat,
                location_lng: locationLng,
                instagram_url: isEligibleForAdvanced ? instagramUrl : null, // Prevent saving if not eligible (extra security)
                twitter_url: isEligibleForAdvanced ? twitterUrl : null,
                website_url: isEligibleForAdvanced ? websiteUrl : null,
                google_review_url: isEligibleForAdvanced ? googleReviewUrl : null,
                wifi_ssid: isEligibleForAdvanced ? wifiSsid : null,
                wifi_password: isEligibleForAdvanced ? wifiPassword : null
            })
            .eq('id', restaurantId);

        if (!error) {
            localStorage.setItem('oneqr_business_name', businessName);
            alert('Ayarlar kaydedildi.');
            router.refresh();
        } else {
            console.error(error);
            alert('Hata oluştu.');
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

    return (
        <>
            <Topbar title="İşletme Ayarları" />
            <div className="content-wrapper">
                <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '700px' }}>
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

                        {/* Social & Wifi Section */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Dijital Kartvizit & Bağlantılar
                            {!isEligibleForAdvanced && <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '4px' }}><i className="fa-solid fa-lock"></i> Plusimum</span>}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group" style={{ opacity: isEligibleForAdvanced ? 1 : 0.6 }}>
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><i className="fa-brands fa-instagram" style={{ marginRight: '8px', color: '#E1306C' }}></i> Instagram Linki</span>
                                    {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706' }}></i>}
                                </label>
                                <input
                                    className="form-input"
                                    value={instagramUrl}
                                    onChange={e => setInstagramUrl(e.target.value)}
                                    placeholder="https://instagram.com/kullaniciadi"
                                    disabled={!isEligibleForAdvanced}
                                />
                            </div>
                            <div className="form-group" style={{ opacity: isEligibleForAdvanced ? 1 : 0.6 }}>
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><i className="fa-brands fa-twitter" style={{ marginRight: '8px', color: '#1DA1F2' }}></i> Twitter / X Linki</span>
                                    {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706' }}></i>}
                                </label>
                                <input
                                    className="form-input"
                                    value={twitterUrl}
                                    onChange={e => setTwitterUrl(e.target.value)}
                                    placeholder="https://twitter.com/kullaniciadi"
                                    disabled={!isEligibleForAdvanced}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1', opacity: isEligibleForAdvanced ? 1 : 0.6 }}>
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><i className="fa-solid fa-globe" style={{ marginRight: '8px', color: '#4B5563' }}></i> Web Sitesi</span>
                                    {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706' }}></i>}
                                </label>
                                <input
                                    className="form-input"
                                    value={websiteUrl}
                                    onChange={e => setWebsiteUrl(e.target.value)}
                                    placeholder="https://ornekwebsitesi.com"
                                    disabled={!isEligibleForAdvanced}
                                />
                                {!isEligibleForAdvanced && <div style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '4px' }}>Web sitesi yönlendirmesi Plusimum pakete özeldir.</div>}
                            </div>

                            <div className="form-group" style={{ gridColumn: '1 / -1', opacity: isEligibleForAdvanced ? 1 : 0.6 }}>
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><i className="fa-solid fa-star" style={{ marginRight: '8px', color: '#F59E0B' }}></i> Google Yorum Linki</span>
                                    {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706' }}></i>}
                                </label>
                                <input
                                    className="form-input"
                                    value={googleReviewUrl}
                                    onChange={e => setGoogleReviewUrl(e.target.value)}
                                    placeholder="https://g.page/r/..."
                                    disabled={!isEligibleForAdvanced}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>İşletmenizin Google Haritalar'daki "Yorum Yaz" linki.</div>
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '24px', marginBottom: '16px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '8px', opacity: isEligibleForAdvanced ? 1 : 0.6 }}>
                            Wifi Bilgileri (Müşterileriniz için)
                            {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706' }}></i>}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ opacity: isEligibleForAdvanced ? 1 : 0.6 }}>
                            <div className="form-group">
                                <label className="form-label">Wifi Adı (SSID)</label>
                                <input
                                    className="form-input"
                                    value={wifiSsid}
                                    onChange={e => setWifiSsid(e.target.value)}
                                    placeholder="Örn: Kafe_Misafir"
                                    disabled={!isEligibleForAdvanced}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Wifi Şifresi</label>
                                <input
                                    className="form-input"
                                    value={wifiPassword}
                                    onChange={e => setWifiPassword(e.target.value)}
                                    placeholder="Wifi şifreniz"
                                    disabled={!isEligibleForAdvanced}
                                />
                            </div>
                        </div>


                        {/* Contact Info */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>İletişim Butonları</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>Bu butonlar menünüzde ve dijital kartvizitinizde görünür.</p>

                        <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fa-solid fa-phone" style={{ color: '#4B5563' }}></i>
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
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
