'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [businessName, setBusinessName] = useState('');
    const [businessSlug, setBusinessSlug] = useState('');
    const [categoryName, setCategoryName] = useState('Popüler Ürünler');
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');

    // Result State
    const [createdSlug, setCreatedSlug] = useState('');

    const slugify = (text: string) => {
        const trMap: { [key: string]: string } = {
            'ç': 'c', 'Ç': 'c',
            'ğ': 'g', 'Ğ': 'g',
            'ş': 's', 'Ş': 's',
            'ü': 'u', 'Ü': 'u',
            'ı': 'i', 'I': 'i',
            'İ': 'i',
            'ö': 'o', 'Ö': 'o'
        };

        return text
            .split('')
            .map(char => trMap[char] || char)
            .join('')
            .toLowerCase()
            .replace(/\s+/g, '-')     // Spaces to -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, '-')   // Replace multiple - with single -
            .replace(/^-+/, '')       // Trim - from start
            .replace(/-+$/, '');      // Trim - from end
    };

    // State to track if slug was manually edited
    // State to track if slug was manually edited
    const [isSlugEdited, setIsSlugEdited] = useState(false);
    const [isSlugAvailable, setIsSlugAvailable] = useState(true);
    const [isCheckingSlug, setIsCheckingSlug] = useState(false);
    // Debounce timer
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    const checkSlugAvailability = async (slug: string) => {
        if (!slug) return;
        setIsCheckingSlug(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (error) {
                console.error('Slug check error:', error);
                // On error, assume available to not block user, or handle differently
                setIsSlugAvailable(true);
            } else {
                // If data exists, slug is NOT available
                setIsSlugAvailable(!data);
            }
        } catch (err) {
            console.error('Unexpected error checking slug:', err);
            setIsSlugAvailable(true);
        } finally {
            setIsCheckingSlug(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setBusinessName(name);

        if (!isSlugEdited) {
            const newSlug = slugify(name);
            setBusinessSlug(newSlug);

            // Debounce check
            if (timer) clearTimeout(timer);
            const newTimer = setTimeout(() => {
                checkSlugAvailability(newSlug);
            }, 500);
            setTimer(newTimer);
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSlug = slugify(e.target.value);
        setBusinessSlug(newSlug);
        setIsSlugEdited(true);

        // Debounce check
        if (timer) clearTimeout(timer);
        const newTimer = setTimeout(() => {
            checkSlugAvailability(newSlug);
        }, 500);
        setTimer(newTimer);
    };

    const handleComplete = async () => {
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            // 1. Get Current User
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Kullanıcı oturumu bulunamadı.');
            }

            // 2. Check Slug Availability
            let finalSlug = businessSlug || slugify(businessName);
            if (!finalSlug) {
                throw new Error('Lütfen geçerli bir işletme linki belirleyin.');
            }

            // Simple check if slug exists
            const { data: existing } = await supabase
                .from('restaurants')
                .select('id')
                .eq('slug', finalSlug)
                .single();

            if (existing) {
                // Suggest a new slug
                finalSlug = `${finalSlug}-${Math.floor(Math.random() * 1000)}`;
                alert(`Seçtiğiniz link dolu. Sizin için güncelledik: ${finalSlug}`);
                setBusinessSlug(finalSlug);
            }

            // 3. Create Restaurant
            const { data: restaurant, error: restError } = await supabase
                .from('restaurants')
                .insert({
                    name: businessName,
                    slug: finalSlug,
                    owner_id: user.id
                })
                .select()
                .single();

            if (restError) throw restError;

            // 4. Create Category
            const { data: category, error: catError } = await supabase
                .from('categories')
                .insert({
                    restaurant_id: restaurant.id,
                    name: categoryName,
                    display_order: 1
                })
                .select()
                .single();

            if (catError) throw catError;

            // 5. Create Product (Optional if fields are filled)
            if (productName && productPrice) {
                const { error: prodError } = await supabase
                    .from('products')
                    .insert({
                        category_id: category.id,
                        name: productName,
                        price: parseFloat(productPrice),
                        display_order: 1,
                        is_available: true
                    });

                if (prodError) throw prodError;
            }

            // Success
            setCreatedSlug(finalSlug);
            // Save local fallback just in case
            localStorage.setItem('oneqr_business_name', businessName);
            setStep(3);

        } catch (err: any) {
            console.error('Onboarding Error:', err);
            setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-body" style={{ alignItems: 'flex-start', paddingTop: '60px' }}>
            <div className="wizard-container">
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Link href="/" className="logo">
                        <Image
                            src="/logoblack.png"
                            alt="OneQR"
                            width={120}
                            height={120}
                            style={{ height: '120px', width: 'auto' }}
                            priority
                        />
                    </Link>
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
                                        <input
                                            type="text"
                                            id="businessName"
                                            className="form-input"
                                            placeholder="Örn: Lezzet Durağı"
                                            required
                                            value={businessName}
                                            onChange={handleNameChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="businessSlug" className="form-label">İşletme Linki (oneqr.tr/menu/...)</label>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ background: '#F3F4F6', padding: '10px 12px', border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#6B7280', fontSize: '0.9rem' }}>oneqr.tr/menu/</span>
                                            <input
                                                type="text"
                                                id="businessSlug"
                                                className="form-input"
                                                style={{
                                                    borderRadius: '0 8px 8px 0',
                                                    borderColor: !isSlugAvailable ? '#EF4444' : businessSlug && isSlugAvailable ? '#10B981' : ''
                                                }}
                                                placeholder="lezzet-duragi"
                                                value={businessSlug}
                                                onChange={handleSlugChange}
                                                required
                                            />
                                        </div>
                                        <div style={{ marginTop: '4px', minHeight: '20px' }}>
                                            {isCheckingSlug ? (
                                                <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>Kontrol ediliyor...</p>
                                            ) : !isSlugAvailable ? (
                                                <p style={{ fontSize: '0.8rem', color: '#EF4444' }}>Bu link maalesef kullanımda. Lütfen başka bir link seçin.</p>
                                            ) : businessSlug ? (
                                                <p style={{ fontSize: '0.8rem', color: '#10B981' }}>Bu link kullanılabilir.</p>
                                            ) : (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Türkçe karakter ve boşluk kullanmayınız. Otomatik düzenlenecektir.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="city" className="form-label">Şehir (İsteğe bağlı)</label>
                                        <input type="text" id="city" className="form-input" placeholder="Örn: İstanbul" />
                                    </div>
                                </div>
                                <div className="wizard-actions" style={{ justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        disabled={!businessName || !businessSlug || !isSlugAvailable || isCheckingSlug}
                                        onClick={() => setStep(2)}
                                    >
                                        Devam Et
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: First Menu Item */}
                        {step === 2 && (
                            <div className="wizard-step active">
                                <div className="wizard-content">
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>İlk Menünü Oluştur</h2>
                                    <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Hızlıca bir kategori ve ürün ekleyerek başlayalım.</p>

                                    {error && (
                                        <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                                            {error}
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label htmlFor="categoryName" className="form-label">Kategori Adı</label>
                                        <input
                                            type="text"
                                            id="categoryName"
                                            className="form-input"
                                            placeholder="Örn: Ana Yemekler"
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label htmlFor="productName" className="form-label">Ürün Adı</label>
                                            <input
                                                type="text"
                                                id="productName"
                                                className="form-input"
                                                placeholder="Örn: Cheeseburger"
                                                value={productName}
                                                onChange={(e) => setProductName(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="productPrice" className="form-label">Fiyat (₺)</label>
                                            <input
                                                type="number"
                                                id="productPrice"
                                                className="form-input"
                                                placeholder="0.00"
                                                value={productPrice}
                                                onChange={(e) => setProductPrice(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="wizard-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Geri</button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleComplete}
                                        disabled={loading}
                                    >
                                        {loading ? 'Oluşturuluyor...' : 'Tamamla'}
                                    </button>
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
                                        <div className="qr-placeholder" style={{ padding: '0', border: 'none', background: 'transparent' }}>
                                            {createdSlug && (
                                                <QRCodeSVG
                                                    value={`https://oneqr.tr/menu/${createdSlug}`}
                                                    size={150}
                                                    bgColor={"#ffffff"}
                                                    fgColor={"#000000"}
                                                    level={"L"}
                                                    includeMargin={false}
                                                />
                                            )}
                                        </div>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '16px', color: '#111827' }}>{businessName}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>oneqr.tr/menu/{createdSlug}</p>
                                    </div>
                                </div>
                                <div className="wizard-actions" style={{ justifyContent: 'center' }}>
                                    <Link
                                        href="/admin"
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
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
