'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SUB_NAV = [
    { path: '/admin/settings', label: 'Genel' },
    { path: '/admin/settings/billing', label: 'Abonelik' },
    { path: '/admin/settings/theme', label: 'Tema' },
    { path: '/admin/settings/qr', label: 'QR Kodlar' },
];

export default function SettingsNav() {
    const pathname = usePathname();
    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {SUB_NAV.map((item) => (
                <Link
                    key={item.path}
                    href={item.path}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '999px',
                        border: 'none',
                        background: pathname === item.path ? '#2563EB' : '#F3F4F6',
                        color: pathname === item.path ? 'white' : '#374151',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                        boxShadow: pathname === item.path ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                    }}
                >
                    {item.label}
                </Link>
            ))}
        </div>
    );
}
