'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SUB_NAV = [
    { path: '/admin/settings', label: 'Genel' },
    { path: '/admin/settings/billing', label: 'Abonelik' },
    { path: '/admin/settings/theme', label: 'Tema' },
    { path: '/admin/settings/qr', label: 'QR Kodlar' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {SUB_NAV.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: 'none',
                            background: pathname === item.path ? '#2563EB' : '#F3F4F6',
                            color: pathname === item.path ? 'white' : '#374151',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                        }}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            {children}
        </div>
    );
}
