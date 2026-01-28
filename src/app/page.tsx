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
      <section id="demo" className="section bg-gray" style={{ paddingTop: '80px', paddingBottom: '80px', background: 'linear-gradient(to bottom, #F9FAFB, #EFF6FF)' }}>
        <div className="container">
          <div className="section-header">
            <span style={{ color: '#2563EB', fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>HEM MOBİL HEM MASAÜSTÜ</span>
            <h2>Sadece QR Menü Değil,<br />Size Ait Profesyonel Web Sitesi</h2>
            <p>OneQR sadece masada değil, internette de sizi temsil eder. Müşterileriniz ister cepten, ister bilgisayardan girsin; kusursuz bir deneyim yaşar.</p>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '60px',
            marginTop: '60px',
            flexWrap: 'wrap'
          }}>

            {/* Left: Mobile Mockup */}
            <div style={{ position: 'relative', width: '300px', flexShrink: 0 }}>
              <div style={{
                position: 'absolute', top: '20px', left: '-60px', background: 'white', padding: '12px 20px', borderRadius: '12px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px', animation: 'float 4s ease-in-out infinite'
              }}>
                <div style={{ width: '40px', height: '40px', background: '#DEF7EC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#03543F' }}>
                  <i className="fa-solid fa-qrcode"></i>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF' }}>Masada Okutunca</div>
                  <div style={{ fontWeight: 700, color: '#111827' }}>Hızlı Menü</div>
                </div>
              </div>

              <div style={{
                width: '300px',
                height: '600px',
                background: '#111827',
                borderRadius: '40px',
                padding: '12px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                border: '4px solid #374151'
              }}>
                <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '28px', overflow: 'hidden' }}>
                  <iframe src="/menu/demo" style={{ width: '100%', height: '100%', border: 'none' }} title="Mobile Demo" />
                </div>
              </div>
            </div>

            {/* Right: Desktop/Laptop Mockup */}
            <div style={{ flex: 1, minWidth: '350px', maxWidth: '800px' }}>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F0F9FF', color: '#0369A1', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #BAE6FD', marginBottom: '16px' }}>
                  <i className="fa-solid fa-globe" style={{ marginRight: '8px' }}></i> YENİ ÖZELLİK
                </div>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '16px', lineHeight: '1.2' }}>
                  <span style={{ color: '#2563EB' }}>adiniz.oneqr.tr</span><br />
                  Adresinde Siteniz Hazır
                </h3>
                <p style={{ color: '#4B5563', fontSize: '1.1rem', lineHeight: '1.6' }}>
                  Müşterileriniz "mekanadi.oneqr.tr" gibi size özel isimlendirilmiş adresinize girdiğinde,
                  karşılarında telefon uygulaması değil, <strong>gerçek bir yemek sipariş sitesi</strong> bulurlar.
                  Google'da daha iyi sıralanır, marka değerinizi artırırsınız.
                </p>

                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <a href="/menu/demo" target="_blank" className="btn btn-primary btn-large">
                    <i className="fa-solid fa-laptop" style={{ marginRight: '8px' }}></i>
                    Canlı Web Sitesini Gör
                  </a>
                </div>
              </div>

              {/* Laptop Frame CSS Hack */}
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: '#1F2937', borderRadius: '12px 12px 0 0', padding: '12px 12px 0',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '8px 8px 0 0', overflow: 'hidden', position: 'relative' }}>
                    <iframe
                      src="/menu/demo"
                      style={{
                        width: '200%',
                        height: '200%',
                        transform: 'scale(0.5)',
                        transformOrigin: 'top left',
                        border: 'none',
                        background: 'white'
                      }}
                      title="Desktop Demo"
                    />
                    {/* Invisible Scroll Overlay for better UX on non-touch (optional, but keep it interactive as requested) */}
                  </div>
                </div>
                {/* Laptop Bottom Deck */}
                <div style={{
                  position: 'absolute', bottom: '-15px', left: '-10%', width: '120%', height: '20px',
                  background: '#374151', borderRadius: '0 0 20px 20px', zIndex: -1
                }}></div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Digital Card Showcase */}
      <section className="section" style={{ background: '#111827', color: 'white', position: 'relative', overflow: 'hidden' }}>
        {/* Background Elements */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 20% 50%, #7C3AED 0%, transparent 50%), radial-gradient(circle at 80% 50%, #2563EB 0%, transparent 50%)' }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '60px', flexWrap: 'wrap-reverse' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(124, 58, 237, 0.2)', color: '#A78BFA', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid rgba(124, 58, 237, 0.3)', marginBottom: '24px' }}>
                <i className="fa-solid fa-address-card" style={{ marginRight: '8px' }}></i> PLUSIMUM HEDİYESİDİR
              </div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px', lineHeight: '1.2' }}>
                Cebinizdeki Yeni Nesil<br />
                <span className="text-gradient" style={{ background: 'linear-gradient(to right, #A78BFA, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dijital Kartvizit</span>
              </h2>
              <p style={{ color: '#D1D5DB', fontSize: '1.1rem', marginBottom: '32px', lineHeight: '1.6' }}>
                Artık kağıt kartvizit bastırmanıza gerek yok. QR kodunu okutan müşteriniz tek tuşla sizi rehberine kaydetsin, Wifi şifrenizi öğrensin ve sosyal medya hesaplarınıza ulaşsın.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fa-solid fa-address-book" style={{ color: '#A78BFA' }}></i>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>Rehbere Kaydet</strong>
                    <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>vCard ile tek tuşla kayıt</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fa-solid fa-wifi" style={{ color: '#34D399' }}></i>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>Wifi Paylaşımı</strong>
                    <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Şifre sormaya son</span>
                  </div>
                </div>
              </div>

              <a href="/k/demo" target="_blank" className="btn btn-primary" style={{ background: '#7C3AED', borderColor: '#7C3AED' }}>
                <i className="fa-regular fa-eye" style={{ marginRight: '8px' }}></i> Örnek Kartviziti İncele
              </a>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: '300px' }}>
              <div style={{
                position: 'relative',
                width: '320px',
                height: '640px',
                background: '#1F2937',
                borderRadius: '45px',
                padding: '12px',
                boxShadow: '0 0 50px rgba(124, 58, 237, 0.2), 0 20px 40px rgba(0,0,0,0.4)',
                border: '4px solid #374151'
              }}>
                {/* Notch */}
                <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '24px', background: '#1F2937', borderRadius: '0 0 16px 16px', zIndex: 20 }}></div>

                <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '32px', overflow: 'hidden', position: 'relative' }}>
                  <iframe src="/k/demo" style={{ width: '100%', height: '100%', border: 'none' }} title="Digital Card Demo" />
                  {/* Overlay for interaction */}
                  <a href="/k/demo" target="_blank" style={{ position: 'absolute', inset: 0, zIndex: 30 }} aria-label="Open Card Demo"></a>
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
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Freemium Plan */}
            <div className="pricing-card" style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', position: 'relative' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Freemium</h3>
              <div className="price" style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>0 ₺</span>
                <span style={{ color: '#6B7280' }}>/ 14 Gün</span>
              </div>
              <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.95rem' }}>Sistemi tanımanız için 14 gün boyunca tüm özellikler açık.</p>
              <Link href="/register?plan=trial" className="btn btn-outline" style={{ width: '100%' }}>Hemen Başla</Link>
              <ul style={{ marginTop: '32px', color: '#4B5563', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> <strong>14 Gün Tam Erişim</strong></li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Geçici Subdomain Hakkı</li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Kredi Kartı İstenmez</li>
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="pricing-card" style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', position: 'relative' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Premium</h3>
              <div className="price" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>100 ₺</span>
                <span style={{ color: '#6B7280' }}>/ay + KDV</span>
              </div>
              <div style={{ color: '#2563EB', fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px' }}>
                Veya yıllık 500 ₺ (2 ay bedava)
              </div>
              <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.95rem' }}>Temel dijital menü ihtiyacı olan işletmeler için.</p>
              <Link href="/register?plan=premium" className="btn btn-outline" style={{ width: '100%' }}>Paketi Seç</Link>
              <ul style={{ marginTop: '32px', color: '#4B5563', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> <strong>oneqr.tr/menu/adiniz</strong></li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Temel Tema Özelleştirme</li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Limitli Ürün & Kategori</li>
                <li style={{ opacity: 0.5 }}><i className="fa-solid fa-xmark" style={{ color: '#9CA3AF', marginRight: '8px' }}></i> Özel Subdomain Yok</li>
              </ul>
            </div>

            {/* Plusimum Plan (Flagship) */}
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Plusimum</h3>
              <div className="price" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>200 ₺</span>
                <span style={{ color: '#6B7280' }}>/ay + KDV</span>
              </div>
              <div style={{ color: '#10B981', fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px' }}>
                Veya yıllık 1000 ₺ (yarı fiyatına!)
              </div>
              <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '0.95rem' }}>Tam profesyonel çözüm. Kendi markanız, kendi siteniz.</p>
              <Link href="/register?plan=plusimum" className="btn btn-primary" style={{ width: '100%' }}>Avantajlı Paketi Seç</Link>
              <ul style={{ marginTop: '32px', color: '#4B5563', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> <strong>adiniz.oneqr.tr Sahibi Olun</strong></li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Sınırsız Ürün & Kategori</li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Gelişmiş Marka & Renk Yönetimi</li>
                <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> <strong>Hediye:</strong> Dijital Kartvizit Sitesi</li>
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
              <li><Link href="/hakkimizda">Hakkımızda</Link></li>
              <li><Link href="/bilgi">Bilgi Bankası</Link></li>
              <li><Link href="/sss">Sıkça Sorulan Sorular</Link></li>
              <li><Link href="/ssl-sertifikasi">SSL Sertifikası</Link></li>
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
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
            paddingBottom: '24px',
            borderBottom: '1px solid #374151'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <img
                src="/images/payments/iyzico_footer.png"
                alt="iyzico Güvenli Ödeme"
                style={{ height: 'auto', maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <p>&copy; 2024 OneQR. Tüm hakları saklıdır.</p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <Link href="/sozlesme/mesafeli-satis" style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>Mesafeli Satış Sözleşmesi</Link>
              <Link href="/sozlesme/iptal-iade" style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>Teslimat ve İade Şartları</Link>
              <Link href="/sozlesme/gizlilik" style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>Gizlilik Sözleşmesi</Link>
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
