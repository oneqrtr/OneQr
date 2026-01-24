
import * as React from 'react';

interface WelcomeEmailProps {
    businessName: string;
}

export const WelcomeEmailTemplate: React.FC<Readonly<WelcomeEmailProps>> = ({
    businessName,
}) => (
    <div style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        backgroundColor: '#f9fafb',
        padding: '40px 20px',
        color: '#333'
    }}>
        <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
            {/* Header with Logo */}
            <div style={{
                backgroundColor: '#111827',
                padding: '32px 20px',
                textAlign: 'center'
            }}>
                <h1 style={{ color: 'white', margin: 0, fontSize: '24px', letterSpacing: '1px' }}>OneQR</h1>
            </div>

            {/* Content */}
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
                <h2 style={{
                    color: '#111827',
                    fontSize: '24px',
                    marginBottom: '24px',
                    fontWeight: 'bold'
                }}>
                    Hoş Geldiniz, {businessName}! 🎉
                </h2>

                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#4B5563',
                    marginBottom: '32px'
                }}>
                    OneQR ailesine katıldığınız için teşekkür ederiz. Restoranınızın dijital dönüşümünü başlatmak için harika bir adım attınız.
                    <br /><br />
                    Hesabınız başarıyla oluşturuldu ve <strong>Deneme Planınız</strong> aktif edildi. Menünüzü oluşturmaya hemen başlayabilirsiniz.
                </p>

                <a href="https://oneqr.tr/admin" style={{
                    display: 'inline-block',
                    backgroundColor: '#2563EB',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginBottom: '32px',
                    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
                }}>
                    Yönetim Paneline Git
                </a>

                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                    Sorularınız mı var? Bu e-postaya cevap vererek bize ulaşabilirsiniz.
                </p>
            </div>

            {/* Footer */}
            <div style={{
                backgroundColor: '#F3F4F6',
                padding: '24px',
                textAlign: 'center',
                borderTop: '1px solid #E5E7EB'
            }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
                    © {new Date().getFullYear()} OneQR. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    </div>
);

export default WelcomeEmailTemplate;
