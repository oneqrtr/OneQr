import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'OneQR vs PDF Menü - Karşılaştırma | OneQR',
    description: 'Neden PDF menüler yerine dijital QR menü kullanmalısınız? OneQR ve klasik PDF menülerin detaylı karşılaştırması.',
};

export default function ComparisonPage() {
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px', fontFamily: 'system-ui, sans-serif' }}>

            <nav style={{ marginBottom: '40px', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>OneQR Ana Sayfa</Link>
            </nav>

            <header style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginBottom: '20px' }}>OneQR vs PDF QR Menü</h1>
                <p style={{ fontSize: '1.2rem', color: '#6B7280', maxWidth: '600px', margin: '0 auto' }}>
                    Restoranınız için en iyi çözümü ararken kararsız mı kaldınız? İşte şeffaf bir karşılaştırma.
                </p>
            </header>

            <div style={{ overflowX: 'auto', marginBottom: '60px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '24px', textAlign: 'left', width: '30%', color: '#6B7280' }}>ÖZELLİK</th>
                            <th style={{ padding: '24px', textAlign: 'center', width: '35%', color: '#DC2626', fontSize: '1.2rem' }}>PDF Menü</th>
                            <th style={{ padding: '24px', textAlign: 'center', width: '35%', color: '#2563EB', fontSize: '1.2rem', background: '#EFF6FF' }}>OneQR Dijital</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { name: 'Mobil Deneyim', pdf: 'Zoom yapılması gerekir', oneqr: '%100 Mobil Uyumlu' },
                            { name: 'Fiyat Güncelleme', pdf: 'Tasarımcı gerektirir (Zor)', oneqr: 'Panelden 10 Saniye (Kolay)' },
                            { name: 'Yüklenme Hızı', pdf: 'Yavaş (MB\'larca veri)', oneqr: 'Çok Hızlı (KB\'lar düzeyinde)' },
                            { name: 'Ürün Fotoğrafları', pdf: 'Statik', oneqr: 'Genişletilebilir, Yüksek Kalite' },
                            { name: 'Arama Özelliği', pdf: 'Yok', oneqr: 'Var (Müşteri ürünü bulabilir)' },
                            { name: 'Kategori Filtreleme', pdf: 'Yok', oneqr: 'Var (Hızlı geçiş)' },
                            { name: 'Maliyet', pdf: 'Her güncellemede tasarım ücreti', oneqr: 'Sabit Yıllık Ücret' },
                            { name: 'Google Görünürlüğü', pdf: 'Düşük', oneqr: 'Yüksek (SEO Uyumlu)' },
                        ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: '20px', fontWeight: 600, color: '#374151' }}>{row.name}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>{row.pdf}</td>
                                <td style={{ padding: '20px', textAlign: 'center', color: '#111827', fontWeight: 600, background: '#FBFDFF' }}>
                                    <i className="fa-solid fa-check" style={{ color: '#2563EB', marginRight: '8px' }}></i>
                                    {row.oneqr}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>Sonuç</h3>
                    <p style={{ color: '#4B5563', lineHeight: '1.6' }}>
                        PDF menüler kurulumu kolay gibi görünse de, müşterilerinize kötü bir deneyim yaşatır ve her fiyat değişikliğinde size zaman kaybettirir.
                        <br /><br />
                        <strong>Hızlı güncelleme ve düşük maliyet isteyen restoranlar için, OneQR, PDF QR menülere göre çok daha pratik ve profesyonel bir alternatiftir.</strong>
                    </p>
                    <div style={{ marginTop: '32px' }}>
                        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', padding: '12px 32px', background: '#2563EB', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>
                            OneQR'ı Deneyin
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}
