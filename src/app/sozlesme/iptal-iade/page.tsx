import Link from 'next/link';

export default function IptalIade() {
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
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>İptal ve İade Koşulları</h1>

                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #E5E7EB', lineHeight: '1.8', color: '#374151', fontSize: '0.95rem' }}>
                    <p>
                        OneQR olarak sunduğumuz hizmet dijital bir yazılım aboneliğidir.
                        Aşağıdaki koşullar çerçevesinde iptal ve iade süreçleri işletilmektedir.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>1. Abonelik İptali</h3>
                    <p>
                        Kullanıcılar diledikleri zaman OneQR aboneliklerini iptal edebilirler.
                        İptal işlemi yapıldığında, mevcut ödenmiş dönemin sonuna kadar hizmet kullanımı devam eder.
                        Dönem sonunda abonelik yenilenmez ve ek ücret talep edilmez.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>2. İade Koşulları</h3>
                    <p>
                        Yasal olarak dijital hizmetler ve yazılımlar cayma hakkı kapsamında değildir.
                        Ancak OneQR, müşteri memnuniyetini önemser. Yıllık paket satın alımlarında, kullanımın ilk 7 günü içerisinde
                        hizmetten memnun kalmazsanız koşulsuz iade talep edebilirsiniz.
                        Aylık paketlerde ise o ayın ücret iadesi yapılmamaktadır, ancak sonraki aylar için iptal sağlanabilir.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#111827', marginTop: '30px', marginBottom: '10px' }}>3. İade Süreci</h3>
                    <p>
                        İade talebinizi oneqrtr@gmail.com adresine e-posta göndererek iletebilirsiniz.
                        Talebiniz incelendikten sonra 3-7 iş günü içerisinde ödeme yaptığınız karta iade işlemi başlatılır.
                    </p>
                </div>
            </div>
        </div>
    );
}
