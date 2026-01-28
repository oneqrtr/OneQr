'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function DigitalCardPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [restaurant, setRestaurant] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWifi, setShowWifi] = useState(false);

    useEffect(() => {
        const fetchRest = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('restaurants')
                .select('*')
                .eq('slug', slug)
                .single();

            if (data) setRestaurant(data);
            setLoading(false);
        }
        if (slug) fetchRest();
    }, [slug]);

    const addToContacts = () => {
        if (!restaurant) return;

        // Simple vCard generator
        const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${restaurant.name}
ORG:${restaurant.name}
TEL:${restaurant.phone_number}
URL:${restaurant.website_url || `https://oneqr.tr/menu/${slug}`}
NOTE:${restaurant.description || ''}
END:VCARD`;

        const blob = new Blob([vCardData], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}.vcf`;
        a.click();
    };

    const copyWifi = () => {
        if (restaurant?.wifi_password) {
            navigator.clipboard.writeText(restaurant.wifi_password);
            alert('Wifi şifresi kopyalandı!');
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
    if (!restaurant) return <div className="flex h-screen items-center justify-center">Kartvizit Bulunamadı</div>;

    const themeColor = restaurant.theme_color || '#2563EB';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f3f4f6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    background: 'white',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'fit-content'
                }}>

                    {/* Header Background */}
                    <div style={{
                        height: '150px',
                        background: restaurant.hero_image_url ? `url(${restaurant.hero_image_url}) center/cover` : themeColor,
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))'
                        }} />
                    </div>

                    {/* Profile Section - Overlapping Header */}
                    <div style={{
                        padding: '0 24px',
                        marginTop: '-60px',
                        position: 'relative',
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '4px solid white',
                            background: 'white',
                            margin: '0 auto 16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: themeColor
                        }}>
                            {restaurant.logo_url ? (
                                <img src={restaurant.logo_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                restaurant.name.charAt(0)
                            )}
                        </div>

                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '8px', lineHeight: 1.2 }}>
                            {restaurant.name}
                        </h1>
                        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                            {restaurant.description}
                        </p>
                    </div>

                    {/* Primary Action */}
                    <div style={{ padding: '0 24px 24px' }}>
                        <button
                            onClick={addToContacts}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: '#111827',
                                color: 'white',
                                borderRadius: '12px',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginBottom: '16px'
                            }}>
                            <i className="fa-solid fa-address-book"></i> Rehbere Kaydet
                        </button>

                        <Link href={`/menu/${slug}`} style={{ textDecoration: 'none' }}>
                            <button
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: themeColor,
                                    color: 'white',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
                                }}>
                                <i className="fa-solid fa-utensils"></i> Menüyü İncele
                            </button>
                        </Link>
                    </div>

                    {/* Quick Actions Grid */}
                    <div style={{
                        padding: '0 24px 24px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '12px'
                    }}>
                        {restaurant.is_call_enabled && restaurant.phone_number && (
                            <a href={`tel:${restaurant.phone_number}`} style={{ textDecoration: 'none' }}>
                                <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#2563EB', cursor: 'pointer' }}>
                                    <i className="fa-solid fa-phone" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}></i>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ara</span>
                                </div>
                            </a>
                        )}

                        {restaurant.is_whatsapp_enabled && restaurant.whatsapp_number && (
                            <a href={`https://wa.me/${restaurant.whatsapp_number}`} target="_blank" style={{ textDecoration: 'none' }}>
                                <div style={{ background: '#ECFDF5', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#059669', cursor: 'pointer' }}>
                                    <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}></i>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>WhatsApp</span>
                                </div>
                            </a>
                        )}

                        {restaurant.is_location_enabled && restaurant.location_lat && (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${restaurant.location_lat},${restaurant.location_lng}`} target="_blank" style={{ textDecoration: 'none' }}>
                                <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#DC2626', cursor: 'pointer' }}>
                                    <i className="fa-solid fa-location-dot" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}></i>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Konum</span>
                                </div>
                            </a>
                        )}
                    </div>

                    {/* Social Media List */}
                    <div style={{ padding: '0 24px 24px' }}>
                        {(restaurant.instagram_url || restaurant.twitter_url || restaurant.website_url) && (
                            <div style={{ background: '#F9FAFB', borderRadius: '12px', overflow: 'hidden' }}>
                                {restaurant.instagram_url && (
                                    <a href={restaurant.instagram_url} target="_blank" style={{ display: 'flex', alignItems: 'center', padding: '16px', textDecoration: 'none', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                                        <i className="fa-brands fa-instagram" style={{ fontSize: '1.2rem', width: '32px', color: '#E1306C' }}></i>
                                        <span style={{ fontWeight: 500 }}>Instagram'da Takip Et</span>
                                        <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#9CA3AF' }}></i>
                                    </a>
                                )}
                                {restaurant.twitter_url && (
                                    <a href={restaurant.twitter_url} target="_blank" style={{ display: 'flex', alignItems: 'center', padding: '16px', textDecoration: 'none', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>
                                        <i className="fa-brands fa-twitter" style={{ fontSize: '1.2rem', width: '32px', color: '#1DA1F2' }}></i>
                                        <span style={{ fontWeight: 500 }}>Twitter / X</span>
                                        <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#9CA3AF' }}></i>
                                    </a>
                                )}
                                {restaurant.website_url && (
                                    <a href={restaurant.website_url} target="_blank" style={{ display: 'flex', alignItems: 'center', padding: '16px', textDecoration: 'none', color: '#374151' }}>
                                        <i className="fa-solid fa-globe" style={{ fontSize: '1.2rem', width: '32px', color: '#6B7280' }}></i>
                                        <span style={{ fontWeight: 500 }}>Web Sitesini Ziyaret Et</span>
                                        <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#9CA3AF' }}></i>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Wifi Card (Toggle) */}
                        {restaurant.wifi_ssid && (
                            <div style={{ marginTop: '16px' }}>
                                <div
                                    onClick={() => setShowWifi(!showWifi)}
                                    style={{
                                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                        color: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <i className="fa-solid fa-wifi" style={{ fontSize: '1.2rem' }}></i>
                                        <span style={{ fontWeight: 600 }}>Wifi Şifresi</span>
                                    </div>
                                    <i className={`fa-solid fa-chevron-${showWifi ? 'up' : 'down'}`}></i>
                                </div>

                                {showWifi && (
                                    <div style={{
                                        background: '#F5F3FF',
                                        marginTop: '8px',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        border: '1px solid #DDD6FE'
                                    }}>
                                        <div style={{ color: '#5B21B6', fontSize: '0.9rem', marginBottom: '4px' }}>Wifi Adı (SSID)</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4C1D95', marginBottom: '16px' }}>{restaurant.wifi_ssid}</div>

                                        <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #E5E7EB' }}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', paddingLeft: '8px' }}>{restaurant.wifi_password}</span>
                                            <button onClick={copyWifi} style={{ padding: '8px 12px', background: '#F3F4F6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#374151' }}>
                                                <i className="fa-regular fa-copy"></i>
                                            </button>
                                        </div>
                                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                                            <QRCodeSVG value={`WIFI:T:WPA;S:${restaurant.wifi_ssid};P:${restaurant.wifi_password};;`} size={120} />
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '8px' }}>Otomatik bağlanmak için okutun</div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', padding: '24px', textAlign: 'center', background: '#e5e7eb', borderTop: '1px solid #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
                <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                    Powered by <a href="https://oneqr.tr" target="_blank" style={{ color: '#374151', fontWeight: 'bold', textDecoration: 'none' }}>OneQR</a>
                </div>
            </div>

        </div>
    );
}
