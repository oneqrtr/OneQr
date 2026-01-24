import Link from 'next/link';

export default function Gizlilik() {
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
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Gizlilik ve KVKK Politikası</h1>

                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #E5E7EB', lineHeight: '1.8', color: '#374151', fontSize: '0.95rem' }}>

                    <p>
                        OneQR ("Şirket") olarak, kullanıcılarımızın kişisel verilerinin korunmasına büyük önem vermekteyiz.
                        İşbu Gizlilik Politikası, topladığımız verileri, bu verilerin nasıl kullanıldığını ve kullanıcılarımızın haklarını açıklamaktadır.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>1. Toplanan Veriler</h3>
                    <p>
                        Hizmetimizi kullanırken sizden aşağıdaki verileri talep edebiliriz:
                        <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                            <li>İsim, Soyisim</li>
                            <li>E-posta adresi</li>
                            <li>Telefon numarası</li>
                            <li>Fatura bilgileri</li>
                        </ul>
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>2. Verilerin Kullanım Amacı</h3>
                    <p>
                        Toplanan kişisel veriler; hizmetin sağlanması, faturalandırma süreçlerinin yürütülmesi, müşteri desteği sağlanması ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>3. Verilerin Paylaşımı</h3>
                    <p>
                        Kişisel verileriniz, yasal zorunluluklar haricinde üçüncü taraflarla paylaşılmamaktadır. Ödeme işlemleri için gerekli bilgiler, ilgili ödeme kuruluşu (Banka/Iyzico vb.) ile güvenli şifreleme yöntemleriyle paylaşılır.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>4. İletişim</h3>
                    <p>
                        KVKK kapsamındaki haklarınız ve talepleriniz için oneqrtr@gmail.com adresinden bizimle iletişime geçebilirsiniz.
                    </p>
                </div>
            </div>
        </div>
    );
}
