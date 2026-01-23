import Link from 'next/link';

export default function RegisterPage() {
    return (
        <div className="auth-card">
            <div className="auth-header">
                <Link href="/" className="logo" style={{ display: 'block', marginBottom: '24px' }}>OneQR</Link>
                <h1>Hesap Oluştur</h1>
                <p>7 günlük ücretsiz denemenizi başlatın</p>
            </div>
            <form action="/onboarding">
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Ad Soyad</label>
                    <input type="text" id="name" className="form-input" placeholder="Adınız Soyadınız" required />
                </div>
                <div className="form-group">
                    <label htmlFor="email" className="form-label">E-posta Adresi</label>
                    <input type="email" id="email" className="form-input" placeholder="mail@ornek.com" required />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Şifre</label>
                    <input type="password" id="password" className="form-input" placeholder="••••••••" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Ücretsiz Başla</button>
            </form>
            <div className="form-footer">
                <p>Zaten hesabınız var mı? <Link href="/login">Giriş Yap</Link></p>
            </div>
        </div>
    )
}
