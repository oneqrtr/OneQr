'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        // const name = formData.get('name') as string; // We can use metadata to store name if needed

        const supabase = createClient();

        // 1. Sign up user
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // 2. Redirect to onboarding
        router.push('/onboarding');
    };

    const handleGoogleLogin = async () => {
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `https://oneqr.tr/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Google Login Error:', error);
            alert('Google girişi başlatılamadı: ' + error.message);
        }
    };

    return (
        <div className="auth-card">
            <div className="auth-header">
                <Link href="/" className="logo" style={{ display: 'block', marginBottom: '24px' }}>
                    <img src="/logoblack.png" alt="OneQR" style={{ height: '40px' }} />
                </Link>
                <h1>Hesap Oluştur</h1>
                <p>7 günlük ücretsiz denemenizi başlatın</p>
            </div>

            {error && (
                <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            <button
                onClick={handleGoogleLogin}
                className="btn btn-outline"
                style={{ width: '100%', marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}
            >
                <i className="fa-brands fa-google" style={{ color: '#DB4437' }}></i>
                Google ile Üye Ol
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>VEYA</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            <form onSubmit={handleRegister}>
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Ad Soyad</label>
                    <input name="name" type="text" id="name" className="form-input" placeholder="Adınız Soyadınız" required />
                </div>
                <div className="form-group">
                    <label htmlFor="email" className="form-label">E-posta Adresi</label>
                    <input name="email" type="email" id="email" className="form-input" placeholder="mail@ornek.com" required />
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="form-label">Şifre</label>
                    <input name="password" type="password" id="password" className="form-input" placeholder="••••••••" required />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                    {loading ? 'Kayıt Yapılıyor...' : 'Ücretsiz Başla'}
                </button>
            </form>
            <div className="form-footer">
                <p>Zaten hesabınız var mı? <Link href="/login">Giriş Yap</Link></p>
            </div>
        </div>
    )
}
