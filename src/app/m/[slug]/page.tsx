'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams } from 'next/navigation';

// Types
interface Restaurant {
    id: string;
    name: string;
    slug: string;
    theme_color: string;
    currency: string;
    logo_url?: string;
}

interface Category {
    id: string;
    name: string;
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
                // In a perfect world we filter by restaurant directly, but through categories is cleaner with current schema
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

    return (
        <div style={{ minHeight: '100vh', background: '#F9FAFB', paddingBottom: '80px' }}>

            {/* Header / Cover */}
            <header style={{ background: 'white', padding: '24px', textAlign: 'center', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: restaurant.theme_color,
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                }}>
                    {restaurant.logo_url ? <img src={restaurant.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : restaurant.name.substring(0, 1)}
                </div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{restaurant.name}</h1>
                {/* Categories Scroll */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    padding: '16px 0 4px',
                    marginTop: '12px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                const element = document.getElementById(`cat-${cat.id}`);
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    // Offset for sticky header
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
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </header>

            {/* Menu Content */}
            <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                {categories.map(cat => {
                    const catProducts = products.filter(p => p.category_id === cat.id);
                    if (catProducts.length === 0) return null;

                    return (
                        <div key={cat.id} id={`cat-${cat.id}`} style={{ marginBottom: '32px', scrollMarginTop: '180px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '16px', paddingLeft: '4px', borderLeft: `4px solid ${restaurant.theme_color}` }}>
                                {cat.name}
                            </h2>
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
                                            <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
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
                <p>Bu menü <strong style={{ color: '#374151' }}>OneQR</strong> altyapısı ile oluşturulmuştur.</p>
            </footer>

        </div>
    );
}
