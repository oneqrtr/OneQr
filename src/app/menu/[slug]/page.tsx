'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams } from 'next/navigation';

import Link from 'next/link';
import ContactFab from '@/components/ContactFab';
import { QRCodeSVG } from 'qrcode.react';

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    theme_color: string;
    currency: string;
    status: string;
    created_at: string;
    plan?: string; // 'freemium', 'premium', 'plusimum'
    logo_url?: string;
    description?: string;
    hero_image_url?: string;
    phone_number?: string;
    whatsapp_number?: string;
    is_call_enabled?: boolean;
    is_whatsapp_enabled?: boolean;
    is_location_enabled?: boolean;
    location_lat?: number;
    location_lng?: number;

    // Payment Settings
    payment_settings?: {
        cash: boolean;
        credit_card: boolean;
        meal_card: {
            enabled: boolean;
            methods: string[];
        };
        iban: {
            enabled: boolean;
            iban_no: string;
            account_name: string;
        };
    };
}
// ... (rest of the file until ContactFab props)


interface Category {
    id: string;
    name: string;
    description?: string;
}

interface Product {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    is_available: boolean;
}

interface Variant {
    id: string;
    product_id: string;
    name: string;
    description?: string;
    price: number;
    is_available: boolean;
}

export default function PublicMenuPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<string>(''); // For Image Modal

    // Cart State
    interface CartItem {
        id: string;
        name: string;
        price: number;
        quantity: number;
        variantName?: string;
    }
    const [cart, setCart] = useState<CartItem[]>([]);

    // PWA Install State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert("Uygulamayı yüklemek için tarayıcınızın menüsünden 'Ana Ekrana Ekle' veya 'Uygulamayı Yükle' seçeneğini kullanabilirsiniz.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    // Modal States
    const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    // Customer Info State
    const [customerInfo, setCustomerInfo] = useState({
        fullName: '',
        phone: '',
        addressType: 'manual' as 'manual' | 'location',
        locationLat: null as number | null,
        locationLng: null as number | null,
        addressDetail: '',
        // New Address Fields
        neighborhood: '',
        street: '',
        apartment: '',
        floor: '',
        doorNumber: '',
        isSite: false,
        siteName: '',
        block: '',

        paymentMethod: 'cash' as string, // 'cash', 'credit_card', 'meal_card', 'iban'
        mealCardProvider: '', // If paymentMethod is 'meal_card'
    });

    useEffect(() => {
        // Auto-fill address detail if structured fields are populated and addressDetail is empty or just has location data
        if (customerInfo.addressType === 'manual' &&
            customerInfo.neighborhood &&
            customerInfo.street &&
            !customerInfo.addressDetail) {
            setCustomerInfo(prev => ({ ...prev, addressDetail: "Muratpaşa, Antalya" }));
        }
    }, [customerInfo.neighborhood, customerInfo.street, customerInfo.addressType]);

    useEffect(() => {
        const savedInfo = localStorage.getItem('oneqr_customer_info');
        if (savedInfo) {
            try {
                const parsed = JSON.parse(savedInfo);
                setCustomerInfo(prev => ({
                    ...prev,
                    ...parsed
                }));
            } catch (e) {
                console.error("Failed to parse saved customer info", e);
            }
        }
    }, []);

    const saveCustomerInfoToLocal = () => {
        try {
            localStorage.setItem('oneqr_customer_info', JSON.stringify({
                fullName: customerInfo.fullName,
                phone: customerInfo.phone,
                addressType: customerInfo.addressType,
                addressDetail: customerInfo.addressDetail,
                // Don't save location coordinates as user might be elsewhere next time, or do save if preferred. 
                // Let's save address detail but maybe clear coordinates if manual address is typical.
                // Keeping it simple for now and saving all non-one-time fields.
                locationLat: customerInfo.locationLat,
                locationLng: customerInfo.locationLng
            }));
        } catch (e) {
            console.error("Failed to save customer info", e);
        }
    };

    const isOrderEnabled = true; // Always true for now (or check plan)

    const addToCart = (product: Product, variant?: Variant) => {
        if (!isOrderEnabled) return;
        setCart(prev => {
            const existingItem = prev.find(item => item.id === product.id && item.variantName === variant?.name);
            if (existingItem) {
                return prev.map(item =>
                    (item.id === product.id && item.variantName === variant?.name)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prev, {
                    id: product.id,
                    name: product.name,
                    price: variant ? (product.price + variant.price) : product.price,
                    quantity: 1,
                    variantName: variant?.name
                }];
            }
        });
        setSelectedProductForVariant(null);
    };

    const updateCartItemQuantity = (productId: string, variantName: string | undefined, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === productId && item.variantName === variantName) {
                    const newQuantity = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const handleProductClick = (product: Product) => {
        if (!isOrderEnabled) return;
        const productVariants = variants.filter(v => v.product_id === product.id);
        if (productVariants.length > 0) {
            setSelectedProductForVariant(product);
        } else {
            addToCart(product);
        }
    };

    const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const getPaymentMethodLabel = (method: string, provider?: string) => {
        if (method === 'cash') return 'Nakit (Kapıda Ödeme)';
        if (method === 'credit_card') return 'Kredi Kartı (Kapıda Ödeme)';
        if (method === 'meal_card') return `Yemek Kartı (${provider || 'Belirtilmedi'})`;
        if (method === 'iban') return 'IBAN / Havale';
        return method;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const sendWhatsappOrder = () => {
        if (!restaurant || !restaurant.whatsapp_number) return;

        let message = `Merhabalar, *${restaurant.name}* üzerinden sipariş vermek istiyorum:\n\n`;
        let totalAmount = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            message += `${item.quantity}x ${item.name}${item.variantName ? ` (${item.variantName})` : ''}: ${itemTotal} ${restaurant.currency}\n`;
        });

        message += `\n*Toplam Tutar: ${totalAmount} ${restaurant.currency}*\n`;
        message += `--------------------------------\n`;
        message += `*Müşteri Bilgileri:*\n`;
        message += `👤 İsim: ${customerInfo.fullName}\n`;
        message += `📞 Telefon: ${customerInfo.phone}\n`;

        if (customerInfo.locationLat && customerInfo.locationLng) {
            message += `📍 Konum: https://www.google.com/maps/search/?api=1&query=${customerInfo.locationLat},${customerInfo.locationLng}\n`;
        }

        message += `🏠 Adres Detayı: ${customerInfo.addressDetail}\n`;
        message += `💳 Ödeme Yöntemi: ${getPaymentMethodLabel(customerInfo.paymentMethod, customerInfo.mealCardProvider)}`;

        const url = `https://wa.me/${restaurant.whatsapp_number}?text=${encodeURIComponent(message)}`;
        saveCustomerInfoToLocal();
        window.open(url, '_blank');
        setIsCheckoutModalOpen(false);
    };

    const submitSystemOrder = async () => {
        if (!restaurant) return;
        setIsSubmitting(true);

        const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        const supabase = createClient();
        const { error } = await supabase.from('orders').insert({
            restaurant_id: restaurant.id,
            customer_name: customerInfo.fullName,
            customer_phone: customerInfo.phone,
            address_type: customerInfo.addressType,
            address_detail: customerInfo.addressDetail,
            location_lat: customerInfo.locationLat,
            location_lng: customerInfo.locationLng,
            location_lng: customerInfo.locationLng,
            payment_method: customerInfo.paymentMethod === 'meal_card'
                ? `meal_card_${customerInfo.mealCardProvider}`
                : customerInfo.paymentMethod,
            items: cart, // Supabase handles JSONB
            total_amount: totalAmount,
            status: 'pending'
        });

        setIsSubmitting(false);
        saveCustomerInfoToLocal();

        if (error) {
            console.error('Sipariş hatası:', error);
            alert('Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.');
        } else {
            setOrderSuccess(true);
            setCart([]);
            // Close modal after 3 seconds or show success UI inside modal
            // User requested confirmation screen. We will handle it in the render.
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Tarayıcınız konum servisini desteklemiyor.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCustomerInfo(prev => ({
                    ...prev,
                    locationLat: position.coords.latitude,
                    locationLng: position.coords.longitude
                }));
                alert('Konumunuz eklendi. Kurye tam konumunuzu görebilecek.');
            },
            (error) => {
                console.error(error);
                alert('Konum alınamadı.');
            }
        );
    };

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const supabase = createClient();

                // 1. Fetch Restaurant
                const { data: restData, error: restError } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (restError || !restData) {
                    setLoading(false);
                    return; // Handle not found
                }

                // SUBSCRIPTION ENFORCEMENT logic
                const plan = restData.plan || 'freemium';
                const createdDate = new Date(restData.created_at);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isTrialActive = diffDays <= 14;

                const hostname = window.location.hostname;
                const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
                const rootDomain = isLocal ? 'localhost' : 'oneqr.tr';
                const isSubdomain = hostname !== rootDomain && hostname !== `www.${rootDomain}`;

                // Rule: Premium cannot use subdomain
                // Rule: Freemium can use subdomain only during trial
                // Rule: Plusimum can always use subdomain

                if (isSubdomain) {
                    let allowed = false;
                    if (plan === 'plusimum') allowed = true;
                    else if (plan === 'freemium' && isTrialActive) allowed = true;
                    // premium is never allowed on subdomain

                    if (!allowed) {
                        // Redirect to root path variant
                        const rootUrl = isLocal ? `http://localhost:3000/menu/${slug}` : `https://oneqr.tr/menu/${slug}`;
                        window.location.href = rootUrl;
                        return;
                    }
                }

                setRestaurant(restData);

                // 2. Fetch Categories
                const { data: catData, error: catError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('restaurant_id', restData.id)
                    .eq('is_visible', true)
                    .order('display_order', { ascending: true });

                if (catData) {
                    setCategories(catData);
                    if (catData.length > 0) setActiveCategory(catData[0].id);
                }

                // 3. Fetch Products
                if (catData && catData.length > 0) {
                    const catIds = catData.map(c => c.id);
                    const { data: prodData, error: prodError } = await supabase
                        .from('products')
                        .select('*')
                        .in('category_id', catIds)
                        .eq('is_available', true)
                        .eq('is_visible', true)
                        .order('display_order', { ascending: true });

                    if (prodData) {
                        setProducts(prodData);

                        // 4. Fetch Variants
                        const prodIds = prodData.map(p => p.id);
                        const { data: varData } = await supabase
                            .from('product_variants')
                            .select('*')
                            .in('product_id', prodIds)
                            .eq('is_available', true);

                        if (varData) setVariants(varData);
                    }
                }

            } catch (error) {
                console.error('Error fetching menu:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchMenu();
    }, [slug]);

    // Analytics Tracking
    useEffect(() => {
        if (!restaurant) return;

        const trackView = async () => {
            // Simple check to avoid counting the owner/admin as a visitor usually requires checking auth state, 
            // but for now we count all page loads or just check local storage to dedup session.
            // Using a simple session storage flag to dedup views per session
            const sessionKey = `viewed_${restaurant.id}`;
            if (sessionStorage.getItem(sessionKey)) return;

            const supabase = createClient();
            await supabase.from('analytics').insert({
                restaurant_id: restaurant.id,
                event_type: 'view_menu'
            });
            sessionStorage.setItem(sessionKey, 'true');
        };

        trackView();
    }, [restaurant]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#6b7280' }}>Menü yükleniyor...</p>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Restoran Bulunamadı</h1>
                <p>Aradığınız menüye ulaşılamıyor. Linki kontrol ediniz.</p>
            </div>
        );
    }

    // Check if restaurant is active
    if (restaurant.status !== 'active') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
                background: '#F9FAFB'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#FEE2E2',
                    color: '#EF4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    marginBottom: '24px'
                }}>
                    <i className="fa-solid fa-store-slash"></i>
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>
                    Hizmet Dışı
                </h1>
                <p style={{ color: '#6B7280', maxWidth: '400px', lineHeight: '1.5' }}>
                    <strong>{restaurant.name}</strong> şu anda hizmet vermemektedir.
                </p>
                <div style={{ marginTop: '32px' }}>
                    <Link href="/" style={{ color: '#2563EB', fontWeight: 500, textDecoration: 'none' }}>
                        &larr; OneQR Anasayfa
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>

            {/* Responsive Styles */}
            <style jsx global>{`
                /* Default Mobile View */
                .mobile-only { display: block; }
                .desktop-only { display: none; }
                .main-layout { display: block; }
                .content-area { padding: 20px; max-width: 600px; margin: 0 auto; }

                /* Desktop View (min-width: 768px) */
                @media (min-width: 768px) {
                    .mobile-only { display: none !important; }
                    .desktop-only { display: block !important; }
                    
                    .main-layout { 
                        display: flex !important; 
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 40px 20px;
                        gap: 40px;
                        align-items: flex-start;
                    }
                    
                    .desktop-sidebar {
                        width: 280px;
                        position: sticky;
                        top: 20px;
                        background: white;
                        padding: 24px;
                        border-radius: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                        border: 1px solid #E5E7EB;
                        flex-shrink: 0;
                        max-height: calc(100vh - 40px);
                        overflow-y: auto;
                    }

                    .content-area {
                        flex: 1;
                        padding: 0 !important;
                        max-width: none !important;
                        margin: 0 !important;
                    }

                    .cat-nav-btn {
                        display: block;
                        width: 100%;
                        text-align: left;
                        padding: 12px 16px !important;
                        margin-bottom: 8px;
                        border-radius: 8px !important;
                        font-size: 1rem !important;
                    }

                    .cat-nav-btn:hover {
                        background-color: #F3F4F6 !important;
                    }
                }
            `}</style>

            {/* Header / Cover (Mobile Only used for hero image logic, but re-used/hidden via CSS) */}
            <div className="mobile-only">
                <header style={{ background: 'white', padding: '0', textAlign: 'center', borderBottom: '1px solid #E5E7EB' }}>
                    {/* Hero Image */}
                    <div style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                        <img
                            src={restaurant.hero_image_url || "/images/defaults/cover_pizza.png"}
                            alt="Cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.src = "/images/defaults/cover_pizza.png"; }}
                        />
                    </div>

                    <div style={{ padding: '0 24px 24px' }}>
                        <div
                            onClick={handleInstallClick}
                            style={{
                                width: '100px',
                                height: '100px',
                                background: 'white',
                                borderRadius: '50%',
                                margin: '-50px auto 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: restaurant.theme_color,
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                border: '4px solid white',
                                position: 'relative',
                                zIndex: 11,
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                cursor: 'pointer',
                                animation: isInstallable ? 'pulse-logo 2s infinite' : 'none'
                            }}>
                            {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : restaurant.name.substring(0, 1)}
                        </div>

                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{restaurant.name}</h1>

                        {restaurant.description && (
                            <p style={{ color: '#6B7280', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 8px', lineHeight: '1.5' }}>
                                {restaurant.description}
                            </p>
                        )}

                        <div style={{ fontSize: '0.8rem', color: '#3B82F6', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '10px' }}>
                            <i className="fa-solid fa-arrow-up"></i>
                            Logoya tıklayarak uygulamayı indirebilirsiniz
                        </div>
                        <style>{`
                            @keyframes pulse {
                                0% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7); }
                                70% { box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
                                100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
                            }
                        `}</style>
                    </div>
                </header>
            </div>

            {/* Sticky Category Bar (Mobile Only) */}
            <div className="mobile-only" style={{
                position: 'sticky',
                top: 0,
                zIndex: 20,
                background: 'white',
                padding: '12px 0',
                borderBottom: '1px solid #E5E7EB',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    padding: '0 20px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    justifyContent: 'flex-start'
                }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                const element = document.getElementById(`cat-${cat.id}`);
                                if (element) {
                                    const headerOffset = 70;
                                    const elementPosition = element.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                                }
                                setActiveCategory(cat.id);
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                background: activeCategory === cat.id ? restaurant.theme_color : '#F3F4F6',
                                color: activeCategory === cat.id ? 'white' : '#374151',
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Layout Wrapper (Handles both desktop Sidebar and Main Content) */}
            <div className="main-layout">

                {/* Desktop Sidebar */}
                <aside className="desktop-sidebar desktop-only">
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '80px', height: '80px', margin: '0 auto 12px', background: 'white', borderRadius: '50%', border: '1px solid #E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: restaurant.theme_color, fontSize: '1.5rem', fontWeight: 'bold', overflow: 'hidden'
                        }}>
                            {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : restaurant.name.substring(0, 1)}
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{restaurant.name}</h2>
                        {restaurant.description && (
                            <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: '1.4' }}>{restaurant.description}</p>
                        )}
                    </div>

                    <nav>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>MENÜ</h3>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className="cat-nav-btn"
                                onClick={() => {
                                    const element = document.getElementById(`cat-${cat.id}`);
                                    if (element) {
                                        const headerOffset = 40;
                                        const elementPosition = element.getBoundingClientRect().top;
                                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                                    }
                                    setActiveCategory(cat.id);
                                }}
                                style={{
                                    border: 'none',
                                    background: activeCategory === cat.id ? '#EFF6FF' : 'transparent',
                                    color: activeCategory === cat.id ? restaurant.theme_color : '#374151',
                                    fontWeight: activeCategory === cat.id ? 600 : 500,
                                    cursor: 'pointer',
                                    borderLeft: activeCategory === cat.id ? `3px solid ${restaurant.theme_color}` : '3px solid transparent'
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Product Content */}
                <main className="content-area">
                    {/* Desktop Hero Image (if exists) */}
                    <div className="desktop-only" style={{ width: '100%', height: '250px', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
                        <img
                            src={restaurant.hero_image_url || "/images/defaults/cover_pizza.png"}
                            alt="Cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.src = "/images/defaults/cover_pizza.png"; }}
                        />
                    </div>

                    {categories.map(cat => {
                        const catProducts = products.filter(p => p.category_id === cat.id);
                        if (catProducts.length === 0) return null;

                        return (
                            <div key={cat.id} id={`cat-${cat.id}`} style={{ marginBottom: '32px', scrollMarginTop: '20px' }}>
                                <div style={{ marginBottom: '16px', paddingLeft: '4px', borderLeft: `4px solid ${restaurant.theme_color}` }}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                                        {cat.name}
                                    </h2>
                                    {cat.description && (
                                        <p style={{ fontSize: '0.9rem', color: '#6B7280', fontStyle: 'italic' }}>
                                            {cat.description}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                    {catProducts.map(product => (
                                        <div key={product.id} style={{
                                            background: 'white',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            display: 'flex',
                                            flexDirection: 'column', // Prepare for vertical stacking if needed, but inner is flex row usually
                                            gap: '12px',
                                            border: '1px solid #F3F4F6'
                                        }}>
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#111827' }}>{product.name}</h3>
                                                    {product.description && (
                                                        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '12px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
                                                    )}

                                                    {/* Variants Display */}
                                                    {variants.filter(v => v.product_id === product.id).length > 0 && (
                                                        <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            {variants.filter(v => v.product_id === product.id).map(variant => (
                                                                <span key={variant.id} style={{
                                                                    fontSize: '0.75rem',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '12px',
                                                                    background: '#F3F4F6',
                                                                    color: '#4B5563',
                                                                    border: '1px solid #E5E7EB',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    <strong style={{ fontWeight: 600, marginRight: '4px' }}>{variant.name}</strong>
                                                                    {variant.price > 0 ? `+${variant.price} ${restaurant.currency}` : ''}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: restaurant.theme_color }}>
                                                            {product.price} {restaurant.currency}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleProductClick(product);
                                                            }}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                border: 'none',
                                                                background: restaurant.theme_color,
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                fontSize: '1.2rem'
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-plus"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                {product.image_url && (
                                                    <div style={{ width: '100px', height: '100px', flexShrink: 0, cursor: 'pointer' }} onClick={() => {
                                                        setSelectedImage(product.image_url || '');
                                                        // Log analytics
                                                        const supabase = createClient();
                                                        supabase.from('analytics').insert({
                                                            restaurant_id: restaurant.id,
                                                            event_type: 'view_product',
                                                            metadata: { product_id: product.id }
                                                        }).then();
                                                    }}>
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </main>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px', backdropFilter: 'blur(5px)'
                }} onClick={() => setSelectedImage('')}>
                    <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '90vh' }}>
                        <button
                            onClick={() => setSelectedImage('')}
                            style={{
                                position: 'absolute', top: '-40px', right: '0', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                                width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', zIndex: 1001
                            }}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <img src={selectedImage} alt="Full Screen" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e) => e.stopPropagation()} />
                    </div>
                </div>
            )}

            {/* Variant Modal */}
            {selectedProductForVariant && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)'
                }} onClick={() => setSelectedProductForVariant(null)}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: '#111827' }}>{selectedProductForVariant.name}</h3>
                        <p style={{ color: '#6B7280', marginBottom: '16px' }}>Lütfen bir seçenek belirleyin:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {variants.filter(v => v.product_id === selectedProductForVariant!.id).map(variant => (
                                <button
                                    key={variant.id}
                                    onClick={() => addToCart(selectedProductForVariant!, variant)}
                                    style={{
                                        padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB',
                                        background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        cursor: 'pointer', textAlign: 'left'
                                    }}
                                >
                                    <span style={{ fontWeight: 500, color: '#374151' }}>{variant.name}</span>
                                    <span style={{ color: restaurant?.theme_color, fontWeight: 600 }}>+{variant.price} {restaurant?.currency}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {isCheckoutModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    backdropFilter: 'blur(3px)'
                }} onClick={() => setIsCheckoutModalOpen(false)}>
                    <div style={{
                        background: 'white', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '600px',
                        maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Sepetim</h3>
                            <button onClick={() => setIsCheckoutModalOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', color: '#6B7280', cursor: 'pointer' }}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Cart Items List */}
                        <div style={{ marginBottom: '24px', borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280' }}>
                                    <i className="fa-solid fa-basket-shopping" style={{ fontSize: '2rem', marginBottom: '12px', color: '#D1D5DB' }}></i>
                                    <p>Sepetinizde ürün bulunmuyor.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {cart.map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '12px', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>{item.name}</div>
                                                {item.variantName && <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{item.variantName}</div>}
                                                <div style={{ fontSize: '0.9rem', color: restaurant?.theme_color || '#000', fontWeight: 700, marginTop: '4px' }}>
                                                    {item.price * item.quantity} {restaurant?.currency}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <button
                                                    onClick={() => updateCartItemQuantity(item.id, item.variantName, -1)}
                                                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F3F4F6', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', paddingBottom: '4px' }}
                                                >-</button>
                                                <span style={{ fontWeight: 600, fontSize: '1rem', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateCartItemQuantity(item.id, item.variantName, 1)}
                                                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F3F4F6', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', paddingBottom: '4px' }}
                                                >+</button>
                                            </div>
                                        </div>
                                    ))}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                                        <span style={{ fontWeight: 600, color: '#374151', fontSize: '1.1rem' }}>Toplam Tutar</span>
                                        <span style={{ fontWeight: 800, color: restaurant?.theme_color || '#000', fontSize: '1.25rem' }}>
                                            {cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)} {restaurant?.currency}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Customer Form */}
                        {cart.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Sipariş Bilgileri</h3>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Ad Soyad</label>
                                    <input
                                        type="text"
                                        value={customerInfo.fullName}
                                        onChange={e => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                        placeholder="Adınız Soyadınız"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Telefon Numarası</label>
                                    <input
                                        type="tel"
                                        value={customerInfo.phone}
                                        onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                        placeholder="05XX XXX XX XX"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Teslimat Adresi</label>

                                    {/* Location Button */}
                                    <button
                                        onClick={handleGetLocation}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: customerInfo.locationLat ? '1px solid #10B981' : '1px solid #D1D5DB',
                                            background: customerInfo.locationLat ? '#ECFDF5' : 'white',
                                            color: customerInfo.locationLat ? '#047857' : '#374151',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer',
                                            marginBottom: '16px',
                                            fontWeight: 500
                                        }}
                                    >
                                        <i className={`fa-solid ${customerInfo.locationLat ? 'fa-check' : 'fa-location-dot'}`}></i>
                                        {customerInfo.locationLat ? 'Konum Eklendi (Kurye İçin)' : 'Tam Konum Ekle (Kurye İçin)'}
                                    </button>

                                    {/* Always show Address Fields */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <input
                                                className="form-input"
                                                value={customerInfo.neighborhood}
                                                onChange={e => setCustomerInfo({ ...customerInfo, neighborhood: e.target.value })}
                                                placeholder="Mahalle"
                                                required
                                            />
                                            <input
                                                className="form-input"
                                                value={customerInfo.street}
                                                onChange={e => setCustomerInfo({ ...customerInfo, street: e.target.value })}
                                                placeholder="Sokak / Cadde"
                                                required
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <input
                                                className="form-input"
                                                value={customerInfo.apartment}
                                                onChange={e => setCustomerInfo({ ...customerInfo, apartment: e.target.value })}
                                                placeholder="Apartman Adı / No"
                                                required
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    className="form-input"
                                                    value={customerInfo.floor}
                                                    onChange={e => setCustomerInfo({ ...customerInfo, floor: e.target.value })}
                                                    placeholder="Kat"
                                                    style={{ flex: 1 }}
                                                    required
                                                />
                                                <input
                                                    className="form-input"
                                                    value={customerInfo.doorNumber}
                                                    onChange={e => setCustomerInfo({ ...customerInfo, doorNumber: e.target.value })}
                                                    placeholder="Daire"
                                                    style={{ flex: 1 }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Sitede mi oturuyorsunuz? Checkbox */}
                                        <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 500, color: '#374151' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={customerInfo.isSite}
                                                    onChange={e => setCustomerInfo(({ ...customerInfo, isSite: e.target.checked }))}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                Sitede mi oturuyorsunuz?
                                            </label>

                                            {customerInfo.isSite && (
                                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #E5E7EB', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', animation: 'fadeIn 0.3s' }}>
                                                    <input
                                                        className="form-input"
                                                        value={customerInfo.siteName}
                                                        onChange={e => setCustomerInfo({ ...customerInfo, siteName: e.target.value })}
                                                        placeholder="Site Adı"
                                                        required={customerInfo.isSite}
                                                    />
                                                    <input
                                                        className="form-input"
                                                        value={customerInfo.block}
                                                        onChange={e => setCustomerInfo({ ...customerInfo, block: e.target.value })}
                                                        placeholder="Blok"
                                                        required={customerInfo.isSite}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <textarea
                                        value={customerInfo.addressDetail}
                                        onChange={e => setCustomerInfo({ ...customerInfo, addressDetail: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', marginTop: '16px' }}
                                        placeholder="Adres Tarifi (Örn: Bakkalın yanındaki sarı bina...) / Şehir"
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Ödeme Yöntemi</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                                        {/* Cash */}
                                        {(restaurant.payment_settings?.cash ?? true) && (
                                            <label style={{ padding: '12px', border: `1px solid ${customerInfo.paymentMethod === 'cash' ? restaurant.theme_color : '#E5E7EB'}`, borderRadius: '8px', cursor: 'pointer', background: customerInfo.paymentMethod === 'cash' ? '#F9FAFB' : 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <input type="radio" name="payment" value="cash" checked={customerInfo.paymentMethod === 'cash'} onChange={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'cash' })} />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <i className="fa-solid fa-money-bill-wave" style={{ color: '#10B981', width: '20px', textAlign: 'center' }}></i>
                                                    <span>Nakit (Kapıda Ödeme)</span>
                                                </div>
                                            </label>
                                        )}

                                        {/* Credit Card */}
                                        {(restaurant.payment_settings?.credit_card) && (
                                            <label style={{ padding: '12px', border: `1px solid ${customerInfo.paymentMethod === 'credit_card' ? restaurant.theme_color : '#E5E7EB'}`, borderRadius: '8px', cursor: 'pointer', background: customerInfo.paymentMethod === 'credit_card' ? '#F9FAFB' : 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <input type="radio" name="payment" value="credit_card" checked={customerInfo.paymentMethod === 'credit_card'} onChange={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'credit_card' })} />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <i className="fa-regular fa-credit-card" style={{ color: '#3B82F6', width: '20px', textAlign: 'center' }}></i>
                                                    <span>Kredi Kartı (Kapıda Ödeme)</span>
                                                </div>
                                            </label>
                                        )}

                                        {/* Meal Card */}
                                        {(restaurant.payment_settings?.meal_card?.enabled) && (
                                            <div style={{ border: `1px solid ${customerInfo.paymentMethod === 'meal_card' ? restaurant.theme_color : '#E5E7EB'}`, borderRadius: '8px', overflow: 'hidden' }}>
                                                <label style={{ padding: '12px', cursor: 'pointer', background: customerInfo.paymentMethod === 'meal_card' ? '#F9FAFB' : 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <input type="radio" name="payment" value="meal_card" checked={customerInfo.paymentMethod === 'meal_card'} onChange={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'meal_card', mealCardProvider: restaurant.payment_settings?.meal_card?.methods[0] || '' })} />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <i className="fa-solid fa-utensils" style={{ color: '#F59E0B', width: '20px', textAlign: 'center' }}></i>
                                                        <span>Yemek Kartı</span>
                                                    </div>
                                                </label>

                                                {customerInfo.paymentMethod === 'meal_card' && restaurant.payment_settings?.meal_card?.methods?.length > 0 && (
                                                    <div style={{ padding: '0 12px 12px 44px', background: '#F9FAFB' }}>
                                                        <select
                                                            className="form-input"
                                                            value={customerInfo.mealCardProvider}
                                                            onChange={e => setCustomerInfo({ ...customerInfo, mealCardProvider: e.target.value })}
                                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.9rem' }}
                                                        >
                                                            {restaurant.payment_settings.meal_card.methods.map(method => (
                                                                <option key={method} value={method}>{method}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* IBAN */}
                                        {(restaurant.payment_settings?.iban?.enabled) && (
                                            <div style={{ border: `1px solid ${customerInfo.paymentMethod === 'iban' ? restaurant.theme_color : '#E5E7EB'}`, borderRadius: '8px', overflow: 'hidden' }}>
                                                <label style={{ padding: '12px', cursor: 'pointer', background: customerInfo.paymentMethod === 'iban' ? '#F9FAFB' : 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <input type="radio" name="payment" value="iban" checked={customerInfo.paymentMethod === 'iban'} onChange={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'iban' })} />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <i className="fa-solid fa-building-columns" style={{ color: '#6366F1', width: '20px', textAlign: 'center' }}></i>
                                                        <span>IBAN / Havale</span>
                                                    </div>
                                                </label>

                                                {customerInfo.paymentMethod === 'iban' && (
                                                    <div style={{ padding: '12px', background: '#eef2ff', margin: '0 12px 12px', borderRadius: '8px', border: '1px dashed #6366F1' }}>
                                                        <div style={{ fontSize: '0.85rem', color: '#4338ca', marginBottom: '4px', fontWeight: 600 }}>{restaurant.payment_settings.iban.account_name}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                            <code style={{ fontSize: '0.9rem', color: '#1e1b4b', wordBreak: 'break-all' }}>{restaurant.payment_settings.iban.iban_no}</code>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // prevent label click
                                                                    navigator.clipboard.writeText(restaurant.payment_settings?.iban?.iban_no || '');
                                                                    alert('IBAN kopyalandı!');
                                                                }}
                                                                style={{ border: 'none', background: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', color: '#6366F1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                                            >
                                                                Kopyala
                                                            </button>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px' }}>
                                                            Lütfen ödeme açıklamanıza sipariş numaranızı veya isminizi yazınız.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                                    <button
                                        onClick={submitSystemOrder}
                                        disabled={!(customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.apartment && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) || isSubmitting}
                                        style={{
                                            background: '#F59E0B',
                                            color: 'white',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            fontSize: '1rem',
                                            fontWeight: 700,

                                            cursor: (customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.apartment && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) && !isSubmitting ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            opacity: (customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.apartment && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) && !isSubmitting ? 1 : 0.6,
                                            width: '100%'
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fa-solid fa-check"></i>
                                        )}
                                        {isSubmitting ? 'Sipariş Oluşturuluyor...' : 'Siparişi Tamamla'}
                                    </button>

                                    {restaurant.whatsapp_number && (
                                        <button
                                            onClick={sendWhatsappOrder}
                                            disabled={!(customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.apartment && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) || isSubmitting}
                                            style={{
                                                background: 'white',
                                                color: '#25D366',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '2px solid #25D366',
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                cursor: (customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.apartment && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) && !isSubmitting ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                opacity: (customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.apartment && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) && !isSubmitting ? 1 : 0.6,
                                                width: '100%'
                                            }}
                                        >
                                            <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.2rem' }}></i>
                                            Whatsapp ile Gönder
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Success Screen */}
                        {orderSuccess && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{
                                    width: '80px', height: '80px', background: '#D1FAE5', color: '#10B981',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '2.5rem', margin: '0 auto 24px'
                                }}>
                                    <i className="fa-solid fa-check"></i>
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Siparişiniz Alındı!</h3>
                                <p style={{ color: '#6B7280', marginBottom: '32px' }}>
                                    Siparişiniz restorana iletildi. En kısa sürede hazırlanacaktır.
                                </p>
                                <button
                                    onClick={() => {
                                        setOrderSuccess(false);
                                        setIsCheckoutModalOpen(false);
                                    }}
                                    style={{
                                        background: restaurant.theme_color,
                                        color: 'white',
                                        padding: '12px 32px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Tamam
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}


            <footer style={{
                background: '#111827',
                color: 'white',
                padding: '32px 20px',
                textAlign: 'center',
                marginTop: '40px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '8px',
                    borderRadius: '8px',
                    width: 'fit-content',
                    margin: '0 auto 16px'
                }}>
                    <QRCodeSVG
                        value="https://oneqr.tr"
                        size={80}
                        level="M"
                        imageSettings={{
                            src: "/logo-qr.png",
                            x: undefined,
                            y: undefined,
                            height: 20,
                            width: 20,
                            excavate: true,
                        }}
                    />
                </div>
                <div style={{ fontSize: '0.9rem', color: '#9CA3AF', marginBottom: '8px' }}>
                    Bu menü <a href="https://oneqr.tr" target="_blank" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'none' }}>OneQR</a> ile oluşturuldu.
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    Siz de kendi QR menünüzü hemen oluşturun.
                </div>
            </footer>


            <ContactFab
                callEnabled={restaurant.is_call_enabled || false}
                whatsappEnabled={restaurant.is_whatsapp_enabled || false}
                locationEnabled={restaurant.is_location_enabled || false}
                phoneNumber={restaurant.phone_number}
                whatsappNumber={restaurant.whatsapp_number}
                locationLat={restaurant.location_lat}
                locationLng={restaurant.location_lng}
                themeColor={restaurant.theme_color}
                cartCount={cartTotalCount}
                onWhatsappClick={() => setIsCheckoutModalOpen(true)}
                onCartClick={() => setIsCheckoutModalOpen(true)}
                orderEnabled={true}
            />

        </div>
    );
}
