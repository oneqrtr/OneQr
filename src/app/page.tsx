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

      {/* Hero Section - Benefit Driven */}
      <header className="hero" style={{ padding: '120px 0 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Abstract Background Shapes */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: -1 }}></div>
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: -1 }}></div>

        <div className="container hero-container" style={{ display: 'flex', alignItems: 'center', gap: '60px' }}>
          <div className="hero-content reveal active" style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', color: '#2563EB', padding: '6px 16px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '24px' }}>
              <span style={{ display: 'flex', width: '8px', height: '8px', background: '#2563EB', borderRadius: '50%' }}></span>
              Yeni Nesil Restoran Çözümü
            </div>
            <h1 style={{ fontSize: '3.5rem', lineHeight: '1.2', fontWeight: 800, color: '#111827', marginBottom: '20px' }}>
              Siparişleri Hızlandırın,<br />
              <span className="text-gradient" style={{ background: 'linear-gradient(to right, #2563EB, #06B6D4)', - webkitBackgroundClip: 'text', -webkitTextFillColor: 'transparent' }}>Müşteriyi Mutlu Edin.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#4B5563', marginBottom: '32px', lineHeight: '1.6', maxWidth: '540px' }}>
            Komisyon yok, cihaz maliyeti yok. Sadece QR kodunuzu masalara yapıştırın ve 5 dakika içinde temassız, hızlı sipariş almaya başlayın.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-large" style={{ padding: '16px 32px', fontSize: '1.1rem', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)' }}>
              Hemen Ücretsiz Dene
            </Link>
            <a href="#demo" className="btn btn-outline btn-large" style={{ padding: '16px 32px', fontSize: '1.1rem', background: 'white' }}>
              <i className="fa-solid fa-play" style={{ marginRight: '8px', fontSize: '0.9rem' }}></i> Nasıl Çalışır?
            </a>
          </div>
          <p className="micro-copy" style={{ marginTop: '16px', fontSize: '0.9rem', color: '#6B7280', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '6px' }}></i> Kredi kartı gerekmez</span>
            <span><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '6px' }}></i> 7/24 Destek</span>
          </p>
        </div>

        <div className="hero-image" style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="image-wrapper" style={{ position: 'relative', zIndex: 10, transform: 'rotate(-2deg)', transition: 'transform 0.3s ease' }}>
            {/* Main Image - Replace with a generic mockup if needed, keeping existing reference */}
            <img src="/images/hero.png" alt="OneQR Mobil Görünüm" style={{ borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} />
          </div>

          {/* Social Proof Floating Card */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '-20px',
            background: 'white',
            padding: '16px 20px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 20,
            animation: 'float 4s ease-in-out infinite'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  width: '36px', height: '36px', borderRadius: '50%', background: `#E5E7EB url(https://randomuser.me/api/portraits/men/${i * 10}.jpg)`,
                  backgroundSize: 'cover', border: '2px solid white', marginLeft: i > 1 ? '-12px' : 0
                }}></div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: '2px', color: '#F59E0B', fontSize: '0.8rem', marginBottom: '2px' }}>
                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>100+ Mutlu İşletme</div>
            </div>
          </div>
        </div>
      </div>
    </header >

      {/* Social Proof / Trust Bar */ }
      < div style = {{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', padding: '40px 0' }
}>
  <div className="container">
    <p style={{ textAlign: 'center', color: '#6B7280', fontWeight: 600, marginBottom: '24px', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
      Türkiye'nin dört bir yanındaki işletmelerin tercihi
    </p>
    <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', opacity: 0.6, filter: 'grayscale(100%)' }}>
      {/* Generic Logo Placeholders for Trust */}
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-utensils"></i> Lezzet Durağı</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-mug-hot"></i> Coffee Joy</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-burger"></i> Burger Station</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-pizza-slice"></i> Pizza House</div>
    </div>
  </div>
      </div >

  <style jsx>{`
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
      `}</style>

{/* Solutions Section (Renamed from Features) */ }
<section id="ozellikler" className="section" style={{ padding: '100px 0' }}>
  <div className="container">
    <div className="section-header" style={{ marginBottom: '60px' }}>
      <h2 style={{ fontSize: '2.5rem' }}>İşletmenizin Tüm İhtiyaçları Tek Platformda</h2>
      <p style={{ fontSize: '1.1rem' }}>Karmaşık yazılımları unutun. OneQR ile tanışın.</p>
    </div>

    <div className="features-grid">
      <div className="feature-item reveal active">
        <div className="feature-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
          <i className="fa-solid fa-wallet"></i>
        </div>
        <div>
          <h3>Esnek Ödeme Yöntemleri</h3>
          <p>Nakit, Kredi Kartı, Yemek Kartları (Multinet, Sodexo vb.) veya IBAN ile ödeme. Müşterinize seçenek sunun, satışları artırın.</p>
        </div>
      </div>
      <div className="feature-item reveal active">
        <div className="feature-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
          <i className="fa-brands fa-whatsapp"></i>
        </div>
        <div>
          <h3>WhatsApp ile Sipariş & Konum</h3>
          <p>Siparişler anında cebinize düşsün. Müşterinin gönderdiği konumu tek tıkla kuryenize iletin, adres arama derdine son verin.</p>
        </div>
      </div>
      <div className="feature-item reveal active">
        <div className="feature-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
          <i className="fa-solid fa-paintbrush"></i>
        </div>
        <div>
          <h3>Markanıza Özel Tasarım</h3>
          <p>Sadece bir menü değil, size özel bir web sitesi. Logonuz, renkleriniz ve kurumsal kimliğinizle fark yaratın.</p>
        </div>
      </div>
      <div className="feature-item reveal active">
        <div className="feature-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
          <i className="fa-solid fa-qrcode"></i>
        </div>
        <div>
          <h3>Dinamik QR Kod</h3>
          <p>Menü içeriğiniz değişse bile QR kodunuz aynı kalır. Tekrar tekrar baskı maliyetine katlanmayın. Fiyatları saniyeler içinde güncelleyin.</p>
        </div>
      </div>
      <div className="feature-item reveal active">
        <div className="feature-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
          <i className="fa-solid fa-address-card"></i>
        </div>
        <div>
          <h3>Dijital Kartvizit Hediyeli</h3>
          <p>Müşterileriniz QR kodunuzu okuttuğunda sadece menüyü değil, WiFi şifrenizi, Instagram adresinizi ve iletişim bilgilerinizi de görsün.</p>
        </div>
      </div>
      <div className="feature-item reveal active">
        <div className="feature-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
          <i className="fa-solid fa-chart-line"></i>
        </div>
        <div>
          <h3>Detaylı Raporlama</h3>
          <p>Hangi ürün daha çok satıyor? Menünüz kaç kere görüntülendi? İşletmenizi verilerle yönetin.</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/* Live Demo Section - Preserved Layout */ }
<section id="demo" className="section bg-gray" style={{ paddingTop: '80px', paddingBottom: '80px', background: 'linear-gradient(to bottom, #F9FAFB, #EFF6FF)' }}>
  <div className="container">
    <div className="section-header">
      <span style={{ color: '#2563EB', fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>CANLI ÖNİZLEME</span>
      <h2>Müşterileriniz Ne Görecek?</h2>
      <p>OneQR, hem mobilde hem masaüstünde kusursuz çalışır. Aşağıdaki interaktif demoyu hemen deneyin.</p>
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
            <i className="fa-solid fa-mobile-screen"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF' }}>Masa başında</div>
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
          <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '16px', lineHeight: '1.2' }}>
            <span style={{ color: '#2563EB' }}>adiniz.oneqr.tr</span> ile<br />
            Kendi Web Sitenize Sahip Olun
          </h3>
          <p style={{ color: '#4B5563', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Sadece masada değil, internette de var olun. Müşterileriniz size özel linkinizden (örn: mekanadi.oneqr.tr) diledikleri zaman ulaşıp, menünüzü inceleyebilir ve sipariş oluşturabilirler.
          </p>
          <Link href="/register" className="btn btn-primary btn-large" style={{ marginTop: '24px', display: 'inline-flex' }}>
            Kendi Siteni Oluştur
          </Link>
        </div>

        {/* Laptop Frame */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: '#1F2937', borderRadius: '12px 12px 0 0', padding: '12px 12px 0',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
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
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: '-16px', left: '-5%', width: '110%', height: '24px',
            background: '#374151', borderRadius: '0 0 16px 16px', zIndex: -1,
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '15%', height: '4px', background: '#4B5563', borderRadius: '0 0 4px 4px' }}></div>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>

{/* Pricing Section - Psychological */ }
<section id="fiyatlandirma" className="section" style={{ background: '#FFFFFF', padding: '100px 0' }}>
  <div className="container">
    <div className="section-header">
      <h2>Size En Uygun Paketi Seçin</h2>
      <p>Gizli ücret yok, taahhüt yok. Memnun kalmazsanız anında iptal.</p>
    </div>

    <div className="pricing-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '32px',
      maxWidth: '1200px',
      margin: '0 auto',
      alignItems: 'center'
    }}>
      {/* Freemium Plan */}
      <div className="pricing-card" style={{ background: '#F9FAFB', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', position: 'relative' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151' }}>Deneme</h3>
          <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Sistemi keşfetmek için</p>
        </div>
        <div className="price" style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>0 ₺</span>
          <span style={{ color: '#6B7280' }}>/ 14 Gün</span>
        </div>
        <ul style={{ marginBottom: '32px', color: '#4B5563', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> 14 Gün Tam Erişim</li>
          <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Kredi Kartı Gerekmez</li>
          <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Anında Kurulum</li>
        </ul>
        <Link href="/register?plan=trial" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Ücretsiz Başla</Link>
      </div>

      {/* Plusimum Plan (Highlight) */}
      <div className="pricing-card featured" style={{
        background: 'white',
        padding: '40px',
        borderRadius: '24px',
        border: '2px solid #2563EB',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(37, 99, 235, 0.25)',
        zIndex: 2
      }}>
        <div style={{
          position: 'absolute',
          top: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2563EB',
          color: 'white',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.05em'
        }}>
          EN POPÜLER
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Plusimum</h3>
          <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Profesyonellerin tercihi</p>
        </div>

        <div className="price" style={{ marginBottom: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', fontWeight: 800, color: '#111827' }}>199 ₺</span>
          <span style={{ color: '#6B7280', fontSize: '1rem' }}>/ay</span>
        </div>
        <div style={{ textAlign: 'center', color: '#10B981', fontWeight: 600, fontSize: '0.9rem', marginBottom: '32px', background: '#ECFDF5', padding: '8px', borderRadius: '8px' }}>
          Yıllık ödemede 7 Ay Bedava! (999 ₺/yıl)
        </div>

        <ul style={{ marginBottom: '32px', color: '#4B5563', fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <li style={{ display: 'flex', alignItems: 'center' }}><i className="fa-solid fa-circle-check" style={{ color: '#2563EB', marginRight: '12px' }}></i> <strong>sizeozel.oneqr.tr</strong> Alan Adı</li>
          <li style={{ display: 'flex', alignItems: 'center' }}><i className="fa-solid fa-circle-check" style={{ color: '#2563EB', marginRight: '12px' }}></i> Sınırsız Ürün & Kategori</li>
          <li style={{ display: 'flex', alignItems: 'center' }}><i className="fa-solid fa-circle-check" style={{ color: '#2563EB', marginRight: '12px' }}></i> WhatsApp & Konum Entegrasyonu</li>
          <li style={{ display: 'flex', alignItems: 'center' }}><i className="fa-solid fa-circle-check" style={{ color: '#2563EB', marginRight: '12px' }}></i> Detaylı İstatistikler</li>
          <li style={{ display: 'flex', alignItems: 'center' }}><i className="fa-solid fa-gift" style={{ color: '#F59E0B', marginRight: '12px' }}></i> <strong>Hediye:</strong> Dijital Kartvizit Sitesi</li>
        </ul>
        <Link href="/register?plan=plusimum" className="btn btn-primary btn-large" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>Hemen Yükselt</Link>
      </div>

      {/* Premium Plan */}
      <div className="pricing-card" style={{ background: '#F9FAFB', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', position: 'relative' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151' }}>Premium</h3>
          <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Başlangıç için ideal</p>
        </div>
        <div className="price" style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827' }}>99 ₺</span>
          <span style={{ color: '#6B7280' }}>/ay</span>
        </div>
        <div style={{ textAlign: 'center', color: '#059669', fontSize: '0.9rem', marginBottom: '24px' }}>
          Yıllık 499 ₺
        </div>
        <ul style={{ marginBottom: '32px', color: '#4B5563', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> <strong>oneqr.tr/menu/adiniz</strong></li>
          <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> 50 Ürün Limiti</li>
          <li><i className="fa-solid fa-check" style={{ color: '#10B981', marginRight: '8px' }}></i> Temel İstatistikler</li>
        </ul>
        <Link href="/register?plan=premium" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Paketi Seç</Link>
      </div>

    </div>
  </div>
</section>

{/* Final CTA */ }
<section className="cta-section" style={{ background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)', padding: '80px 0', textAlign: 'center', color: 'white' }}>
  <div className="container">
    <div className="cta-box reveal active" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '24px' }}>Hâlâ Düşünüyor musunuz?</h2>
      <p style={{ fontSize: '1.1rem', color: '#D1D5DB', marginBottom: '40px' }}>
        Binlerce işletme sahibi gibi siz de dijital dönüşümünüzü bugün başlatın.
        Kaybedecek hiçbir şeyiniz yok, çünkü denemesi tamamen ücretsiz.
      </p>
      <div className="cta-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link href="/register" className="btn btn-large btn-white" style={{ background: 'white', color: '#111827', padding: '16px 40px', fontWeight: 700 }}>
          7 Gün Ücretsiz Dene
        </Link>
        <a href="https://wa.me/905301234567" target="_blank" className="btn btn-large btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', padding: '16px 30px' }}>
          <i className="fa-brands fa-whatsapp" style={{ marginRight: '8px' }}></i> Bize Sorun
        </a>
      </div>
    </div>
  </div>
</section>

{/* Footer - Slightly updated style but same content structure */ }

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
