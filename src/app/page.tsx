'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {

  useEffect(() => {
    // Basic mobile menu handling
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    const toggleMenu = () => {
      if (navLinks) {
        navLinks.classList.toggle('active');
      }
    };

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', toggleMenu);
    }

    return () => {
      if (mobileMenuBtn) {
        mobileMenuBtn.removeEventListener('click', toggleMenu);
      }
    };
  }, []);

  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container nav-container">
          <Link href="/" className="logo">
            <img src="/logoblack.png" alt="OneQR" style={{ height: '80px' }} />
          </Link>
          <div className="nav-links">
            <a href="#demo">Örnek İncele</a>
            <a href="#ozellikler">Özellikler</a>
            <a href="#fiyatlandirma">Fiyatlar</a>
            <a href="#nasil-calisir">Nasıl Çalışır?</a>
            <Link href="/login" className="nav-link-login">Giriş Yap</Link>
            <Link href="/register" className="btn btn-sm btn-primary">Ücretsiz Dene</Link>
          </div>
          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" aria-label="Menüyü Aç">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="container hero-container">
          <div className="hero-content reveal active">
            <span className="badge">🚀 7 Gün Ücretsiz Deneme</span>
            <h1>İşletmenizi Dijitale Taşıyın <br /> <span className="text-gradient">Akıllı QR Menü</span></h1>
            <p>Cafe, restoran ve oteller için geliştirilmiş yeni nesil dijital menü sistemi. Müşterilerinize modern, hızlı ve temassız bir deneyim sunun.</p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-primary btn-large">Hemen Başla</Link>
              <a href="#demo" className="btn btn-outline btn-large">Örnek Menüyü Gör</a>
            </div>
            <p className="micro-copy"><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '4px' }}></i> Kredi kartı gerekmez • İptal edilebilir</p>
          </div>
          <div className="hero-image">
            <div className="image-wrapper" style={{ maxWidth: '400px', transform: 'rotate(-2deg)' }}>
              {/* Use the demo view screenshot if available or generic hero */}
              <img src="/images/hero.png" alt="OneQR Mobil Görünüm" />
            </div>
            {/* Floating Card Element */}
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '-40px',
              background: 'white',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'float 3s ease-in-out infinite'
            }}>
              <div style={{ background: '#DEF7EC', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#03543F' }}>
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Aylık Görüntülenme</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>+15.4K</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <style jsx>{`
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
      `}</style>

      {/* Live Demo Section */}
      <section id="demo" className="section bg-gray" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        <div className="container">
          <div className="section-header">
            <span style={{ color: '#2563EB', fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>CANLI ÖNİZLEME</span>
            <h2>Sistemi Canlı Deneyimleyin</h2>
            <p>Gerçek bir restoranın menüsünü inceleyerek sistemin nasıl çalıştığını ve hızını test edin.</p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '40px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              padding: '40px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '40px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '16px' }}>Örnek Restoran Menüsü</h3>
                <p style={{ color: '#4B5563', marginBottom: '24px' }}>
                  OneQR altyapısı ile hazırlanmış örnek bir dijital menüyü inceleyin. Kategoriler arası geçişleri, ürün detaylarını ve hızlı arayüzü deneyimleyin.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F3F4F6', padding: '8px 12px', borderRadius: '8px' }}>
                    <i className="fa-solid fa-bolt" style={{ color: '#F59E0B' }}></i>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Anında Açılır</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F3F4F6', padding: '8px 12px', borderRadius: '8px' }}>
                    <i className="fa-solid fa-mobile-screen" style={{ color: '#2563EB' }}></i>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>%100 Mobil Uyumlu</span>
                  </div>
                </div>
                <div style={{ marginTop: '32px' }}>
                  <a href="/m/yicem" target="_blank" className="btn btn-primary">
                    <i className="fa-solid fa-up-right-from-square" style={{ marginRight: '8px' }}></i>
                    Canlı Menüye Git
                  </a>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '280px', display: 'flex', justifyContent: 'center' }}>
                {/* Mockup Frame */}
                <div style={{
                  width: '280px',
                  height: '550px',
                  background: '#111827',
                  borderRadius: '40px',
                  padding: '12px',
                  position: 'relative',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'white',
                    borderRadius: '30px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <iframe
                      src="/m/yicem"
                      style={{ border: 'none', width: '100%', height: '100%' }}
                      title="Demo Preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Features */}
      < section id="ozellikler" className="section" >
        <div className="container">
          <div className="section-header">
            <h2>Öne Çıkan Özellikler</h2>
            <p>İşletmenizi büyütmek için ihtiyacınız olan her şey.</p>
          </div>
          <div className="features-grid">
            <div className="feature-item reveal active">
              <div className="feature-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                <i className="fa-solid fa-mobile-screen-button"></i>
              </div>
              <div>
                <h3>Mobil Uyumlu Tasarım</h3>
                <p>Uygulama indirmeye gerek yok. Kamerası olan her telefonla saniyeler içinde menünüze erişilir.</p>
              </div>
            </div>
            <div className="feature-item reveal active">
              <div className="feature-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                <i className="fa-solid fa-arrows-rotate"></i>
              </div>
              <div>
                <h3>Anlık Güncelleme</h3>
                <p>Fiyatları veya menü içeriğini dilediğiniz zaman panelden değiştirin, anında müşterilerinize yansısın.</p>
              </div>
            </div>
            <div className="feature-item reveal active">
              <div className="feature-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                <i className="fa-solid fa-paintbrush"></i>
              </div>
              <div>
                <h3>Size Özel Tasarım</h3>
                <p>Logo, renkler ve kapak görseli ile menünüzü markanızın kimliğine tam uyumlu hale getirin.</p>
              </div>
            </div>
            <div className="feature-item reveal active">
              <div className="feature-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                <i className="fa-solid fa-chart-pie"></i>
              </div>
              <div>
                <h3>Ayrıntılı İstatistikler</h3>
                <p>Menünüzün ne kadar görüntülendiğini takip edin, müşteri davranışlarını analiz edin.</p>
              </div>
            </div>
            <div className="feature-item reveal active">
              <div className="feature-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <div>
                <h3>Whatsapp Sipariş</h3>
                <p>Müşterileriniz ürün seçtikten sonra tek tuşla Whatsapp üzerinden size sipariş listesini gönderebilir.</p>
              </div>
            </div>
            <div className="feature-item reveal active">
              <div className="feature-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
                <i className="fa-solid fa-globe"></i>
              </div>
              <div>
                <h3>Google Haritalar Entegrasyonu</h3>
                <p>Müşterileriniz tek tuşla işletmenizin konumuna yol tarifi alabilir.</p>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* How It Works */}
      < section id="nasil-calisir" className="section bg-gray" >
        <div className="container">
          <div className="section-header">
            <h2>Nasıl Çalışır?</h2>
            <p>3 basit adımda dijital menünüzü yayına alın.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card reveal active">
              <div className="step-icon">1</div>
              <h3>Hesabını Oluştur</h3>
              <p>İşletme bilgilerini gir ve 7 günlük ücretsiz deneme sürecini başlat.</p>
            </div>
            <div className="step-card reveal active">
              <div className="step-icon">2</div>
              <h3>Ürünlerini Yükle</h3>
              <p>Kategorilerini oluştur, ürün fotoğraflarını ve fiyatlarını ekle.</p>
            </div>
            <div className="step-card reveal active">
              <div className="step-icon">3</div>
              <h3>QR Kodunu Paylaş</h3>
              <p>Otomatik oluşturulan QR kodunu indir, masalarına yapıştır ve satışa başla.</p>
            </div>
          </div>
        </div>
      </section >

      {/* Pricing Section */}
      < section id="fiyatlandirma" className="section bg-gray" style={{ background: '#F9FAFB' }
      }>
        <div className="container">
          <div className="section-header">
            <h2>Bütçe Dostu Fiyatlar</h2>
            <p>Gizli ücret yok, taahhüt yok. İhtiyacınıza en uygun paketi seçin.</p>
          </div>

          <div className="pricing-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {/* Free Trial Plan */}
            <div className="pricing-card" style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', position: 'relative' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Ücretsiz Deneme</h3>
              <div className="price" style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>0 ₺</span>
                <span style={{ color: '#6B7280' }}>/ 1 Hafta</span>
              </div>
              <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.95rem' }}>Sistemi tanımanız için tamamen ücretsiz, kredi kartı gerekmez.</p>
              <Link href="/register?plan=trial" className="btn btn-outline" style={{ width: '100%' }}>Hemen Başla</Link>
              <ul style={{ marginTop: '32px', color: '#4B5563', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> <strong>7 Gün Tam Erişim</strong></li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Kredi Kartı İstenmez</li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Sınırsız Ürün & Kategori</li>
              </ul>
            </div>

            {/* Monthly Plan */}
            <div className="pricing-card" style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', position: 'relative' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Aylık Paket</h3>
              <div className="price" style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>149 ₺</span>
                <span style={{ color: '#6B7280' }}>/ay + KDV</span>
              </div>
              <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.95rem' }}>Taahhüt vermeden, dilediğiniz zaman iptal edebilirsiniz.</p>
              <Link href="/register?plan=monthly" className="btn btn-outline" style={{ width: '100%' }}>Paketi Seç</Link>
              <ul style={{ marginTop: '32px', color: '#4B5563', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Her Ay Yenilenir</li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Dilediğin Zaman İptal</li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> 7/24 Teknik Destek</li>
              </ul>
            </div>

            {/* Yearly Plan (Featured) */}
            <div className="pricing-card featured" style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              border: '2px solid #2563EB',
              position: 'relative',
              transform: 'scale(1.05)',
              zIndex: 2,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#2563EB',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                EN ÇOK TERCİH EDİLEN
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Yıllık Pro</h3>
              <div className="price" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>999 ₺</span>
                <span style={{ color: '#6B7280' }}>/yıl + KDV</span>
              </div>
              <div style={{ color: '#10B981', fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px' }}>
                Aylık sadece 83 ₺'ye geliyor!
              </div>
              <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.95rem' }}>İşletmeniz için en mantıklı seçim. Neredeyse yarı fiyatına!</p>
              <Link href="/register?plan=yearly" className="btn btn-primary" style={{ width: '100%' }}>Yıllık Avantajı Seç</Link>
              <ul style={{ marginTop: '32px', color: '#4B5563', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> <strong>Net %45 İndirim</strong></li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> <strong>789 ₺ Cebinizde Kalsın</strong></li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Kurulum & Menü Giriş Desteği</li>
              </ul>
            </div>
          </div>
        </div>
      </section >

      {/* CTA / Trial */}
      < section className="cta-section" >
        <div className="container">
          <div className="cta-box reveal active">
            <h2>İşinizi Büyütmeye Hazır Mısınız?</h2>
            <p>OneQR ile müşterilerinize hak ettikleri modern deneyimi sunun. Kart bilgisi gerekmeden hemen başlayın.</p>
            <div className="cta-buttons">
              <Link href="/register" className="btn btn-large btn-white">7 Gün Ücretsiz Dene</Link>
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="footer" >
        <div className="container footer-container">
          <div className="footer-left">
            <span className="logo footer-logo">OneQR</span>
            <p>Restoran, cafe ve oteller için gelişmiş QR menü çözümleri. İşletmenizi dijitale taşıyın.</p>
          </div>
          <div className="footer-links">
            <h4>Kurumsal</h4>
            <ul>
              <li><Link href="/">Ana Sayfa</Link></li>
              <li><Link href="/bilgi">Bilgi Bankası</Link></li>
              <li><Link href="/sss">Sıkça Sorulan Sorular</Link></li>
              <li><a href="#ozellikler">Özellikler</a></li>
              <li><Link href="/login">Giriş Yap</Link></li>
              <li><Link href="/register">Kayıt Ol</Link></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>İletişim</h4>
            <ul>
              <li>
                <i className="fa-regular fa-envelope" style={{ marginRight: '8px' }}></i>
                <a href="mailto:oneqrtr@gmail.com">oneqrtr@gmail.com</a>
              </li>
              <li>
                <i className="fa-solid fa-location-dot" style={{ marginRight: '8px', marginTop: '12px' }}></i>
                Antalya, Türkiye
              </li>
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <p>&copy; 2024 OneQR. Tüm hakları saklıdır.</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/karsilastirma/oneqr-vs-pdf-qr-menu">OneQR vs PDF</Link>
              <a href="#">Kullanıcı Sözleşmesi</a>
              <a href="#">Gizlilik Politikası</a>
            </div>
          </div>
        </div>
      </footer >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "OneQR",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Restoran ve kafeler için dijital QR menü sistemi.",
            "offers": {
              "@type": "Offer",
              "price": "149",
              "priceCurrency": "TRY"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "120"
            }
          })
        }}
      />
    </>
  )
}
