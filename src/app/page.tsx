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
          <Link href="/" className="logo">OneQR</Link>
          <div className="nav-links">
            <a href="#nasil-calisir">Nasıl Çalışır?</a>
            <a href="#ozellikler">Özellikler</a>
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
            <h1>Restoranınız İçin <br /> <span className="text-gradient">Akıllı QR Menü</span></h1>
            <p>Müşterilerinize modern, temassız ve hızlı bir menü deneyimi sunun. Dakikalar içinde menünüzü oluşturun, QR kodlarınızı masalara yerleştirin.</p>
            <div className="hero-actions">
              <Link href="/register" className="btn btn-primary">Hemen Başla</Link>
              <a href="#nasil-calisir" className="btn btn-outline">Detaylı Bilgi</a>
            </div>
            <p className="micro-copy">Kredi kartı gerekmez • İptal edilebilir</p>
          </div>
          <div className="hero-image">
            <div className="image-wrapper">
              <img src="/images/hero.png" alt="OneQR Yönetim Paneli" />
            </div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section id="nasil-calisir" className="section bg-gray">
        <div className="container">
          <div className="section-header">
            <h2>Nasıl Çalışır?</h2>
            <p>3 basit adımda dijital menünüzü yayınlayın.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card reveal active">
              <div className="step-icon">1</div>
              <h3>Hesabını Oluştur</h3>
              <p>Restoran bilgilerini gir ve menü kategorilerini hızlıca tanımla.</p>
            </div>
            <div className="step-card reveal active">
              <div className="step-icon">2</div>
              <h3>Menünü Yükle</h3>
              <p>Ürün fotoğraflarını, açıklamalarını ve fiyatlarını sisteme ekle. Sürükle bırak ile düzenle.</p>
            </div>
            <div className="step-card reveal active">
              <div className="step-icon">3</div>
              <h3>QR Kodunu Paylaş</h3>
              <p>Sistem tarafından üretilen QR kodu indir, masalarına yerleştir ve siparişleri karşıla.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="ozellikler" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Öne Çıkan Özellikler</h2>
            <p>İşletmenizi büyütmek için ihtiyacınız olan her şey.</p>
          </div>
          <div className="features-grid">
            <div className="feature-item reveal active">
              <div className="feature-icon">📱</div>
              <div>
                <h3>Mobil Uyumlu Tasarım</h3>
                <p>Tüm akıllı telefonlarla %100 uyumlu, uygulama indirme gerektirmeyen hızlı arayüz.</p>
              </div>
            </div>
            <div className="feature-item reveal active">
              <div className="feature-icon">⚡</div>
              <div>
                <h3>Anlık Güncelleme</h3>
                <p>Fiyat değişikliklerini veya yeni ürünleri saniyeler içinde menünüze yansıtın. Yeniden baskı maliyeti yok.</p>
              </div>
            </div>
            <div className="feature-item reveal active">
              <div className="feature-icon">🎨</div>
              <div>
                <h3>Markanıza Özel</h3>
                <p>Logo, renk ve tema seçenekleriyle menünüzü işletmenizin kurumsal kimliğine uygun hale getirin.</p>
              </div>
            </div>
            <div className="feature-item reveal active">
              <div className="feature-icon">📊</div>
              <div>
                <h3>Ayrıntılı Raporlar</h3>
                <p>Hangi ürünlerin daha çok görüntülendiğini takip edin, menünüzü verilere göre optimize edin.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Trial */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box reveal active">
            <h2>Denemeye Hazır Mısınız?</h2>
            <p>7 gün boyunca tüm özellikleri ücretsiz keşfedin. Memnun kalmazsanız hiçbir ücret ödemezsiniz.</p>
            <div className="cta-buttons">
              <Link href="/register" className="btn btn-large btn-white">7 Gün Ücretsiz Dene</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-container">
          <div className="footer-left">
            <a href="#" className="logo footer-logo">OneQR</a>
            <p>Restoranlar için yeni nesil menü çözümleri.</p>
          </div>
          <div className="footer-links">
            <h4>Hızlı Erişim</h4>
            <ul>
              <li><a href="#">Ana Sayfa</a></li>
              <li><a href="#ozellikler">Özellikler</a></li>
              <li><a href="#nasil-calisir">Nasıl Çalışır?</a></li>
              <li><Link href="/login">Giriş Yap</Link></li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>İletişim</h4>
            <ul>
              <li><a href="mailto:destek@oneqr.tr">destek@oneqr.tr</a></li>
              <li>İstanbul, Türkiye</li>
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>&copy; 2024 OneQR. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </>
  )
}
