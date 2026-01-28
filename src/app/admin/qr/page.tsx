'use client';
import { useEffect, useState, useRef } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function QrPage() {
    const [slug, setSlug] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState('');
    const qrRef = useRef<HTMLDivElement>(null);

    // New state for customization
    const [qrColor, setQrColor] = useState('#000000');
    const [useLogo, setUseLogo] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchInfo = async () => {
            // ... existing fetch logic ...
            // Adding logo_url fetch
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let rest = null;
            for (let i = 0; i < 3; i++) {
                const { data } = await supabase
                    .from('restaurants')
                    .select('slug, name, logo_url')  // Changed to include logo_url
                    .eq('owner_id', user.id)
                    .maybeSingle();

                if (data) {
                    rest = data;
                    break;
                }
                await new Promise(r => setTimeout(r, 500));
            }

            if (rest) {
                setSlug(rest.slug);
                setBusinessName(rest.name);
                setLogoUrl(rest.logo_url);
            }
        };
        fetchInfo();
    }, []);

    const handleDownload = async () => {
        if (!qrRef.current) return;

        try {
            const canvas = await html2canvas(qrRef.current, {
                scale: 3, // Higher resolution for custom colors
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure the cloned node has white background explicitly
                    const element = clonedDoc.querySelector('[data-qr-container]');
                    if (element) (element as HTMLElement).style.background = 'white';
                }
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = 140;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2 - 20;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

            pdf.setFontSize(24);
            pdf.setTextColor(33, 33, 33);
            pdf.text(businessName, pdfWidth / 2, y - 15, { align: 'center' });

            pdf.setFontSize(14);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Menüye ulaşmak için kameranızla taratın', pdfWidth / 2, y + imgHeight + 15, { align: 'center' });

            const fileName = slug ? `OneQr-${slug}.pdf` : `OneQr.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('PDF creation failed', error);
            alert('PDF oluşturulurken bir hata oluştu.');
        }
    };

    if (!slug) return <div>Yükleniyor...</div>;

    const baseUrl = 'https://oneqr.tr';

    return (
        <>
            <Topbar title="QR Kod İşlemleri" />
            <div className="content-wrapper">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Customization Controls */}
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>QR Rengi</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="color"
                                    value={qrColor}
                                    onChange={(e) => setQrColor(e.target.value)}
                                    style={{ width: '40px', height: '40px', cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}
                                />
                                <span style={{ fontFamily: 'monospace', color: '#6B7280' }}>{qrColor}</span>
                            </div>
                        </div>

                        {logoUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="useLogo"
                                    checked={useLogo}
                                    onChange={(e) => setUseLogo(e.target.checked)}
                                    disabled={!logoUrl} // Disable if no logo, though logoUrl check above handles visibility
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="useLogo" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>İşletme Logosunu Kullan</label>
                            </div>
                        )}
                    </div>

                    {/* QR Type Selection */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>QR Hedefi</div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={() => setQrType('menu')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: qrType === 'menu' ? '2px solid #2563EB' : '1px solid #E5E7EB',
                                    background: qrType === 'menu' ? '#EFF6FF' : 'white',
                                    color: qrType === 'menu' ? '#1E40AF' : '#6B7280',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                <i className="fa-solid fa-utensils" style={{ marginRight: '8px' }}></i>
                                Menü
                            </button>
                            <button
                                onClick={() => {
                                    if (isEligibleForCard) setQrType('card');
                                    else alert('Dijital Kartvizit özelliği sadece Plusimum pakette aktiftir.');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: qrType === 'card' ? '2px solid #2563EB' : '1px solid #E5E7EB',
                                    background: qrType === 'card' ? '#EFF6FF' : (isEligibleForCard ? 'white' : '#F3F4F6'),
                                    color: qrType === 'card' ? '#1E40AF' : (isEligibleForCard ? '#6B7280' : '#9CA3AF'),
                                    cursor: isEligibleForCard ? 'pointer' : 'not-allowed',
                                    fontWeight: 500,
                                    position: 'relative'
                                }}
                            >
                                <i className="fa-solid fa-address-card" style={{ marginRight: '8px' }}></i>
                                Dijital Kartvizit
                                {!isEligibleForCard && <i className="fa-solid fa-lock" style={{ marginLeft: '8px', color: '#D97706' }}></i>}
                            </button>
                        </div>
                        {!isEligibleForCard && (
                            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#D97706' }}>
                                * Dijital Kartvizit özelliği Plusimum pakete özeldir.
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* QR Display Card */}
                        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', width: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div ref={qrRef} data-qr-container style={{ background: 'white', padding: '30px', textAlign: 'center', minWidth: '300px' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', color: '#111827' }}>{businessName}</div>
                                <QRCodeSVG
                                    value={qrType === 'menu' ? `${baseUrl}/menu/${slug}` : `${baseUrl}/k/${slug}`}
                                    size={250}
                                    level="H"
                                    fgColor={qrColor}
                                    imageSettings={{
                                        src: (useLogo && logoUrl) ? logoUrl : "/logo-qr.png",
                                        x: undefined,
                                        y: undefined,
                                        height: 50,
                                        width: 50,
                                        excavate: true,
                                    }}
                                />
                                <div style={{ marginTop: '24px', fontSize: '0.9rem', color: '#6B7280', fontWeight: 500 }}>
                                    {qrType === 'menu' ? 'Menüye ulaşmak için taratın' : 'Kartvizite ulaşmak için taratın'}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ flex: 1, maxWidth: '400px' }}>
                            <h3 style={{ marginBottom: '16px' }}>QR Kodu İndir</h3>
                            <button onClick={handleDownload} className="btn btn-primary btn-large" style={{ width: '100%', marginBottom: '16px' }}>
                                <i className="fa-solid fa-file-pdf" style={{ marginRight: '10px' }}></i>
                                PDF Olarak İndir
                            </button>
                            <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '8px', border: '1px solid #DBEAFE', color: '#1E40AF', fontSize: '0.9rem' }}>
                                <i className="fa-circle-info fa-solid" style={{ marginRight: '8px' }}></i>
                                <strong>İpucu:</strong> Renkli QR kodlarında kontrastın yüksek olduğundan emin olun, aksi halde bazı kameralar okuyamayabilir.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
