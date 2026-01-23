'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const [businessName, setBusinessName] = useState('');
    const [businessSlug, setBusinessSlug] = useState('');
    const pathname = usePathname();

    useEffect(() => {
        // Try local storage first for speed
        const savedName = localStorage.getItem('oneqr_business_name');
        if (savedName) setBusinessName(savedName);

        // Fetch source of truth
        const fetchName = async () => {
            const { createClient } = await import('@/lib/supabase');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: rest } = await supabase
                .from('restaurants')
                .select('name, slug')
                .eq('owner_id', user.id)
                .maybeSingle();

            if (rest) {
                setBusinessName(rest.name);
                setBusinessSlug(rest.slug);
                localStorage.setItem('oneqr_business_name', rest.name);
            }
        };
        fetchName();
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
                <div className="sidebar-header">
                    <Link href="/admin" className="sidebar-brand" style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                        <img src="/logoblack.png" alt="OneQR" style={{ height: '90px' }} />
                    </Link>
                </div>
                <nav className="sidebar-nav">
                    <Link href="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                        <span className="nav-icon"><i className="fa-solid fa-chart-pie"></i></span>
                        <span>Panel</span>
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
                    <Link href="/admin/settings" className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}>
                        <span className="nav-icon"><i className="fa-solid fa-gear"></i></span>
                        <span>Ayarlar</span>
                    </Link>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">{businessName.substring(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{businessName}</div>
                            <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Premium Plan</div>
                        </div>
                    </div>
                </div>

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
            </aside>

            {/* Backdrop for mobile expanded */}
            {isMobileExpanded && (
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
            )}
        </>
    );
}
