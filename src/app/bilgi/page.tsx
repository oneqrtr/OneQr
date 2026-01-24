import { knowledgeArticles } from '@/lib/seo-content';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Restoran Teknolojileri Bilgi Bankası | OneQR',
    description: 'QR menüler, dijital restoran sistemleri ve sektör trendleri hakkında kapsamlı rehberler.',
};

export default function KnowledgeIndexPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Bilgi Bankası</h1>
                <p style={{ fontSize: '1.2rem', color: '#6B7280' }}>
                    Restoranınızı dijitalleştirmek için bilmeniz gereken her şey.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
                {knowledgeArticles.map((article) => (
                    <Link
                        key={article.slug}
                        href={`/bilgi/${article.slug}`}
                        style={{ display: 'block', textDecoration: 'none' }}
                    >
                        <div style={{
                            padding: '32px',
                            background: 'white',
                            borderRadius: '16px',
                            border: '1px solid #E5E7EB',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{article.title}</h2>
                            <p style={{ color: '#6B7280', lineHeight: '1.5' }}>{article.description}</p>
                            <span style={{ display: 'inline-block', marginTop: '16px', color: '#2563EB', fontWeight: 600 }}>Okumaya Devam Et →</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div style={{ marginTop: '60px', textAlign: 'center' }}>
                <Link href="/" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '8px', background: '#111827', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
                    Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
}
