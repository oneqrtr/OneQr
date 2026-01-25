import Link from 'next/link';

export default function SSLSertifikasi() {
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
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>SSL Sertifikası ve Güvenlik</h1>

                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #E5E7EB', lineHeight: '1.8', color: '#374151', fontSize: '0.95rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <i className="fa-solid fa-lock" style={{ fontSize: '3rem', color: '#10B981', marginBottom: '16px' }}></i>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>Güvenliğiniz Önceliğimizdir</h2>
                    </div>

                    <p>
                        OneQR, kullanıcılarının ve müşterilerinin veri güvenliğini en üst düzeyde tutmak için en güncel güvenlik teknolojilerini kullanmaktadır.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>256-Bit SSL Şifreleme</h3>
                    <p>
                        Web sitemiz ve tüm alt yapımız, 256-bit SSL (Secure Sockets Layer) sertifikası ile korunmaktadır.
                        Bu teknoloji, tarayıcınız ile sunucularımız arasındaki tüm veri trafiğinin şifrelenmesini sağlar.
                        Kişisel bilgileriniz, şifreleriniz ve ödeme bilgileriniz üçüncü şahısların erişimine karşı güvence altındadır.
                    </p>
                    <p style={{ marginTop: '10px' }}>
                        Tarayıcınızın adres çubuğunda göreceğiniz "kilit" simgesi ve "https://" ibaresi, bağlantınızın güvenli olduğunu gösterir.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>Ödeme Güvenliği</h3>
                    <p>
                        Ödeme işlemlerimiz, Türkiye'nin önde gelen ödeme altyapı sağlayıcısı <strong>iyzico</strong> güvencesiyle gerçekleştirilmektedir.
                        Kredi kartı bilgileriniz OneQR sunucularında saklanmaz. Doğrudan banka ve ödeme kuruluşu arasında şifrelenmiş tüneller üzerinden işlem yapılır.
                        PCI-DSS (Ödeme Kartları Endüstrisi Veri Güvenliği Standartları) uyumluluğu sayesinde kart bilgileriniz uluslararası güvenlik standartlarıyla korunur.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>Veri Koruma</h3>
                    <p>
                        Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, verileriniz sadece yasal zorunluluklar ve hizmetin ifası için gerekli sınırlar dahilinde işlenir.
                        Yetkisiz erişimlere, veri kayıplarına ve siber saldırılara karşı düzenli güvenlik taramaları ve güncellemeler yapılmaktadır.
                    </p>
                </div>
            </div>
        </div>
    );
}
