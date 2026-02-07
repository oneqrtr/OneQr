'use client';
import { createClient } from '@/lib/supabase'; // Import at top level for cleaner usage
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const [businessName, setBusinessName] = useState('');
    const [businessSlug, setBusinessSlug] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState('');
    const [plan, setPlan] = useState('trial');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Notification State
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationSound, setNotificationSound] = useState('ding');
    const notificationSoundRef = useRef('ding');
    const audioContextRef = useRef<AudioContext | null>(null);

    const pathname = usePathname();

    // Update ref when state changes
    useEffect(() => {
        notificationSoundRef.current = notificationSound;
    }, [notificationSound]);

    // Reset unread count when on orders page
    useEffect(() => {
        if (pathname === '/admin/orders') {
            setUnreadCount(0);
        }
    }, [pathname]);

    const playNotificationSound = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

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
            const sound = notificationSoundRef.current;

            if (sound === 'ding') {
                playTone(600, now, 0.3);
                setTimeout(() => playTone(800, now + 0.2, 0.4), 200);
            } else if (sound === 'bell') {
                playTone(880, now, 0.6, 'triangle');
            } else if (sound === 'piano') {
                playTone(440, now, 0.4);
                setTimeout(() => playTone(554, now + 0.1, 0.4), 100);
                setTimeout(() => playTone(659, now + 0.2, 0.4), 200);
            }
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        // Try local storage first for speed
        const savedName = localStorage.getItem('oneqr_business_name');
        if (savedName) setBusinessName(savedName);

        let channel: any = null;

        // Fetch source of truth
        const fetchName = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserEmail(user.email || '');

            const { data: rest } = await supabase
                .from('restaurants')
                .select('id, name, slug, plan, logo_url, notification_sound')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (rest) {
                setBusinessName(rest.name);
                setBusinessSlug(rest.slug);
                setLogoUrl(rest.logo_url);
                setPlan(rest.plan || 'trial');
                setNotificationSound(rest.notification_sound || 'ding');
                localStorage.setItem('oneqr_business_name', rest.name);

                // Subscribe to orders
                channel = supabase
                    .channel('sidebar-orders-channel')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'orders',
                            filter: `restaurant_id=eq.${rest.id}`
                        },
                        (payload) => {
                            // Play sound always
                            playNotificationSound();

                            // Check if valid date (today) - usually valid since it's realtime insert
                            // Add badge if NOT on orders page
                            if (window.location.pathname !== '/admin/orders') {
                                setUnreadCount(prev => prev + 1);
                            }
                        }
                    )
                    .subscribe();
            }
        };
        fetchName();

        return () => {
            if (channel) {
                const supabase = createClient();
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const isActive = (path: string) => {
        if (path === '/admin') {
            return pathname === '/admin';
        }
        return pathname?.startsWith(path);
    };

    const [isMobileExpanded, setIsMobileExpanded] = useState(false);

    return (
        <>
            <aside className={`sidebar ${isMobileExpanded ? 'expanded' : ''}`}>
                <div className="sidebar-header" style={{ height: '260px', padding: 0 }}>
                    <Link href="/admin" className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            background: 'white',
                            borderRadius: '16px',
                            padding: '10px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img
                                src={logoUrl || "/favicon.ico"}
                                alt="Logo"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    </Link>

                </div>

                <nav className="sidebar-nav" style={{ marginTop: '20px' }}>
                    <Link href="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                        <span className="nav-icon"><i className="fa-solid fa-chart-pie"></i></span>
                        <span>Panel</span>
                    </Link>
                    <Link href="/admin/orders" className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`} style={{ position: 'relative' }}>
                        <span className="nav-icon"><i className="fa-solid fa-bell"></i></span>
                        <span>Siparişler</span>
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: '#EF4444',
                                color: 'white',
                                borderRadius: '999px',
                                padding: '2px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                    <Link href="/admin/menu" className={`nav-item ${isActive('/admin/menu') ? 'active' : ''}`}>
                        <span className="nav-icon"><i className="fa-solid fa-utensils"></i></span>
                        <span>Menü Yönetimi</span>
                    </Link>
                    <Link href="/admin/qr" className={`nav-item ${isActive('/admin/qr') ? 'active' : ''}`}>
                        <span className="nav-icon"><i className="fa-solid fa-qrcode"></i></span>
                        <span>QR Kodlar</span>
                    </Link>
                    <Link href="/admin/theme" className={`nav-item ${isActive('/admin/theme') ? 'active' : ''}`}>
                        <span className="nav-icon"><i className="fa-solid fa-palette"></i></span>
                        <span>Tema</span>
                    </Link>
                    <Link href="/admin/settings/billing" className={`nav-item ${isActive('/admin/settings/billing') ? 'active' : ''}`}>
                        <span className="nav-icon"><i className="fa-solid fa-credit-card"></i></span>
                        <span>Abonelik</span>
                    </Link>
                    <Link href="/admin/settings" className={`nav-item ${isActive('/admin/settings') && !isActive('/admin/settings/billing') ? 'active' : ''}`}>
                        <span className="nav-icon"><i className="fa-solid fa-gear"></i></span>
                        <span>Ayarlar</span>
                    </Link>
                </nav>
                <div className="sidebar-footer">
                    <div
                        className="user-profile"
                        onClick={() => setIsModalOpen(true)}
                        style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '12px', borderRadius: '12px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div className="avatar" style={{ background: '#374151', color: 'white' }}>{businessName.substring(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{businessName}</div>
                            <div style={{ color: '#2563EB', fontSize: '0.75rem', fontWeight: 500 }}>
                                {plan === 'plusimum' ? 'Plusimum Plan' : plan === 'premium' ? 'Premium Plan' : plan === 'freemium' ? 'Freemium' : plan === 'trial' ? 'Deneme Sürümü' : 'Paket Seçilmedi'}
                            </div>
                        </div>
                        <i className="fa-solid fa-chevron-up" style={{ fontSize: '0.8rem', color: '#9CA3AF' }}></i>
                    </div>
                </div>

                {/* Plan Details Modal */}
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        {/* Backdrop */}
                        <div
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                        ></div>

                        {/* Modal Content */}
                        <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '900px', position: 'relative', zIndex: 101, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', minHeight: '500px' }}>

                                {/* Left Sidebar: User Info */}
                                <div style={{ background: '#F9FAFB', padding: '32px', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                                        <div style={{ width: '80px', height: '80px', background: '#374151', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, margin: '0 auto 16px' }}>
                                            {businessName.substring(0, 1).toUpperCase()}
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{businessName}</h3>
                                        <div style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '4px' }}>{userEmail}</div>
                                    </div>

                                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: 'auto' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '4px' }}>Mevcut Plan</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: plan === 'trial' ? '#D97706' : '#059669' }}>
                                            {plan === 'plusimum' ? 'Plusimum' : plan === 'premium' ? 'Premium' : plan === 'freemium' ? 'Freemium' : 'Deneme Sürümü'}
                                        </div>
                                        {plan === 'trial' && <div style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '4px' }}>Özelliklerin tadını çıkarın!</div>}
                                    </div>

                                    <button
                                        onClick={() => window.location.href = '/auth/logout'}
                                        style={{ marginTop: '24px', padding: '12px', width: '100%', borderRadius: '8px', border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Çıkış Yap
                                    </button>
                                </div>

                                {/* Right Content: Plans */}
                                <div style={{ padding: '40px', overflowY: 'auto', maxHeight: '90vh' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Abonelik Planları</h2>
                                        <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '1.2rem' }}>
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gap: '24px' }}>

                                        {/* Pro Plan (Featured) */}
                                        <div style={{ border: '2px solid #2563EB', borderRadius: '16px', padding: '24px', position: 'relative', background: '#EFF6FF' }}>
                                            <div style={{ position: 'absolute', top: '-12px', right: '24px', background: '#2563EB', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                EN POPÜLER
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E40AF' }}>Yıllık Paket</h3>
                                                    <div style={{ fontSize: '0.9rem', color: '#3B82F6' }}>12 Ay Kesintisiz Hizmet</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>999 ₺</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>/yıl + KDV</div>
                                                </div>
                                            </div>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'grid', gap: '12px' }}>
                                                {['Sınırsız Ürün & Kategori', 'Gelişmiş İstatistikler', '7/24 Teknik Destek', 'Kendi Domain Adresiniz'].map((feat, i) => (
                                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#374151' }}>
                                                        <i className="fa-solid fa-check" style={{ color: '#2563EB' }}></i> {feat}
                                                    </li>
                                                ))}
                                            </ul>
                                            {plan === 'yearly' || plan === 'pro' ? (
                                                <button disabled style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#10B981', color: 'white', border: 'none', fontWeight: 600, cursor: 'default' }}>
                                                    Aktif Plan
                                                </button>
                                            ) : (
                                                <Link href="/admin/settings/billing" onClick={() => setIsModalOpen(false)} style={{ display: 'block', textAlign: 'center', width: '100%', padding: '12px', borderRadius: '8px', background: '#2563EB', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                                                    Yıllık Plana Geç
                                                </Link>
                                            )}
                                        </div>

                                        {/* Monthly Plan */}
                                        <div style={{ border: '1px solid #E5E7EB', borderRadius: '16px', padding: '24px', background: 'white' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Aylık Paket</h3>
                                                    <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Esnek Ödeme</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>149 ₺</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>/ay + KDV</div>
                                                </div>
                                            </div>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'grid', gap: '12px' }}>
                                                {['Sınırsız Ürün', 'Temel İstatistikler'].map((feat, i) => (
                                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#374151' }}>
                                                        <i className="fa-solid fa-check" style={{ color: '#059669' }}></i> {feat}
                                                    </li>
                                                ))}
                                            </ul>
                                            {plan === 'monthly' ? (
                                                <button disabled style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#10B981', color: 'white', border: 'none', fontWeight: 600, cursor: 'default' }}>
                                                    Aktif Plan
                                                </button>
                                            ) : (
                                                <Link href="/admin/settings/billing" onClick={() => setIsModalOpen(false)} style={{ display: 'block', textAlign: 'center', width: '100%', padding: '12px', borderRadius: '8px', background: 'white', border: '1px solid #2563EB', color: '#2563EB', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                                                    Aylık Plana Geç
                                                </Link>
                                            )}
                                        </div>

                                    </div>
                                    <p style={{ marginTop: '32px', fontSize: '0.8rem', color: '#9CA3AF', textAlign: 'center' }}>
                                        Ödeme işlemleri güvenli altyapı üzerinden gerçekleştirilmektedir. Fiyatlara KDV dahil değildir.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Toggle Button (Triangle/Chevron) */}
                <button
                    className="mobile-toggle-btn"
                    onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                    style={{
                        display: 'none', // Hidden on desktop via CSS, shown on mobile
                        position: 'absolute',
                        right: '-24px', // Stick out
                        top: '80px',
                        width: '24px',
                        height: '40px',
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderLeft: 'none',
                        borderTopRightRadius: '8px',
                        borderBottomRightRadius: '8px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 60,
                        boxShadow: '4px 0 6px rgba(0,0,0,0.05)'
                    }}
                >
                    <i className={`fa-solid fa-chevron-${isMobileExpanded ? 'left' : 'right'}`} style={{ fontSize: '0.8rem', color: '#6B7280' }}></i>
                </button>
            </aside >

            {/* Backdrop for mobile expanded */}
            {
                isMobileExpanded && (
                    <div
                        onClick={() => setIsMobileExpanded(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.3)',
                            zIndex: 40,
                            display: 'none' // Default hidden
                        }}
                        className="mobile-backdrop"
                    />
                )
            }
        </>
    );
}
