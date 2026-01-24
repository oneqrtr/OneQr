import Link from 'next/link';

export default function MesafeliSatis() {
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

            <div className="container" style={{ padding: '140px 20px', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Mesafeli Satış Sözleşmesi</h1>

                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #E5E7EB', lineHeight: '1.8', color: '#374151', fontSize: '0.95rem' }}>
                    <p><strong>MADDE 1 – TARAFLAR</strong></p>
                    <p>
                        <strong>SATICI:</strong><br />
                        Ünvanı: OneQR Teknoloji (Şahıs/Şirket Adınız)<br />
                        Adres: Antalya, Türkiye<br />
                        E-posta: oneqrtr@gmail.com
                    </p>
                    <p style={{ marginTop: '16px' }}>
                        <strong>ALICI:</strong><br />
                        OneQR platformu üzerinden hizmet satın alan kişi veya kurum.
                    </p>

                    <p style={{ marginTop: '24px' }}><strong>MADDE 2 – KONU</strong></p>
                    <p>
                        İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait www.oneqr.tr internet sitesinden elektronik ortamda siparişini yaptığı,
                        nitelikleri ve satış fiyatı belirtilen dijital hizmetin (QR Menü Yazılımı) satışı ve teslimi ile ilgili olarak
                        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
                    </p>

                    <p style={{ marginTop: '24px' }}><strong>MADDE 3 – SÖZLEŞME KONUSU HİZMET</strong></p>
                    <p>
                        Hizmetin Türü: Dijital Abonelik (Yazılım Hizmeti)<br />
                        Süre: Seçilen pakete göre (7 Gün, 1 Ay veya 1 Yıl)<br />
                        Teslimat: Hizmet, ödeme onaylandıktan sonra anında dijital olarak erişime açılır. Fiziksel bir teslimat yoktur.
                    </p>

                    <p style={{ marginTop: '24px' }}><strong>MADDE 4 – CAYMA HAKKI</strong></p>
                    <p>
                        Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesi ve 1. fıkrasının (ğ) bendi uyarınca "Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallar" kapsamında cayma hakkı bulunmamaktadır.
                        Ancak OneQR olarak müşteri memnuniyeti adına, hizmetin satın alınmasını takip eden ilk 14 gün içinde, sistemsel bir hata veya memnuniyetsizlik durumunda iade taleplerini değerlendirmekteyiz.
                    </p>

                    <p style={{ marginTop: '24px' }}><strong>MADDE 5 – YETKİLİ MAHKEME</strong></p>
                    <p>
                        İşbu sözleşmenin uygulanmasında, Tüketici Hakem Heyetleri ile Antalya Mahkemeleri yetkilidir.
                    </p>
                </div>
            </div>
        </div>
    );
}
