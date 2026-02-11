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
    is_order_enabled?: boolean;

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
    ingredients?: string[]; // Added
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
        basePrice: number; // Base product price
        finalPrice: number; // Unit price with variants
        quantity: number;
        selectedVariants: Variant[];
        excludedIngredients: string[];
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

    // Modal States for Options
    const [selectedProductForOptions, setSelectedProductForOptions] = useState<Product | null>(null);
    const [tempSelectedVariants, setTempSelectedVariants] = useState<Variant[]>([]);
    const [tempExcludedIngredients, setTempExcludedIngredients] = useState<string[]>([]);
    // Modal States
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
        apartmentName: '', // Apartman Adı
        buildingNumber: '', // Apartman No / Bina No
        floor: '',
        doorNumber: '', // Daire No
        isSite: false,
        siteName: '',
        block: '',

        paymentMethod: 'cash' as string, // 'cash', 'credit_card', 'meal_card', 'iban'
        mealCardProvider: '', // If paymentMethod is 'meal_card'
        rememberMe: true, // New
    });

    // Order Summary Modal State
    const [showOrderSummary, setShowOrderSummary] = useState(false);

    // Order Submission States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

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
                // Only load if rememberMe was true (or logic implies it)
                if (parsed.rememberMe !== false) {
                    setCustomerInfo(prev => ({
                        ...prev,
                        ...parsed,
                        // Ensure compatibility if new fields are missing in old data
                        rememberMe: parsed.rememberMe ?? true
                    }));
                }
            } catch (e) {
                console.error("Failed to parse saved customer info", e);
            }
        }
    }, []);

    const saveCustomerInfoToLocal = () => {
        if (!customerInfo.rememberMe) {
            localStorage.removeItem('oneqr_customer_info');
            return;
        }
        try {
            localStorage.setItem('oneqr_customer_info', JSON.stringify({
                fullName: customerInfo.fullName,
                phone: customerInfo.phone,
                addressType: customerInfo.addressType,
                addressDetail: customerInfo.addressDetail,
                // Save granular address fields
                neighborhood: customerInfo.neighborhood,
                street: customerInfo.street,
                apartmentName: customerInfo.apartmentName,
                buildingNumber: customerInfo.buildingNumber,
                floor: customerInfo.floor,
                doorNumber: customerInfo.doorNumber,
                isSite: customerInfo.isSite,
                siteName: customerInfo.siteName,
                block: customerInfo.block,
                rememberMe: customerInfo.rememberMe
            }));
        } catch (e) {
            console.error("Failed to save customer info", e);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Tarayıcınız konum servisini desteklemiyor.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setCustomerInfo(prev => ({
                    ...prev,
                    locationLat: lat,
                    locationLng: lng
                }));

                // Auto-fill address using OpenStreetMap Nominatim API (Free)
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                    const data = await response.json();

                    if (data && data.address) {
                        const addr = data.address;
                        setCustomerInfo(prev => ({
                            ...prev,
                            locationLat: lat,
                            locationLng: lng,
                            neighborhood: addr.suburb || addr.neighbourhood || addr.quarter || prev.neighborhood,
                            street: addr.road || prev.street,
                            buildingNumber: addr.house_number || prev.buildingNumber,
                            // Map other fields if available, but usually limited
                        }));
                    }
                } catch (error) {
                    console.error("Geocoding error:", error);
                    // Silent fail, user can edit
                }

                alert('Konumunuz alındı. Adres bilgileri otomatik olarak doldurulmaya çalışıldı, lütfen kontrol ediniz.');
            },
            (error) => {
                console.error(error);
                alert('Konum alınamadı.');
            }
        );
    };

    // Check if orders are enabled in restaurant settings
    const isOrderEnabled = restaurant?.is_order_enabled ?? true;

    // Helper to compare arrays for cart matching
    const arraysEqual = (a: any[], b: any[], key?: string) => {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort((x, y) => key ? x[key].localeCompare(y[key]) : x.localeCompare(y));
        const sortedB = [...b].sort((x, y) => key ? x[key].localeCompare(y[key]) : x.localeCompare(y));
        return sortedA.every((val, index) => {
            if (key) return val[key] === sortedB[index][key];
            return val === sortedB[index];
        });
    };

    const addToCart = (product: Product, selectedVars: Variant[], excludedIngs: string[]) => {
        if (!isOrderEnabled) return;

        console.log("Adding to cart:", { product, selectedVars, excludedIngs }); // DEBUG

        const variantsPrice = selectedVars.reduce((acc, v) => acc + v.price, 0);
        const finalUnitPrice = product.price + variantsPrice;

        setCart(prev => {
            // Check for existing item with exact same configuration
            const existingItemIndex = prev.findIndex(item =>
                item.id === product.id &&
                arraysEqual(item.selectedVariants, selectedVars, 'id') &&
                arraysEqual(item.excludedIngredients, excludedIngs)
            );

            if (existingItemIndex > -1) {
                const newCart = [...prev];
                newCart[existingItemIndex].quantity += 1;
                return newCart;
            } else {
                return [...prev, {
                    id: product.id,
                    name: product.name,
                    basePrice: product.price,
                    finalPrice: finalUnitPrice,
                    quantity: 1,
                    selectedVariants: [...selectedVars], // Ensure copy
                    excludedIngredients: [...excludedIngs] // Ensure copy
                }];
            }
        });

        // Reset and close modal
        setSelectedProductForOptions(null);
        setTempSelectedVariants([]);
        setTempExcludedIngredients([]);
    };

    const updateCartItemQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];
            const newQuantity = Math.max(0, item.quantity + delta);

            if (newQuantity === 0) {
                return newCart.filter((_, i) => i !== index);
            }

            item.quantity = newQuantity;
            return newCart;
        });
    };

    const handleProductClick = (product: Product) => {
        if (!isOrderEnabled) return;

        // Always open modal if it has variants OR ingredients
        const productVariants = variants.filter(v => v.product_id === product.id);
        const hasIngredients = product.ingredients && product.ingredients.length > 0;

        if (productVariants.length > 0 || hasIngredients) {
            setSelectedProductForOptions(product);
            setTempSelectedVariants([]);
            setTempExcludedIngredients([]);
        } else {
            // Direct add if simple product
            addToCart(product, [], []);
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



    const handlePrint = () => {
        const w = window.open('', '_blank');
        if (!w) return;

        console.log("Printing Cart:", cart); // DEBUG

        const dateStr = new Date().toLocaleString('tr-TR');
        const dashLine = "--------------------------------"; // 32 chars is standard for 58mm/80mm, adjust as needed visually

        // QR Code Helper for Logo Overlay
        const getQrWithLogo = (data: string, alt: string) => `
            <div style="position: relative; display: inline-block; width: 120px; height: 120px; margin: 10px 0;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data)}" 
                     style="width: 100%; height: 100%;" />
                <img src="/logo.png" 
                     style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                            width: 30px; height: 30px; background: white; padding: 2px; border-radius: 4px;" 
                     onerror="this.style.display='none'" />
            </div>
        `;

        // Payment Method Label
        const getPaymentLabel = (method: string) => {
            if (method === 'cash') return 'NAKİT';
            if (method === 'credit_card') return 'KREDİ KARTI';
            if (method === 'meal_card') return 'YEMEK KARTI';
            if (method === 'iban') return 'IBAN';
            return method.toUpperCase();
        };

        const totalAmount = cart.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0);

        // Location Link
        const locationUrl = customerInfo.locationLat
            ? `https://maps.google.com/?q=${customerInfo.locationLat},${customerInfo.locationLng}`
            : '';

        // Restaurant Menu Link
        const menuUrl = window.location.href;

        w.document.write(`
            <html>
            <head>
                <title>Sipariş Fişi</title>
                <style>
                    @page { size: 80mm auto; margin: 0mm; }
                    body { 
                        width: 80mm; 
                        margin: 0 auto; 
                        padding: 10px 5px; 
                        font-family: 'Courier New', monospace; 
                        font-weight: bold; 
                        font-size: 14px; 
                        line-height: 1.2;
                        color: black;
                    }
                    .center { text-align: center; display: flex; flex-direction: column; alignItems: center; justify-content: center; }
                    .separator { overflow: hidden; white-space: nowrap; margin: 5px 0; }
                    .header { font-size: 16px; font-weight: 900; }
                    .rest-name { font-size: 20px; font-weight: 900; margin: 5px 0; text-transform: uppercase; }
                    .section-title { text-align: left; font-size: 14px; text-decoration: underline; margin-bottom: 5px; }
                    
                    .customer-info { text-align: left; font-size: 14px; margin-bottom: 5px; }
                    
                    /* Product Table */
                    .product-row { display: flex; font-size: 14px; margin-bottom: 4px; }
                    .col-qty { width: 15%; text-align: left; vertical-align: top; }
                    .col-name { width: 60%; text-align: left; word-wrap: break-word; }
                    .col-price { width: 25%; text-align: right; vertical-align: top; }
                    
                    .variant-row { font-size: 12px; margin-left: 15%; font-weight: normal; font-style: italic; }
                    .exclusion-row { font-size: 12px; margin-left: 15%; font-weight: normal; text-decoration: line-through; }
                    
                    .total-section { font-size: 18px; font-weight: 900; text-align: right; margin: 10px 0; }
                    .payment-info { font-size: 16px; font-weight: 900; text-align: left; margin: 5px 0; }
                    
                    .footer { text-align: center; font-size: 12px; margin-top: 20px; font-weight: normal; }
                    .timestamp { font-size: 12px; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="center header">OneQR - Menü Sistemleri</div>
                <div class="center separator">${dashLine}</div>
                
                <div class="center rest-name">${restaurant?.name || 'RESTORAN'}</div>
                
                <div class="center">
                    ${getQrWithLogo(menuUrl, 'Menu QR')}
                </div>
                
                <div class="center separator">${dashLine}</div>
                
                <div class="section-title">MÜŞTERİ BİLGİLERİ</div>
                <div class="customer-info">
                    ${customerInfo.fullName.toUpperCase()}<br/>
                    Tel: ${customerInfo.phone}<br/>
                    ${customerInfo.neighborhood} Mah.<br/>
                    ${customerInfo.street} Sok. No:${customerInfo.buildingNumber} D:${customerInfo.doorNumber} Kat:${customerInfo.floor}
                    ${customerInfo.isSite ? `<br/>${customerInfo.siteName} Sit. ${customerInfo.block} Blok` : ''}
                    ${customerInfo.apartmentName ? `<br/>(${customerInfo.apartmentName} Apt.)` : ''}
                    ${customerInfo.addressDetail ? `<br/>Not: ${customerInfo.addressDetail}` : ''}
                </div>

                ${locationUrl ? `
                    <div class="center">
                        <div>Müşteri konumu için QR kodu okutun:</div>
                        ${getQrWithLogo(locationUrl, 'Location QR')}
                    </div>
                ` : ''}

                <div class="center separator">${dashLine}</div>
                
                <!-- Table Headers -->
                <div style="display: flex; font-size: 12px; border-bottom: 1px solid black; padding-bottom: 2px; margin-bottom: 5px;">
                    <span style="width: 15%">Adet</span>
                    <span style="width: 60%">Ürün</span>
                    <span style="width: 25%; text-align: right;">Tutar</span>
                </div>

                <!-- Items -->
                ${cart.map(item => `
                    <div class="product-row">
                        <div class="col-qty">${item.quantity} </div>
                        <div class="col-name">${item.name}</div>
                        <div class="col-price">${item.finalPrice * item.quantity} ₺</div>
                    </div>
                    
                    ${item.selectedVariants && item.selectedVariants.length > 0 ? `
                        <div class="variant-row">
                            + ${item.selectedVariants.map(v => v?.name).join(', ')}
                        </div>
                    ` : ''}
                    
                    ${item.excludedIngredients && item.excludedIngredients.length > 0 ? `
                        <div class="exclusion-row">
                             ⚠️ ${item.excludedIngredients.join(', ')} YOK
                        </div>
                    ` : ''}
                `).join('')}

                <div class="center separator">${dashLine}</div>
                
                <div class="total-section">
                    TOPLAM ${totalAmount} ₺
                </div>

                <div class="center separator">${dashLine}</div>
                
                <div class="payment-info">
                    ÖDEME: ${getPaymentLabel(customerInfo.paymentMethod)}
                </div>

                <div class="center separator">${dashLine}</div>
                
                <div class="footer">
                    <div class="center">
                        ${restaurant?.logo_url ? `<img src="${restaurant.logo_url}" style="width: 60px; height: 60px; object-fit: contain;" />` : ''}
                    </div>
                    <div class="timestamp">${dateStr}</div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(() => { window.print(); }, 1500); // 1.5s delay for images
                    }
                </script>
            </body>
            </html>
        `);
        w.document.close();
    };
    `);
        w.document.close();
    };





    const submitSystemOrder = async () => {
        if (!restaurant) return;
        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // Calculate Total
            const totalAmount = cart.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0);

            // Prepare Items for DB
            const orderItems = cart.map(item => ({
                product_id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.finalPrice, // Unit price including variants
                total_price: item.finalPrice * item.quantity,
                selected_variants: item.selectedVariants,
                excluded_ingredients: item.excludedIngredients
            }));

            // Construct address detail string carefully
            let addressDetail = customerInfo.neighborhood + ' Mah. ' + customerInfo.street + ' Sok.';
            if (customerInfo.isSite) {
                addressDetail += ' ' + customerInfo.siteName + ' Sit. ' + customerInfo.block + ' Blok';
            }
            addressDetail += ' No:' + customerInfo.buildingNumber + ' Daire:' + customerInfo.doorNumber + ' Kat:' + customerInfo.floor;
            if (customerInfo.apartmentName) {
                addressDetail += ' (' + customerInfo.apartmentName + ' Apt.)';
            }
            if (customerInfo.addressDetail) {
                addressDetail += '\nNot: ' + customerInfo.addressDetail;
            }

            const { data, error } = await supabase
                .from('orders')
                .insert({
                    restaurant_id: restaurant.id,
                    customer_name: customerInfo.fullName,
                    customer_phone: customerInfo.phone,
                    address_detail: addressDetail,
                    location_lat: customerInfo.locationLat,
                    location_lng: customerInfo.locationLng,
                    items: orderItems,
                    total_amount: totalAmount,
                    payment_method: customerInfo.paymentMethod,
                    payment_provider: customerInfo.paymentMethod === 'meal_card' ? customerInfo.mealCardProvider : null,
                    status: 'pending',
                    source: 'system' // or 'qr'
                })
                .select()
                .single();

            if (error) throw error;

            // Success
            setOrderSuccess(true);
            setCart([]);
            saveCustomerInfoToLocal(); // Save for next time

            // Trigger print automatically if needed, or let user decide
            // handlePrint(); // Optional: Auto print receipt for user? Probably not.

        } catch (error: any) {
            console.error('Order submission error:', error);
            alert('Sipariş gönderilirken bir hata oluştu: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const sendWhatsappOrder = () => {
        if (!restaurant?.whatsapp_number) return;

        let message = '*Yeni Sipariş - ' + restaurant.name + '*\n\n';
        message += '*Müşteri:* ' + customerInfo.fullName + '\n';
        message += '*Telefon:* ' + customerInfo.phone + '\n';
        message += '*Adres:* ' + customerInfo.neighborhood + ' Mah. ' + customerInfo.street + ' Sok. No:' + customerInfo.buildingNumber + ' D: ' + customerInfo.doorNumber + '\n';

        if (customerInfo.addressDetail) {
            message += '*Not:* ' + customerInfo.addressDetail + '\n';
        }

        if (customerInfo.locationLat) {
            message += '*Konum:* https://maps.google.com/?q=' + customerInfo.locationLat + ',' + customerInfo.locationLng + '\n';
        }

        message += '\n*Sipariş Detayı:*\n';

        let total = 0;
        cart.forEach(item => {
            const itemTotal = item.finalPrice * item.quantity;
            total += itemTotal;
            message += '- ' + item.quantity + 'x ' + item.name;

            if (item.selectedVariants && item.selectedVariants.length > 0) {
                message += ' (+' + item.selectedVariants.map(v => v.name).join(', ') + ')';
            }
            if (item.excludedIngredients && item.excludedIngredients.length > 0) {
                message += ' (ÇIKAR: ' + item.excludedIngredients.join(', ') + ')';
            }

            message += ' : ' + itemTotal + ' ' + restaurant.currency + '\n';
        });

        message += '\n*TOPLAM TUTAR:* ' + total + ' ' + restaurant.currency + '\n';
        message += '\n*Ödeme:* ' + (customerInfo.paymentMethod === 'cash' ? 'Nakit' : customerInfo.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Diğer');

        const url = 'https://wa.me/' + restaurant.whatsapp_number + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank');
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
            const isSubdomain = hostname !== rootDomain && hostname !== 'www.' + rootDomain;

            // Rule: Premium cannot use subdomain
            // Rule: Freemium can use subdomain only during trial
            // Rule: Plusimum can always use subdomain

            if (isSubdomain) {
                let allowed = false;
                if (plan === 'plusimum') allowed = true;
                else if (plan === 'freemium') allowed = true; // Freemium allows subdomain too? User request said "Plusimum ile aynı özelliklere" so likely yes.
                else if (plan === 'trial' && isTrialActive) allowed = true;
                // premium is never allowed on subdomain

                if (!allowed) {
                    // Redirect to root path variant
                    const rootUrl = isLocal ? 'http://localhost:3000/menu/' + slug : 'https://oneqr.tr/menu/' + slug;
    window.location.href = rootUrl;
    return;
}
            }

if (plan === 'expired') {
    window.location.href = 'https://oneqr.tr';
    return;
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
        const sessionKey = 'viewed_' + restaurant.id;
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
            <style>{`@keyframes spin { 0 % { transform: rotate(0deg); } 100 % { transform: rotate(360deg); } } `}</style>
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
        .mobile - only { display: block; }
                .desktop - only { display: none; }
                .main - layout { display: block; }
                .content - area { padding: 20px; max - width: 600px; margin: 0 auto; }

    /* Desktop View (min-width: 768px) */
    @media(min - width: 768px) {
                    .mobile - only { display: none!important; }
                    .desktop - only { display: block!important; }
                    
                    .main - layout {
            display: flex!important;
            max - width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            gap: 40px;
            align - items: flex - start;
        }
                    
                    .desktop - sidebar {
            width: 280px;
            position: sticky;
            top: 20px;
            background: white;
            padding: 24px;
            border - radius: 16px;
            box - shadow: 0 4px 6px - 1px rgba(0, 0, 0, 0.1);
            border: 1px solid #E5E7EB;
            flex - shrink: 0;
            max - height: calc(100vh - 40px);
            overflow - y: auto;
        }

                    .content - area {
            flex: 1;
            padding: 0!important;
            max - width: none!important;
            margin: 0!important;
        }

                    .cat - nav - btn {
            display: block;
            width: 100 %;
            text - align: left;
            padding: 12px 16px!important;
            margin - bottom: 8px;
            border - radius: 8px!important;
            font - size: 1rem!important;
        }

                    .cat - nav - btn:hover {
            background - color: #F3F4F6!important;
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
        0 % { box- shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
    }
    70 % { box- shadow: 0 0 0 10px rgba(0, 0, 0, 0);
}
100 % { box- shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
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
                            const element = document.getElementById(`cat - ${ cat.id } `);
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
                                const element = document.getElementById(`cat - ${ cat.id } `);
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
                                borderLeft: activeCategory === cat.id ? `3px solid ${ restaurant.theme_color } ` : '3px solid transparent'
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
                        <div key={cat.id} id={`cat - ${ cat.id } `} style={{ marginBottom: '32px', scrollMarginTop: '20px' }}>
                            <div style={{ marginBottom: '16px', paddingLeft: '4px', borderLeft: `4px solid ${ restaurant.theme_color } ` }}>
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
                                                                {variant.price > 0 ? `+ ${ variant.price } ${ restaurant.currency } ` : ''}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: restaurant.theme_color }}>
                                                        {product.price} {restaurant.currency}
                                                    </div>
                                                    {isOrderEnabled && (
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
                                                    )}
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

        {/* Options Modal (Replaces Variant Modal) */}
        {selectedProductForOptions && (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)'
            }} onClick={() => setSelectedProductForOptions(null)}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{selectedProductForOptions.name}</h3>
                        <button onClick={() => setSelectedProductForOptions(null)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>

                    {/* Variants Section */}
                    {variants.filter(v => v.product_id === selectedProductForOptions.id).length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Seçenekler</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {variants.filter(v => v.product_id === selectedProductForOptions.id).map(variant => {
                                    const isSelected = tempSelectedVariants.some(v => v.id === variant.id);
                                    return (
                                        <label key={variant.id} style={{
                                            padding: '12px', borderRadius: '8px', border: isSelected ? `2px solid ${ restaurant?.theme_color } ` : '1px solid #E5E7EB',
                                            background: isSelected ? '#EFF6FF' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setTempSelectedVariants([...tempSelectedVariants, variant]);
                                                        } else {
                                                            setTempSelectedVariants(tempSelectedVariants.filter(v => v.id !== variant.id));
                                                        }
                                                    }}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                <span style={{ fontWeight: 500 }}>{variant.name}</span>
                                            </div>
                                            <span style={{ fontWeight: 600, color: restaurant?.theme_color }}>
                                                {variant.price > 0 ? `+ ${ variant.price } ${ restaurant?.currency } ` : ''}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Ingredients Section */}
                    {selectedProductForOptions.ingredients && selectedProductForOptions.ingredients.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>İçindekiler (Çıkarmak için tiki kaldırın)</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedProductForOptions.ingredients.map((ing, idx) => {
                                    const isExcluded = tempExcludedIngredients.includes(ing);
                                    return (
                                        <label key={idx} style={{
                                            padding: '8px 12px', borderRadius: '20px',
                                            border: isExcluded ? '1px dashed #EF4444' : '1px solid #E5E7EB',
                                            background: isExcluded ? '#FEF2F2' : '#F3F4F6',
                                            color: isExcluded ? '#EF4444' : '#374151',
                                            textDecoration: isExcluded ? 'line-through' : 'none',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={!isExcluded}
                                                onChange={(e) => {
                                                    if (!e.target.checked) {
                                                        setTempExcludedIngredients([...tempExcludedIngredients, ing]);
                                                    } else {
                                                        setTempExcludedIngredients(tempExcludedIngredients.filter(i => i !== ing));
                                                    }
                                                }}
                                                style={{ display: 'none' }}
                                            />
                                            {isExcluded ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-check"></i>}
                                            {ing}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => addToCart(selectedProductForOptions, tempSelectedVariants, tempExcludedIngredients)}
                        style={{ width: '100%', padding: '16px', background: restaurant?.theme_color, color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Sepete Ekle</span>
                            <span>
                                {(selectedProductForOptions.price + tempSelectedVariants.reduce((acc, v) => acc + v.price, 0))} {restaurant?.currency}
                            </span>
                        </div>
                    </button>
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
                                    <div key={`${ item.id } -${ idx } `} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '12px', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>{item.name}</div>

                                            {/* Variants */}
                                            {item.selectedVariants && item.selectedVariants.length > 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                                                    {item.selectedVariants.map(v => v.name).join(', ')}
                                                </div>
                                            )}

                                            {/* Exclusions */}
                                            {item.excludedIngredients && item.excludedIngredients.length > 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '2px', textDecoration: 'line-through' }}>
                                                    {item.excludedIngredients.join(', ')}
                                                </div>
                                            )}

                                            <div style={{ fontSize: '0.9rem', color: restaurant?.theme_color || '#000', fontWeight: 700, marginTop: '4px' }}>
                                                {item.finalPrice * item.quantity} {restaurant?.currency}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            <button
                                                onClick={() => updateCartItemQuantity(idx, -1)}
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F3F4F6', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', paddingBottom: '4px' }}
                                            >-</button>
                                            <span style={{ fontWeight: 600, fontSize: '1rem', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button
                                                onClick={() => updateCartItemQuantity(idx, 1)}
                                                style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F3F4F6', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', paddingBottom: '4px' }}
                                            >+</button>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                                    <span style={{ fontWeight: 600, color: '#374151', fontSize: '1.1rem' }}>Toplam Tutar</span>
                                    <span style={{ fontWeight: 800, color: restaurant?.theme_color || '#000', fontSize: '1.25rem' }}>
                                        {cart.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0)} {restaurant?.currency}
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
                                    <i className={`fa - solid ${ customerInfo.locationLat ? 'fa-check' : 'fa-location-dot' } `}></i>
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
                                            value={customerInfo.apartmentName}
                                            onChange={e => setCustomerInfo({ ...customerInfo, apartmentName: e.target.value })}
                                            placeholder="Apartman Adı"
                                        />
                                        <input
                                            className="form-input"
                                            value={customerInfo.buildingNumber}
                                            onChange={e => setCustomerInfo({ ...customerInfo, buildingNumber: e.target.value })}
                                            placeholder="Bina No"
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <input
                                            className="form-input"
                                            value={customerInfo.floor}
                                            onChange={e => setCustomerInfo({ ...customerInfo, floor: e.target.value })}
                                            placeholder="Kat"
                                            required
                                        />
                                        <input
                                            className="form-input"
                                            value={customerInfo.doorNumber}
                                            onChange={e => setCustomerInfo({ ...customerInfo, doorNumber: e.target.value })}
                                            placeholder="Daire No"
                                            required
                                        />
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
                                        <label style={{ padding: '12px', border: `1px solid ${ customerInfo.paymentMethod === 'cash' ? restaurant.theme_color : '#E5E7EB' } `, borderRadius: '8px', cursor: 'pointer', background: customerInfo.paymentMethod === 'cash' ? '#F9FAFB' : 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input type="radio" name="payment" value="cash" checked={customerInfo.paymentMethod === 'cash'} onChange={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'cash' })} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fa-solid fa-money-bill-wave" style={{ color: '#10B981', width: '20px', textAlign: 'center' }}></i>
                                                <span>Nakit (Kapıda Ödeme)</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Credit Card */}
                                    {(restaurant.payment_settings?.credit_card) && (
                                        <label style={{ padding: '12px', border: `1px solid ${ customerInfo.paymentMethod === 'credit_card' ? restaurant.theme_color : '#E5E7EB' } `, borderRadius: '8px', cursor: 'pointer', background: customerInfo.paymentMethod === 'credit_card' ? '#F9FAFB' : 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input type="radio" name="payment" value="credit_card" checked={customerInfo.paymentMethod === 'credit_card'} onChange={() => setCustomerInfo({ ...customerInfo, paymentMethod: 'credit_card' })} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fa-regular fa-credit-card" style={{ color: '#3B82F6', width: '20px', textAlign: 'center' }}></i>
                                                <span>Kredi Kartı (Kapıda Ödeme)</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Meal Card */}
                                    {(restaurant.payment_settings?.meal_card?.enabled) && (
                                        <div style={{ border: `1px solid ${ customerInfo.paymentMethod === 'meal_card' ? restaurant.theme_color : '#E5E7EB' } `, borderRadius: '8px', overflow: 'hidden' }}>
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
                                        <div style={{ border: `1px solid ${ customerInfo.paymentMethod === 'iban' ? restaurant.theme_color : '#E5E7EB' } `, borderRadius: '8px', overflow: 'hidden' }}>
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
                                    disabled={!(customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.buildingNumber && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) || isSubmitting}
                                    style={{
                                        background: '#F59E0B',
                                        color: 'white',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 700,

                                        cursor: (customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.buildingNumber && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) && !isSubmitting ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        opacity: (customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.buildingNumber && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) && !isSubmitting ? 1 : 0.6,
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
                                        disabled={!(customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.buildingNumber && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) || isSubmitting}
                                        style={{
                                            background: 'white',
                                            color: '#25D366',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '2px solid #25D366',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            cursor: (customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.buildingNumber && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) && !isSubmitting ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            opacity: (customerInfo.fullName && customerInfo.phone && customerInfo.neighborhood && customerInfo.street && customerInfo.buildingNumber && customerInfo.floor && customerInfo.doorNumber && (!customerInfo.isSite || (customerInfo.siteName && customerInfo.block))) && !isSubmitting ? 1 : 0.6,
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


        {/* Summary Modal */}
        {
            showOrderSummary && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1200,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px',
                    backdropFilter: 'blur(3px)'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px',
                        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
                        padding: '0', position: 'relative', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Sipariş Özeti</h2>
                            <button onClick={() => setShowOrderSummary(false)} style={{ border: 'none', background: 'none' }}><i className="fa-solid fa-times"></i></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                            {/* Map */}
                            {customerInfo.locationLat && (
                                <div style={{ width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        style={{ border: 0 }}
                                        src={`https://maps.google.com/maps?q=${customerInfo.locationLat},${customerInfo.locationLng}&z=15&output=embed`}
                                    />
                                </div >
                            )}

