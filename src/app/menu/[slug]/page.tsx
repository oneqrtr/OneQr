'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams } from 'next/navigation';

import Link from 'next/link'; // Not strictly needed but good practice if link used later or just clean up
import ContactFab from '@/components/ContactFab';

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    theme_color: string;
    currency: string;
    status: string;
    logo_url?: string;
    description?: string;
    hero_image_url?: string;
    phone_number?: string;
    whatsapp_number?: string;
    is_call_enabled?: boolean;
    is_whatsapp_enabled?: boolean;
    // Location
    is_location_enabled?: boolean;
    location_lat?: number;
    location_lng?: number;
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

export default function PublicMenuPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [loading, setLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<string>(''); // For Image Modal

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

                setRestaurant(restData);

                // 2. Fetch Categories
                const { data: catData, error: catError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('restaurant_id', restData.id)
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
                        .order('display_order', { ascending: true });

                    if (prodData) setProducts(prodData);
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
        <div style={{ minHeight: '100vh', background: '#F9FAFB', paddingBottom: '80px' }}>

            {/* Header / Cover - Not Sticky */}
            <header style={{ background: 'white', padding: '0', textAlign: 'center', borderBottom: '1px solid #E5E7EB' }}>
                {/* Hero Image */}
                {restaurant.hero_image_url && (
                    <div style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                        <img src={restaurant.hero_image_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}

                <div style={{ padding: '24px', paddingTop: restaurant.hero_image_url ? '0' : '24px' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: restaurant.theme_color,
                        borderRadius: '50%',
                        margin: restaurant.hero_image_url ? '-50px auto 12px' : '0 auto 12px', // Pull up if hero exists
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        border: '4px solid white', // Add border to separate from hero
                        position: 'relative',
                        zIndex: 11,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : restaurant.name.substring(0, 1)}
                    </div>

                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{restaurant.name}</h1>

                    {restaurant.description && (
                        <p style={{ color: '#6B7280', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 16px', lineHeight: '1.5' }}>
                            {restaurant.description}
                        </p>
                    )}
                </div>
            </header>

            {/* Sticky Category Bar */}
            <div style={{
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
                    justifyContent: 'flex-start' // Align left for better scrolling experience on mobile
                }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                const element = document.getElementById(`cat-${cat.id}`);
                                if (element) {
                                    // Adjust offset: height of sticky bar (approx 60px) + some buffer
                                    const headerOffset = 70;
                                    const elementPosition = element.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                                    window.scrollTo({
                                        top: offsetPosition,
                                        behavior: "smooth"
                                    });
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
                                flexShrink: 0 // Prevent shrinking
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Content */}
            <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                {categories.map(cat => {
                    const catProducts = products.filter(p => p.category_id === cat.id);
                    if (catProducts.length === 0) return null;

                    return (
                        <div key={cat.id} id={`cat-${cat.id}`} style={{ marginBottom: '32px', scrollMarginTop: '180px' }}>
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
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {catProducts.map(product => (
                                    <div key={product.id} style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        gap: '16px'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px', color: '#111827' }}>{product.name}</h3>
                                            {product.description && (
                                                <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '8px', lineHeight: '1.4' }}>{product.description}</p>
                                            )}
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: restaurant.theme_color }}>
                                                {product.price} {restaurant.currency}
                                            </div>
                                        </div>
                                        {product.image_url && (
                                            <div style={{ width: '100px', height: '100px', flexShrink: 0, cursor: 'pointer' }} onClick={() => setSelectedImage(product.image_url || '')}>
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </main>

            <footer style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '0.8rem' }}>
                <p>Bu menü <Link href="/" style={{ color: '#374151', fontWeight: 'bold', textDecoration: 'none' }}>OneQR</Link> altyapısı ile oluşturulmuştur.</p>
            </footer>

            {/* Image Modal */}
            {selectedImage && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px',
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setSelectedImage('')}>
                    <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '90vh' }}>
                        <button
                            onClick={() => setSelectedImage('')}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '0',
                                background: 'rgba(0,0,0,0.5)',
                                border: 'none',
                                color: 'white',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                zIndex: 1001
                            }}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <img
                            src={selectedImage}
                            alt="Full Screen"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                borderRadius: '8px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
                        />
                    </div>
                </div>
            )}


            <ContactFab
                callEnabled={restaurant.is_call_enabled || false}
                whatsappEnabled={restaurant.is_whatsapp_enabled || false}
                locationEnabled={restaurant.is_location_enabled || false}
                phoneNumber={restaurant.phone_number}
                whatsappNumber={restaurant.whatsapp_number}
                locationLat={restaurant.location_lat}
                locationLng={restaurant.location_lng}
                themeColor={restaurant.theme_color}
            />

        </div>
    );
}
