import Topbar from '@/components/Topbar';
import Link from 'next/link';

export default function Hakkimizda() {
    return (
        <div style={{ background: '#F9FAFB', minHeight: '100vh' }}>
            <nav className="navbar" style={{ background: 'white', borderBottom: '1px solid #E5E7EB' }}>
                <div className="container nav-container">
                    <Link href="/" className="logo">
                        <img src="/logoblack.png" alt="OneQR" style={{ height: '60px' }} />
                    </Link>
                    <div className="nav-links">
                        <Link href="/" className="nav-link-login">Ana Sayfa</Link>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginBottom: '32px' }}>Hakkımızda</h1>

                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #E5E7EB', lineHeight: '1.8', color: '#374151' }}>
                    <p style={{ marginBottom: '20px' }}>
                        OneQR, restoran, kafe, otel ve benzeri işletmelerin menülerini dijitalleştirmelerini sağlayan yeni nesil bir teknoloji platformudur.
                    </p>
                    <p style={{ marginBottom: '20px' }}>
                        Amacımız, işletmelerin kâğıt menü maliyetlerini ortadan kaldırarak, güncellenebilir, hijyenik ve modern bir menü deneyimi sunmalarını sağlamaktır.
                        Sunduğumuz altyapı sayesinde işletmeler QR kod teknolojisini kullanarak müşterilerine saniyeler içinde menülerini ulaştırabilirler.
                    </p>
                    <p style={{ marginBottom: '20px' }}>
                        %100 yerli sermaye ve yazılım gücüyle geliştirilen OneQR, Antalya merkezli olup tüm Türkiye'ye hizmet vermektedir.
                        Sürekli gelişen altyapımız ile işletmelerin dijital dönüşümüne katkıda bulunmaktan gurur duyuyoruz.
                    </p>

                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginTop: '40px', marginBottom: '16px' }}>Hizmetlerimiz</h3>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                        <li>QR Kod Menü Sistemi</li>
                        <li>Dijital Katalog Yazılımı</li>
                        <li>Restoran Sipariş Yönetim Araçları</li>
                    </ul>

                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginTop: '40px', marginBottom: '16px' }}>İletişim</h3>
                    <p>
                        <strong>E-posta:</strong> oneqrtr@gmail.com<br />
                        <strong>Adres:</strong> Antalya, Türkiye
                    </p>
                </div>
            </div>
        </div>
    );
}
