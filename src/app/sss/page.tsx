import { faqItems } from '@/lib/seo-content';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sıkça Sorulan Sorular | OneQR',
    description: 'Dijital QR menüler hakkında merak ettiğiniz her şey. Maliyet, kurulum ve kullanım detayları.',
};

export default function FAQPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
            }
        }))
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <Link href="/" style={{ color: '#6B7280', textDecoration: 'none', fontSize: '0.9rem' }}>&larr; Ana Sayfa</Link>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', margin: '20px 0 10px' }}>Sıkça Sorulan Sorular</h1>
                <p style={{ fontSize: '1.2rem', color: '#6B7280' }}>
                    Aklınızdaki soruların cevaplari burada.
                </p>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
                {faqItems.map((item, index) => (
                    <div key={index} style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>{item.question}</h3>
                        <p style={{ color: '#4B5563', lineHeight: '1.6', margin: 0 }}>{item.answer}</p>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '60px', padding: '32px', background: '#EFF6FF', borderRadius: '16px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E40AF', marginBottom: '12px' }}>Başka sorunuz var mı?</h3>
                <p style={{ color: '#1E3A8A', marginBottom: '24px' }}>Ekibimize dilediğiniz zaman ulaşabilirsiniz.</p>
                <Link href="/" className="btn" style={{ padding: '12px 24px', background: '#2563EB', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>
                    İletişime Geçin
                </Link>
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </div>
    );
}
