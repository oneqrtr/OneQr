import { knowledgeArticles } from '@/lib/seo-content';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = knowledgeArticles.find(a => a.slug === slug);
    if (!article) return { title: 'Sayfa Bulunamadı' };

    return {
        title: `${article.title} | OneQR`,
        description: article.description,
        openGraph: {
            title: article.title,
            description: article.description,
            type: 'article',
        }
    };
}

export async function generateStaticParams() {
    return knowledgeArticles.map((article) => ({
        slug: article.slug,
    }));
}

export default async function ArticlePage({ params }: PageProps) {
    const { slug } = await params;
    const article = knowledgeArticles.find(a => a.slug === slug);

    if (!article) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        author: {
            '@type': 'Organization',
            name: 'OneQR'
        },
        publisher: {
            '@type': 'Organization',
            name: 'OneQR',
            logo: {
                '@type': 'ImageObject',
                url: 'https://oneqr.tr/logo.png' // Generic placeholder or actual
            }
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: '1.6' }}>
            {/* Breadcrumb */}
            <nav style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#6B7280' }}>
                <Link href="/" style={{ color: '#2563EB', textDecoration: 'none' }}>Anasayfa</Link> &gt;{' '}
                <Link href="/bilgi" style={{ color: '#2563EB', textDecoration: 'none' }}>Bilgi Bankası</Link> &gt;{' '}
                <span style={{ color: '#374151' }}>{article.title}</span>
            </nav>

            <article>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>{article.title}</h1>
                <div
                    dangerouslySetInnerHTML={{ __html: article.content }}
                    style={{ fontSize: '1.1rem', color: '#374151' }}
                    className="prose"
                />
            </article>

            {/* AI Context Footer */}
            <div style={{ marginTop: '60px', padding: '24px', background: '#F3F4F6', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Özet</h3>
                <p style={{ margin: 0, color: '#4B5563' }}>
                    Bu makale restoran teknolojileri ve dijital menü sistemleri hakkında bilgilendirme amacıyla hazırlanmıştır.
                    <strong>OneQR</strong>, işletmelerin menülerini dijitalleştirmelerine yardımcı olan bulut tabanlı bir yazılımdır.
                </p>
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </div>
    );
}
