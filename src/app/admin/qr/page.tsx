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

    const supabase = createClient();

    useEffect(() => {
        const fetchInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Retry logic
            let rest = null;
            for (let i = 0; i < 3; i++) {
                const { data } = await supabase
                    .from('restaurants')
                    .select('slug, name')
                    .eq('owner_id', user.id)
                    .maybeSingle();

                if (data) {
                    rest = data;
                    break;
                }
                // Wait 500ms
                await new Promise(r => setTimeout(r, 500));
            }

            if (rest) {
                setSlug(rest.slug);
                setBusinessName(rest.name);
            }
        };
        fetchInfo();
    }, []);

    const handleDownload = async () => {
        if (!qrRef.current) return;

        try {
            const canvas = await html2canvas(qrRef.current, {
                scale: 2, // High resolution
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');

            // Create PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = 140; // width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2 - 20;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

            // Add Text
            pdf.setFontSize(24);
            pdf.setTextColor(33, 33, 33);
            pdf.text(businessName, pdfWidth / 2, y - 15, { align: 'center' });

            pdf.setFontSize(14);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Menüye ulaşmak için kameranızla taratın', pdfWidth / 2, y + imgHeight + 15, { align: 'center' });

            pdf.save(`${businessName}-QR.pdf`);
        } catch (error) {
            console.error('PDF creation failed', error);
            alert('PDF oluşturulurken bir hata oluştu.');
        }
    };

    if (!slug) return <div>Yükleniyor...</div>;

    // Determine base URL dynamically if on client
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://oneqr.tr';

    return (
        <>
            <Topbar title="QR Kod İşlemleri" />
            <div className="content-wrapper">
                <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

                    {/* QR Display Card */}
                    <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', width: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <div ref={qrRef} style={{ background: 'white', padding: '30px', textAlign: 'center', minWidth: '300px' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', color: '#111827' }}>{businessName}</div>
                            <QRCodeSVG
                                value={`${baseUrl}/m/${slug}`}
                                size={200}
                                level="H"
                                imageSettings={{
                                    src: "/logo-standard.png",
                                    x: undefined,
                                    y: undefined,
                                    height: 24,
                                    width: 24,
                                    excavate: true,
                                }}
                            />
                            <div style={{ marginTop: '24px', fontSize: '0.9rem', color: '#6B7280', fontWeight: 500 }}>{businessName}</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ flex: 1, maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '16px' }}>QR Kodu İndir</h3>
                        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>
                            Bu QR kodu yazdırıp masalarınıza yerleştirebilirsiniz. Müşterileriniz bu kodu okutarak doğrudan menünüze ulaşır.
                        </p>

                        <button onClick={handleDownload} className="btn btn-primary btn-large" style={{ width: '100%', marginBottom: '16px' }}>
                            <i className="fa-solid fa-file-pdf" style={{ marginRight: '10px' }}></i>
                            PDF Olarak İndir
                        </button>

                        <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '8px', border: '1px solid #DBEAFE', color: '#1E40AF', fontSize: '0.9rem' }}>
                            <i className="fa-circle-info fa-solid" style={{ marginRight: '8px' }}></i>
                            <strong>İpucu:</strong> Daha kaliteli baskı için PDF formatını tercih edin. İndirdikten sonra A4, A5 veya sticker kağıtlarına baskı alabilirsiniz.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
