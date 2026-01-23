'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Sidebar() {
    const [businessName, setBusinessName] = useState('Bizim Köfteci');

    useEffect(() => {
        const savedName = localStorage.getItem('oneqr_business_name');
        if (savedName) setBusinessName(savedName);
    }, []);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link href="/admin" className="sidebar-brand">
                    <img src="/logo-standard.png" alt="OneQR" style={{ height: '32px' }} />
                </Link>
            </div>
            <nav className="sidebar-nav">
                <Link href="/admin" className="nav-item active">
                    <span className="nav-icon"><i className="fa-solid fa-chart-pie"></i></span>
                    Panel
                </Link>
                <Link href="/admin/menu" className="nav-item">
                    <span className="nav-icon"><i className="fa-solid fa-utensils"></i></span>
                    Menü Yönetimi
                </Link>
                <Link href="/admin/qr" className="nav-item">
                    <span className="nav-icon"><i className="fa-solid fa-qrcode"></i></span>
                    QR Kodlar
                </Link>
                <Link href="/admin/theme" className="nav-item">
                    <span className="nav-icon"><i className="fa-solid fa-palette"></i></span>
                    Tema
                </Link>
                <Link href="/admin/settings" className="nav-item">
                    <span className="nav-icon"><i className="fa-solid fa-gear"></i></span>
                    Ayarlar
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
        </aside>
    );
}