{/* Summary Content for Print */ }
<div id="order-summary-content">
    {/* Header - OneQR Branding */}
    <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}>OneQR - İşletmeler İçin Akıllı QR Menü ve Katalog Sistemi</div>
    <div style={{ borderBottom: '1px dashed black', marginBottom: '10px' }}></div>

    {/* Restaurant Name */}
    <h3 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', margin: '15px 0', textTransform: 'uppercase' }} className="print-title">{restaurant?.name}</h3>

    {/* Customer Info Block */}
    <div style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>
        Müşteri:<br />
        {customerInfo.fullName}<br />
        {customerInfo.phone}<br />
        <div style={{ marginTop: '5px', fontWeight: 'normal' }}>
            {customerInfo.neighborhood} Mah. {customerInfo.street} Sok.
            {customerInfo.isSite && ` ${customerInfo.siteName} Sit. ${customerInfo.block} Blok`}
            {` No:${customerInfo.buildingNumber} Daire:${customerInfo.doorNumber} Kat:${customerInfo.floor}`}
            {customerInfo.apartmentName && ` (${customerInfo.apartmentName} Apt.)`}
        </div>
        {customerInfo.addressDetail && <div style={{ fontStyle: 'italic', marginTop: '2px' }}>({customerInfo.addressDetail})</div>}
        {customerInfo.locationLat && <div style={{ marginTop: '5px' }}>(Konum Paylaşıldı)</div>}
    </div>

    <div style={{ borderBottom: '1px dashed black', marginBottom: '15px' }}></div>

    {/* Items Table */}
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '18px' }}>
        <thead>
            <tr>
                <th style={{ textAlign: 'left', width: '15%' }}>Adet</th>
                <th style={{ textAlign: 'left', width: '60%' }}>Ürün</th>
                <th style={{ textAlign: 'right', width: '25%' }}>Tutar</th>
            </tr>
        </thead>
        <tbody>
            {cart.map((item, idx) => (
                <tr key={`${item.id}-${idx}`}>
                    <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: '5px' }}>{item.quantity}x</td>
                    <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: '5px' }}>
                        {item.name}
                        {item.selectedVariants.length > 0 && <div style={{ fontSize: '14px', fontStyle: 'italic' }}>({item.selectedVariants.map(v => v.name).join(', ')})</div>}
                        {item.excludedIngredients.length > 0 && <div style={{ fontSize: '14px', fontStyle: 'italic', textDecoration: 'line-through', color: '#EF4444' }}>({item.excludedIngredients.join(', ')})</div>}
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '5px' }}>{item.finalPrice * item.quantity} ₺</td>
                </tr>
            ))}
        </tbody>
    </table>

    {/* Total Section */}
    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '24px', fontWeight: 900 }}>
        <span>TOPLAM:</span>
        <span>{cart.reduce((acc, item) => acc + (item.finalPrice * item.quantity), 0)} ₺</span>
    </div>

    {/* Payment Method */}
    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' }}>
        <span>Ödeme:</span>
        <span>{(customerInfo.paymentMethod === 'cash' ? 'Nakit' : customerInfo.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Diğer')}</span>
    </div>

    {/* Footer - OneQR Branding */}
    <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>OneQR.tr</div>
        {/* Center Logo Placeholder - using the QR code SVG for print if possible or img */}
        <img src="/logo-qr.png" alt="OneQR" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
        <div style={{ fontSize: '10px' }}>oneqr.tr ile oluşturuldu</div>
        <div style={{ fontSize: '10px' }}>{new Date().toLocaleString('tr-TR')}</div>
    </div>
</div>

                        </div >

    <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '12px', background: '#F9FAFB', borderRadius: '0 0 16px 16px' }}>
        <button onClick={handlePrint} className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <i className="fa-solid fa-print"></i> Yazdır
        </button>
        {restaurant?.whatsapp_number && (
            <button onClick={sendWhatsappOrder} style={{ flex: 1, background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                <i className="fa-brands fa-whatsapp"></i> Whatsapp
            </button>
        )}
        <button onClick={submitSystemOrder} style={{ flex: 1, background: restaurant?.theme_color, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Tamamla
        </button>
    </div>
                    </div >
                </div >
            )
        }

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
            orderEnabled={isOrderEnabled}
        />

    </div >
);
}
