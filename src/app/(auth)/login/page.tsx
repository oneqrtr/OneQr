import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="auth-card">
            <div className="auth-header">
                <Link href="/" className="logo" style={{ display: 'block', marginBottom: '24px' }}>OneQR</Link>
                <h1>Hoş Geldiniz</h1>
                <p>Hesabınıza giriş yapın</p>
            </div>
            <form action="/admin">
                <div className="form-group">
                    <label htmlFor="email" className="form-label">E-posta Adresi</label>
                    <input type="email" id="email" className="form-input" placeholder="mail@ornek.com" required />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Şifre</label>
                    <input type="password" id="password" className="form-input" placeholder="••••••••" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Giriş Yap</button>
            </form>
            <div className="form-footer">
                <p>Hesabınız yok mu? <Link href="/register">Ücretsiz Kayıt Ol</Link></p>
                <p style={{ marginTop: '12px' }}><a href="#" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Şifremi Unuttum</a></p>
            </div>
        </div>
    )
}
