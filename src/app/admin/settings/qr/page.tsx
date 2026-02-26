'use client';
import { useEffect, useState, useRef } from 'react';
import Topbar from '@/components/Topbar';
import SettingsNav from '../SettingsNav';
import { createClient } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function QrPage() {
    const [slug, setSlug] = useState<string | null>(null);
    const [businessName, setBusinessName] = useState('');
    const qrRef = useRef<HTMLDivElement>(null);

    const [qrColor, setQrColor] = useState('#000000');
    const [useLogo, setUseLogo] = useState(true);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [qrType, setQrType] = useState<'menu' | 'restoran' | 'card' | 'website'>('menu');
    const [plan, setPlan] = useState('freemium');
    const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
    const [tableCount, setTableCount] = useState(0);
    const masaQrRefs = useRef<(HTMLDivElement | null)[]>([]);

    const supabase = createClient();

    useEffect(() => {
        const fetchInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let rest = null;
            for (let i = 0; i < 3; i++) {
                const { data } = await supabase
                    .from('restaurants')
                    .select('slug, name, logo_url, plan, website_url, table_count')
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
                setPlan(rest.plan || 'freemium');
                setWebsiteUrl(rest.website_url || null);
                setTableCount(Math.min(99, Math.max(0, Number(rest.table_count) || 0)));
            }
        };
        fetchInfo();
    }, []);

    const isEligibleForAdvanced = plan === 'plusimum' || plan === 'trial' || plan === 'freemium';

    const handleDownload = async () => {
        if (!qrRef.current) return;
        try {
            const canvas = await html2canvas(qrRef.current, {
                scale: 3,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const element = clonedDoc.querySelector('[data-qr-container]');
                    if (element) (element as HTMLElement).style.background = 'white';
                }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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
            const footerText = qrType === 'menu' ? 'Menüye ulaşmak için kameranızla taratın' : qrType === 'restoran' ? 'Restoran içi sipariş için taratın' : qrType === 'card' ? 'Kartvizite ulaşmak için kameranızla taratın' : 'Web sitesine gitmek için kameranızla taratın';
            pdf.text(footerText, pdfWidth / 2, y + imgHeight + 15, { align: 'center' });
            const fileName = slug ? `OneQr-${slug}-${qrType}.pdf` : `OneQr.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('PDF creation failed', error);
            alert('PDF oluşturulurken bir hata oluştu.');
        }
    };

    const handleDownloadAllMasaPdf = async () => {
        if (!slug || tableCount < 1) return;
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgSize = 120;
            for (let i = 0; i < tableCount; i++) {
                const el = masaQrRefs.current[i];
                if (!el) continue;
                const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
                const imgData = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * imgSize) / canvas.width;
                const x = (pdfWidth - imgSize) / 2;
                const y = (pdfHeight - imgHeight) / 2 - 15;
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', x, y, imgSize, imgHeight);
                pdf.setFontSize(14);
                pdf.setTextColor(80, 80, 80);
                pdf.text(`Masa ${i + 1}`, pdfWidth / 2, y + imgHeight + 12, { align: 'center' });
            }
            pdf.save(slug ? `OneQr-${slug}-masalar.pdf` : 'OneQr-masalar.pdf');
        } catch (e) {
            console.error(e);
            alert('Masa QR PDF oluşturulurken bir hata oluştu.');
        }
    };

    if (!slug) return <div>Yükleniyor...</div>;

    const baseUrl = 'https://oneqr.tr';

    return (
        <>
            <Topbar titleContent={<SettingsNav />} />
            <div className="content-wrapper">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>QR Rengi</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)} style={{ width: '40px', height: '40px', cursor: 'pointer', border: 'none', padding: 0, background: 'none' }} />
                                <span style={{ fontFamily: 'monospace', color: '#6B7280' }}>{qrColor}</span>
                            </div>
                        </div>
                        {logoUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" id="useLogo" checked={useLogo} onChange={(e) => setUseLogo(e.target.checked)} disabled={!logoUrl} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                                <label htmlFor="useLogo" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>İşletme Logosunu Kullan</label>
                            </div>
                        )}
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>QR Hedefi</div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <button onClick={() => setQrType('menu')} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: qrType === 'menu' ? '2px solid #2563EB' : '1px solid #E5E7EB', background: qrType === 'menu' ? '#EFF6FF' : 'white', color: qrType === 'menu' ? '#1E40AF' : '#6B7280', cursor: 'pointer', fontWeight: 500 }}>
                                <i className="fa-solid fa-globe" style={{ marginRight: '8px' }}></i> Menü (Online / Paket)
                            </button>
                            <button onClick={() => setQrType('restoran')} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: qrType === 'restoran' ? '2px solid #059669' : '1px solid #E5E7EB', background: qrType === 'restoran' ? '#ECFDF5' : 'white', color: qrType === 'restoran' ? '#047857' : '#6B7280', cursor: 'pointer', fontWeight: 500 }}>
                                <i className="fa-solid fa-utensils" style={{ marginRight: '8px' }}></i> Restoran Sipariş Menüsü
                            </button>
                            <button onClick={() => { if (isEligibleForAdvanced) setQrType('website'); else alert('Web Sitesi özelliği Premium pakette mevcut değildir. Lütfen Plusimum pakete geçiniz.'); }} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: qrType === 'website' ? '2px solid #2563EB' : '1px solid #E5E7EB', background: qrType === 'website' ? '#EFF6FF' : (isEligibleForAdvanced ? 'white' : '#F3F4F6'), color: qrType === 'website' ? '#1E40AF' : (isEligibleForAdvanced ? '#6B7280' : '#9CA3AF'), cursor: isEligibleForAdvanced ? 'pointer' : 'not-allowed', fontWeight: 500 }}>
                                <i className="fa-solid fa-globe" style={{ marginRight: '8px' }}></i> Web Sitesi {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ marginLeft: '8px', color: '#D97706' }}></i>}
                            </button>
                            <button onClick={() => { if (isEligibleForAdvanced) setQrType('card'); else alert('Dijital Kartvizit özelliği Premium pakette mevcut değildir. Lütfen Plusimum pakete geçiniz.'); }} style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '8px', border: qrType === 'card' ? '2px solid #2563EB' : '1px solid #E5E7EB', background: qrType === 'card' ? '#EFF6FF' : (isEligibleForAdvanced ? 'white' : '#F3F4F6'), color: qrType === 'card' ? '#1E40AF' : (isEligibleForAdvanced ? '#6B7280' : '#9CA3AF'), cursor: isEligibleForAdvanced ? 'pointer' : 'not-allowed', fontWeight: 500 }}>
                                <i className="fa-solid fa-address-card" style={{ marginRight: '8px' }}></i> Dijital Kartvizit {!isEligibleForAdvanced && <i className="fa-solid fa-lock" style={{ marginLeft: '8px', color: '#D97706' }}></i>}
                            </button>
                        </div>
                        {!isEligibleForAdvanced && <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#D97706' }}>* Web Sitesi ve Dijital Kartvizit özellikleri <strong>Plusimum</strong> pakete özeldir.</div>}
                    </div>

                    <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', width: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div ref={qrRef} data-qr-container style={{ background: 'white', padding: '30px', textAlign: 'center', minWidth: '300px' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', color: '#111827' }}>{businessName}</div>
                                <QRCodeSVG
                                    value={qrType === 'menu' ? `https://${slug}.oneqr.tr` : qrType === 'restoran' ? `${baseUrl}/restoran/${slug}` : qrType === 'card' ? `${baseUrl}/k/${slug}` : (websiteUrl || `https://${slug}.oneqr.tr`)}
                                    size={250}
                                    level="H"
                                    fgColor={qrColor}
                                    imageSettings={{ src: (useLogo && logoUrl) ? logoUrl : '/logo-qr.png', height: 50, width: 50, excavate: true }}
                                />
                                <div style={{ marginTop: '24px', fontSize: '0.9rem', color: '#6B7280', fontWeight: 500 }}>
                                    {qrType === 'menu' && 'Menüye ulaşmak için taratın'}
                                    {qrType === 'restoran' && 'Restoran içi sipariş (masa) için taratın'}
                                    {qrType === 'card' && 'Kartvizite ulaşmak için taratın'}
                                    {qrType === 'website' && 'Web sitesine gitmek için taratın'}
                                </div>
                            </div>
                        </div>
                        <div style={{ flex: 1, maxWidth: '400px' }}>
                            <h3 style={{ marginBottom: '16px' }}>QR Kodu İndir</h3>
                            <button onClick={handleDownload} className="btn btn-primary btn-large" style={{ width: '100%', marginBottom: '16px' }}>
                                <i className="fa-solid fa-file-pdf" style={{ marginRight: '10px' }}></i> PDF Olarak İndir
                            </button>
                            <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '8px', border: '1px solid #DBEAFE', color: '#1E40AF', fontSize: '0.9rem' }}>
                                <i className="fa-circle-info fa-solid" style={{ marginRight: '8px' }}></i><strong>İpucu:</strong> Renkli QR kodlarında kontrastın yüksek olduğundan emin olun.
                            </div>
                        </div>
                    </div>

                    {tableCount > 0 && (
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>Masa QR Kodları</div>
                            <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '16px' }}>Her masa için menü linki</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                                {Array.from({ length: tableCount }, (_, i) => (
                                    <div key={i} ref={el => { masaQrRefs.current[i] = el; }} style={{ background: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>Masa {i + 1}</div>
                                        <QRCodeSVG value={`${baseUrl}/menu/${slug}?masa=${i + 1}`} size={120} level="H" fgColor={qrColor} imageSettings={useLogo && logoUrl ? { src: logoUrl, height: 28, width: 28, excavate: true } : undefined} />
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={handleDownloadAllMasaPdf} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                                <i className="fa-solid fa-file-pdf" style={{ marginRight: '8px' }}></i> Tüm masa QR'larını PDF olarak indir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
