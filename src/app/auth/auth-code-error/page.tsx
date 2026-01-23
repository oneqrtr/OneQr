'use client';

import Link from 'next/link';

export default function AuthCodeError() {
    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>Oturum Açma Hatası</h1>
            <p>Giriş yapılırken bir sorun oluştu. Lütfen tekrar deneyin.</p>
            <Link href="/login" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                Tekrar Giriş Yap
            </Link>
        </div>
    );
}
