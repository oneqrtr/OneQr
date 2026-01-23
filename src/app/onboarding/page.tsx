'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);

    return (
        <div className="auth-body" style={{ alignItems: 'flex-start', paddingTop: '60px' }}>
            <div className="wizard-container">
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Link href="/" className="logo">OneQR</Link>
                </div>

                <div className="wizard-card">
                    <div className="wizard-header">
                        <div className="wizard-progress">
                            <div className={`progress-step ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                                <div className="step-indicator">1</div>
                                <span>İşletme</span>
                            </div>
                            <div className={`progress-step ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                                <div className="step-indicator">2</div>
                                <span>Menü</span>
                            </div>
                            <div className={`progress-step ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                                <div className="step-indicator">3</div>
                                <span>Tamamlandı</span>
                            </div>
                        </div>
                    </div>

                    <form id="onboardingForm" onSubmit={(e) => e.preventDefault()}>
                        {/* Step 1: Business Info */}
                        {step === 1 && (
                            <div className="wizard-step active">
                                <div className="wizard-content">
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>İşletme Bilgileri</h2>
                                    <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Restoranınızın temel bilgilerini girin.</p>

                                    <div className="form-group">
                                        <label htmlFor="businessName" className="form-label">İşletme Adı</label>
                                        <input type="text" id="businessName" className="form-input" placeholder="Örn: Lezzet Durağı" required />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="city" className="form-label">Şehir (İsteğe bağlı)</label>
                                        <input type="text" id="city" className="form-input" placeholder="Örn: İstanbul" />
                                    </div>
                                </div>
                                <div className="wizard-actions" style={{ justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>Devam Et</button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: First Menu Item */}
                        {step === 2 && (
                            <div className="wizard-step active">
                                <div className="wizard-content">
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>İlk Menünü Oluştur</h2>
                                    <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Hızlıca bir kategori ve ürün ekleyerek başlayalım.</p>

                                    <div className="form-group">
                                        <label htmlFor="categoryName" className="form-label">Kategori Adı</label>
                                        <input type="text" id="categoryName" className="form-input" placeholder="Örn: Ana Yemekler" defaultValue="Popüler Ürünler" />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label htmlFor="productName" className="form-label">Ürün Adı</label>
                                            <input type="text" id="productName" className="form-input" placeholder="Örn: Cheeseburger" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="productPrice" className="form-label">Fiyat (₺)</label>
                                            <input type="number" id="productPrice" className="form-input" placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>
                                <div className="wizard-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Geri</button>
                                    <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>Devam Et</button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Success / QR Layout */}
                        {step === 3 && (
                            <div className="wizard-step active">
                                <div className="wizard-content" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Harika! İşletmen Hazır.</h2>
                                    <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>QR menünüz otomatik olarak oluşturuldu. Hemen kullanmaya başlayabilirsiniz.</p>

                                    <div className="qr-preview">
                                        <div className="qr-placeholder">
                                            🏁
                                        </div>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Masa 1</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>oneqr.tr/m/lezzet-duragi</p>
                                    </div>
                                </div>
                                <div className="wizard-actions" style={{ justifyContent: 'center' }}>
                                    <Link
                                        href="/admin"
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={() => {
                                            const name = (document.getElementById('businessName') as HTMLInputElement)?.value;
                                            if (name) localStorage.setItem('oneqr_business_name', name);
                                        }}
                                    >
                                        Yönetim Paneline Git
                                    </Link>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
