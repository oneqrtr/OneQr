'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [description, setDescription] = useState('');


    // Notification & Printer States
    const [notificationSound, setNotificationSound] = useState('ding');
    const [printerHeader, setPrinterHeader] = useState('');
    const [printerFooter, setPrinterFooter] = useState('');
    const [printerCopyCount, setPrinterCopyCount] = useState(1);

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
    const [isInstagramEnabled, setIsInstagramEnabled] = useState(true);
    const [tiktokUrl, setTiktokUrl] = useState('');
    const [isTiktokEnabled, setIsTiktokEnabled] = useState(true);
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [isWebsiteEnabled, setIsWebsiteEnabled] = useState(true);
    const [googleReviewUrl, setGoogleReviewUrl] = useState('');
    const [isGoogleReviewEnabled, setIsGoogleReviewEnabled] = useState(true);

    const [wifiSsid, setWifiSsid] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');

    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [plan, setPlan] = useState('freemium');

    // Payment Methods State
    const [paymentSettings, setPaymentSettings] = useState({
        cash: true,
        credit_card: false,
        meal_card: {
            enabled: false,
            methods: [] as string[]
        },
        iban: {
            enabled: false,
            iban_no: '',
            account_name: ''
        }
    });

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

                // Notification & Printer
                setNotificationSound(rest.notification_sound || 'ding');
                setPrinterHeader(rest.printer_header || '');
                setPrinterFooter(rest.printer_footer || '');
                setPrinterCopyCount(rest.printer_copy_count || 1);

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
                setIsInstagramEnabled(rest.is_instagram_enabled ?? true);

                setTiktokUrl(rest.tiktok_url || '');
                setIsTiktokEnabled(rest.is_tiktok_enabled ?? true);

                // Default to custom subdomain if no website is set
                setWebsiteUrl(rest.website_url || `https://${rest.slug}.oneqr.tr`);
                setIsWebsiteEnabled(rest.is_website_enabled ?? true);

                setGoogleReviewUrl(rest.google_review_url || '');
                setIsGoogleReviewEnabled(rest.is_google_review_enabled ?? true);

                setWifiSsid(rest.wifi_ssid || '');
                setWifiPassword(rest.wifi_password || '');

                if (rest.payment_settings) {
                    // Merge with defaults to ensure structure
                    setPaymentSettings(prev => ({
                        ...prev,
                        ...rest.payment_settings,
                        meal_card: { ...prev.meal_card, ...(rest.payment_settings.meal_card || {}) },
                        iban: { ...prev.iban, ...(rest.payment_settings.iban || {}) }
                    }));
                }

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

                // theme_color managed in /admin/theme
                notification_sound: notificationSound,
                printer_header: printerHeader,
                printer_footer: printerFooter,
                printer_copy_count: printerCopyCount,
                phone_number: phoneNumber,
                whatsapp_number: whatsappNumber,
                is_call_enabled: isCallEnabled,
                is_whatsapp_enabled: isWhatsappEnabled,
                is_location_enabled: isLocationEnabled,
                location_lat: locationLat,
                location_lng: locationLng,
                instagram_url: isEligibleForAdvanced ? instagramUrl : null, // Prevent saving if not eligible (extra security)
                is_instagram_enabled: isEligibleForAdvanced ? isInstagramEnabled : false,

                tiktok_url: isEligibleForAdvanced ? tiktokUrl : null,
                is_tiktok_enabled: isEligibleForAdvanced ? isTiktokEnabled : false,

                website_url: isEligibleForAdvanced ? websiteUrl : null,
                is_website_enabled: isEligibleForAdvanced ? isWebsiteEnabled : false,

                google_review_url: isEligibleForAdvanced ? googleReviewUrl : null,
                is_google_review_enabled: isEligibleForAdvanced ? isGoogleReviewEnabled : false,

                wifi_ssid: isEligibleForAdvanced ? wifiSsid : null,
                wifi_password: isEligibleForAdvanced ? wifiPassword : null,

                payment_settings: paymentSettings
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

    // Test Sound Logic
    const playTestSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const playTone = (freq: number, startTime: number, duration: number, type: 'sine' | 'triangle' = 'sine') => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(startTime);
                gain.gain.setValueAtTime(0.5, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                osc.stop(startTime + duration);
            };

            const now = ctx.currentTime;

            if (notificationSound === 'ding') {
                playTone(600, now, 0.3);
                setTimeout(() => playTone(800, now + 0.2, 0.4), 200);
            } else if (notificationSound === 'bell') {
                playTone(880, now, 0.6, 'triangle');
            } else if (notificationSound === 'piano') {
                playTone(440, now, 0.4);
                setTimeout(() => playTone(554, now + 0.1, 0.4), 100);
                setTimeout(() => playTone(659, now + 0.2, 0.4), 200);
            }
        } catch (e) {
            console.error("Audio play failed", e);
            alert("Ses çalınamadı. Tarayıcı izinlerini kontrol edin.");
        }
    };

    // Test Print Logic
    const handleTestPrint = () => {
        window.print();
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




                        {/* Notification & Printer Section */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>Bildirim ve Yazıcı</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Bildirim Sesi</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        className="form-input"
                                        value={notificationSound}
                                        onChange={(e) => setNotificationSound(e.target.value)}
                                    >
                                        <option value="ding">Ding (Klasik)</option>
                                        <option value="bell">Zil Sesi</option>
                                        <option value="piano">Piyano Akoru</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={playTestSound}
                                        className="btn btn-outline"
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        <i className="fa-solid fa-play"></i> Test
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Yazdırılacak Nüsha Adeti</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    className="form-input"
                                    value={printerCopyCount}
                                    onChange={e => setPrinterCopyCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                                />
                                <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>Tek seferde kaç adet fiş basılsın? (Mutfak, Kasa vb.)</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Fiş Başlığı</label>
                                <input
                                    className="form-input"
                                    value={printerHeader}
                                    onChange={e => setPrinterHeader(e.target.value)}
                                    placeholder="Örn: Hoşgeldiniz"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fiş Alt Yazısı</label>
                                <input
                                    className="form-input"
                                    value={printerFooter}
                                    onChange={e => setPrinterFooter(e.target.value)}
                                    placeholder="Örn: Wifi: 1234 / Afiyet Olsun"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px', textAlign: 'right' }}>
                            <button
                                type="button"
                                onClick={handleTestPrint}
                                className="btn btn-outline"
                                style={{ fontSize: '0.9rem' }}
                            >
                                <i className="fa-solid fa-print"></i> Test Çıktısı Al
                            </button>
                        </div>

                        {/* Hidden Print Area for Testing */}
                        <div id="print-area" style={{ display: 'none' }}>
                            <style>{`
                                @media print {
                                    body * { visibility: hidden; }
                                    #print-area, #print-area * { visibility: visible; }
                                    #print-area { 
                                        display: block !important; 
                                        position: absolute; 
                                        left: 0; 
                                        top: 0; 
                                        width: 100%; 
                                    }
                                    .receipt-copy {
                                        page-break-after: always;
                                        border-bottom: 1px dashed #000;
                                        padding-bottom: 20px;
                                        margin-bottom: 20px;
                                    }
                                    .receipt-copy:last-child {
                                        page-break-after: auto;
                                        border-bottom: none;
                                    }
                                }
                            `}</style>
                            {Array.from({ length: printerCopyCount }).map((_, i) => (
                                <div key={i} className="receipt-copy" style={{ padding: '20px', fontFamily: 'monospace', textAlign: 'center' }}>
                                    <h1 style={{ fontSize: '24px', margin: '0 0 10px' }}>{businessName || 'İşletme Adı'}</h1>
                                    {printerHeader && <div style={{ fontSize: '16px', marginBottom: '10px' }}>{printerHeader}</div>}
                                    <h2 style={{ fontSize: '18px', borderBottom: '1px dashed black', paddingBottom: '10px', margin: '0 0 20px' }}>TEST FİŞİ #{i + 1}</h2>
                                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                                        <div>Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
                                        <div>Bu bir deneme çıktısıdır.</div>
                                    </div>
                                    <div style={{ borderBottom: '1px dashed black', marginBottom: '20px' }}></div>
                                    {printerFooter && <div style={{ fontSize: '14px', marginTop: '20px' }}>{printerFooter}</div>}
                                </div>
                            ))}
                        </div>

                        {/* Social & Wifi Section */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Dijital Kartvizit & Bağlantılar
                            {!isEligibleForAdvanced && <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '4px' }}><i className="fa-solid fa-lock"></i> Plusimum</span>}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                            {/* Instagram */}
                            <div className="form-group" style={{ opacity: isEligibleForAdvanced ? 1 : 0.6, background: '#F9FAFB', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="fa-brands fa-instagram" style={{ color: '#E1306C' }}></i> Instagram Linki
                                        {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706', fontSize: '0.8rem' }}></i>}
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isInstagramEnabled}
                                            onChange={(e) => setIsInstagramEnabled(e.target.checked)}
                                            disabled={!isEligibleForAdvanced}
                                        />
                                    </div>
                                </div>
                                {isInstagramEnabled && (
                                    <input
                                        className="form-input"
                                        value={instagramUrl}
                                        onChange={e => setInstagramUrl(e.target.value)}
                                        placeholder="https://instagram.com/kullaniciadi"
                                        disabled={!isEligibleForAdvanced}
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                )}
                            </div>
                            {/* Tiktok */}
                            <div className="form-group" style={{ opacity: isEligibleForAdvanced ? 1 : 0.6, background: '#F9FAFB', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="fa-brands fa-tiktok" style={{ color: '#000000' }}></i> TikTok Linki
                                        {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706', fontSize: '0.8rem' }}></i>}
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isTiktokEnabled}
                                            onChange={(e) => setIsTiktokEnabled(e.target.checked)}
                                            disabled={!isEligibleForAdvanced}
                                        />
                                    </div>
                                </div>
                                {isTiktokEnabled && (
                                    <input
                                        className="form-input"
                                        value={tiktokUrl}
                                        onChange={e => setTiktokUrl(e.target.value)}
                                        placeholder="https://tiktok.com/@kullaniciadi"
                                        disabled={!isEligibleForAdvanced}
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                )}
                            </div>
                            {/* Website */}
                            <div className="form-group" style={{ opacity: isEligibleForAdvanced ? 1 : 0.6, background: '#F9FAFB', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="fa-solid fa-globe" style={{ color: '#4B5563' }}></i> Web Sitesi
                                        {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706', fontSize: '0.8rem' }}></i>}
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isWebsiteEnabled}
                                            onChange={(e) => setIsWebsiteEnabled(e.target.checked)}
                                            disabled={!isEligibleForAdvanced}
                                        />
                                    </div>
                                </div>
                                {isWebsiteEnabled && (
                                    <>
                                        <input
                                            className="form-input"
                                            value={websiteUrl}
                                            onChange={e => setWebsiteUrl(e.target.value)}
                                            placeholder="https://ornekwebsitesi.com"
                                            disabled={!isEligibleForAdvanced}
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                        {!isEligibleForAdvanced && <div style={{ fontSize: '0.7rem', color: '#D97706', marginTop: '4px' }}>Plusimum'a özeldir.</div>}
                                    </>
                                )}
                            </div>

                            {/* Google Review */}
                            <div className="form-group" style={{ opacity: isEligibleForAdvanced ? 1 : 0.6, background: '#F9FAFB', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="fa-solid fa-star" style={{ color: '#F59E0B' }}></i> Google Yorum Linki
                                        {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706', fontSize: '0.8rem' }}></i>}
                                    </label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isGoogleReviewEnabled}
                                            onChange={(e) => setIsGoogleReviewEnabled(e.target.checked)}
                                            disabled={!isEligibleForAdvanced}
                                        />
                                    </div>
                                </div>
                                {isGoogleReviewEnabled && (
                                    <>
                                        <input
                                            className="form-input"
                                            value={googleReviewUrl}
                                            onChange={e => setGoogleReviewUrl(e.target.value)}
                                            placeholder="https://g.page/r/..."
                                            disabled={!isEligibleForAdvanced}
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                        <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '4px' }}>İşletmenizin Google Haritalar'daki "Yorum Yaz" linki.</div>
                                    </>
                                )}
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '24px', marginBottom: '16px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '8px', opacity: isEligibleForAdvanced ? 1 : 0.6 }}>
                            Wifi Bilgileri (Müşterileriniz için)
                            {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ color: '#D97706' }}></i>}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', opacity: isEligibleForAdvanced ? 1 : 0.6 }}>
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

                        {/* Payment Methods Section */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '40px', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-wallet" style={{ color: '#4B5563' }}></i> Ödeme Yöntemleri
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

                            {/* Cash & Credit Card */}
                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Temel Ödemeler</h4>

                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', cursor: 'pointer' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-money-bill-wave" style={{ color: '#10B981' }}></i> Nakit (Kapıda Ödeme)
                                    </span>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={paymentSettings.cash}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, cash: e.target.checked })}
                                        />
                                    </div>
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-regular fa-credit-card" style={{ color: '#3B82F6' }}></i> Kredi Kartı (Kapıda)
                                    </span>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={paymentSettings.credit_card}
                                            onChange={e => setPaymentSettings({ ...paymentSettings, credit_card: e.target.checked })}
                                        />
                                    </div>
                                </label>
                            </div>

                            {/* Meal Cards */}
                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-utensils" style={{ color: '#F59E0B' }}></i> Yemek Kartı
                                    </h4>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={paymentSettings.meal_card.enabled}
                                            onChange={e => setPaymentSettings({
                                                ...paymentSettings,
                                                meal_card: { ...paymentSettings.meal_card, enabled: e.target.checked }
                                            })}
                                        />
                                    </div>
                                </div>

                                {paymentSettings.meal_card.enabled && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', paddingLeft: '8px', borderLeft: '2px solid #E5E7EB' }}>
                                        {['Multinet', 'Sodexo', 'Ticket', 'Metropol', 'Setcard'].map(card => (
                                            <label key={card} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={paymentSettings.meal_card.methods.includes(card)}
                                                    onChange={e => {
                                                        const current = paymentSettings.meal_card.methods;
                                                        const updated = e.target.checked
                                                            ? [...current, card]
                                                            : current.filter(c => c !== card);
                                                        setPaymentSettings({
                                                            ...paymentSettings,
                                                            meal_card: { ...paymentSettings.meal_card, methods: updated }
                                                        });
                                                    }}
                                                />
                                                {card}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* IBAN / Bank Transfer */}
                            <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-building-columns" style={{ color: '#6366F1' }}></i> IBAN İle Ödeme
                                    </h4>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={paymentSettings.iban.enabled}
                                            onChange={e => setPaymentSettings({
                                                ...paymentSettings,
                                                iban: { ...paymentSettings.iban, enabled: e.target.checked }
                                            })}
                                        />
                                    </div>
                                </div>

                                {paymentSettings.iban.enabled && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: '4px', display: 'block' }}>Alıcı Ad Soyad / Ünvan</label>
                                            <input
                                                className="form-input"
                                                value={paymentSettings.iban.account_name}
                                                onChange={e => setPaymentSettings({
                                                    ...paymentSettings,
                                                    iban: { ...paymentSettings.iban, account_name: e.target.value }
                                                })}
                                                placeholder="Örn: Ahmet Yılmaz"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4B5563', marginBottom: '4px', display: 'block' }}>IBAN Numarası</label>
                                            <input
                                                className="form-input"
                                                value={paymentSettings.iban.iban_no}
                                                onChange={e => setPaymentSettings({
                                                    ...paymentSettings,
                                                    iban: { ...paymentSettings.iban, iban_no: e.target.value }
                                                })}
                                                placeholder="TR..."
                                            />
                                        </div>
                                    </div>
                                )}
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
                </div >
            </div >
        </>
    );
}
