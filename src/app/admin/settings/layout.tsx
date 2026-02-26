'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SUB_NAV = [
    { path: '/admin/settings', label: 'Genel' },
    { path: '/admin/settings/billing', label: 'Abonelik' },
    { path: '/admin/settings/theme', label: 'Tema' },
    { path: '/admin/settings/qr', label: 'QR Kodlar' },
];

const leafTabStyle = (active: boolean) => ({
    padding: '10px 18px',
    borderRadius: '999px',
    border: 'none',
    background: active ? '#2563EB' : '#F3F4F6',
    color: active ? 'white' : '#374151',
    fontWeight: 600,
    fontSize: '0.9rem',
    textDecoration: 'none' as const,
    boxShadow: active ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#6B7280', marginBottom: '12px' }}>Genel Bilgiler</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {SUB_NAV.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            style={{
                                ...leafTabStyle(pathname === item.path),
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
            {children}
        </div>
    );
}
