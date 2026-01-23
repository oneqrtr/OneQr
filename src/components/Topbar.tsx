'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Topbar({ title }: { title: string }) {
    const [slug, setSlug] = useState('lezzet-duragi');

    useEffect(() => {
        // In a real app, we would fetch the user's slug from context/API
        // For now, we'll keep the default mock slug
    }, []);

    return (
        <header className="topbar">
            <div className="page-title">{title}</div>
            <div className="topbar-actions">
                <Link href={`/m/${slug}`} target="_blank" className="btn btn-sm btn-outline">
                    <i className="fa-solid fa-external-link-alt" style={{ marginRight: '6px' }}></i> Menüyü Gör
                </Link>
            </div>
        </header>
    );
}
