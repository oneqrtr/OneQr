'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';

interface Category {
    id: string;
    name: string;
    description?: string;
    display_order: number;
    is_visible?: boolean;
}

interface Product {
    id: string;
    category_id: string;
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    is_available: boolean;
    display_order: number;
    is_visible?: boolean;
}

interface Variant {
    id: string;
    product_id: string;
    name: string;
    description?: string;
    price: number;
    is_available: boolean;
}

export default function MenuManagementPage() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [allVariants, setAllVariants] = useState<Variant[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    // Modal States
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Form States
    const [editingCategory, setEditingCategory] = useState<Category | null>(null); // For Edit
    const [categoryName, setCategoryName] = useState(''); // For Create/Edit name
    const [categoryDescription, setCategoryDescription] = useState(''); // For Create/Edit desc

    const [editingProduct, setEditingProduct] = useState<Partial<Product>>({ category_id: '', name: '', price: 0, description: '', is_available: true });
    const [productImage, setProductImage] = useState<File | null>(null);

    // Variant Form States
    const [variantName, setVariantName] = useState('');
    const [variantPrice, setVariantPrice] = useState<number | string>(0);
    const [variantDesc, setVariantDesc] = useState('');
    const [variantDesc, setVariantDesc] = useState('');
    const [isSavingVariant, setIsSavingVariant] = useState(false);
    const [isVariantSectionOpen, setIsVariantSectionOpen] = useState(false);

    const [isEditModeProduct, setIsEditModeProduct] = useState(false); // Track if editing product

    // Bulk Edit States
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkPrices, setBulkPrices] = useState<{ [key: string]: number }>({});

    const supabase = createClient();

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Restaurant
            const { data: rest } = await supabase
                .from('restaurants')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (rest) {
                setRestaurantId(rest.id);

                // 2. Get Categories
                const { data: cats } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('restaurant_id', rest.id)
                    .order('display_order', { ascending: true });

                if (cats) setCategories(cats);

                // 3. Get Products
                if (cats && cats.length > 0) {
                    const catIds = cats.map(c => c.id);
                    const { data: prods } = await supabase
                        .from('products')
                        .select('*')
                        .in('category_id', catIds)
                        .order('display_order', { ascending: true });
                    if (prods) {
                        setProducts(prods);

                        // 4. Get Variants
                        const prodIds = prods.map(p => p.id);
                        const { data: vars } = await supabase
                            .from('product_variants')
                            .select('*')
                            .in('product_id', prodIds);
                        if (vars) setAllVariants(vars);
                    }
                } else {
                    setProducts([]);
                    setAllVariants([]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const [isSaving, setIsSaving] = useState(false);

    // --- CATEGORY ACTIONS ---

    const openCategoryModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
            setCategoryDescription(category.description || '');
        } else {
            setEditingCategory(null);
            setCategoryName('');
            setCategoryDescription('');
        }
        setIsCatModalOpen(true);
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId || !categoryName) return;

        setIsSaving(true);

        try {
            let error;
            if (editingCategory) {
                // Edit
                const payload: any = { name: categoryName };
                if (categoryDescription) payload.description = categoryDescription;

                const { error: err } = await supabase
                    .from('categories')
                    .update(payload)
                    .eq('id', editingCategory.id);
                error = err;
            } else {
                // Create
                const payload: any = {
                    restaurant_id: restaurantId,
                    name: categoryName,
                    display_order: categories.length + 1
                };
                if (categoryDescription) payload.description = categoryDescription;

                const { error: err } = await supabase
                    .from('categories')
                    .insert(payload);
                error = err;
            }

            if (error) throw error;

            // Success
            setCategoryName('');
            setCategoryDescription('');
            setEditingCategory(null);
            setIsCatModalOpen(false);
            fetchData();

        } catch (error: any) {
            console.error('Error saving category:', error);
            if (error?.code === '42703' || error?.message?.includes('description')) {
                alert('Veritabanı güncel değil! Lütfen Supabase panelinde "fix_schema.sql" dosyasındaki komutları çalıştırın.');
            } else {
                alert(`Hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Bu kategoriyi ve içindeki TÜM ürünleri silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase.from('categories').delete().eq('id', id);

        if (error) {
            alert('Silme başarısız: ' + error.message);
        } else {
            fetchData();
        }
    };

    const handleToggleCategoryVisibility = async (category: Category) => {
        const newStatus = !category.is_visible;
        // Optimistic update
        setCategories(categories.map(c => c.id === category.id ? { ...c, is_visible: newStatus } : c));

        const { error } = await supabase
            .from('categories')
            .update({ is_visible: newStatus })
            .eq('id', category.id);

        if (error) {
            alert('Güncelleme başarısız: ' + error.message);
            fetchData(); // Revert
        }
    };

    // --- PRODUCT ACTIONS ---

    const openProductModal = (product?: Product) => {
        setProductImage(null);
        if (product) {
            setEditingProduct(product);
            setIsEditModeProduct(true);
        } else {
            setEditingProduct({ category_id: categories.length > 0 ? categories[0].id : '', name: '', price: 0, description: '', is_available: true });
            setIsEditModeProduct(false);
        }
        setIsProductModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct.category_id || !editingProduct.name) return;

        setIsSaving(true);
        let imageUrl = editingProduct.image_url;

        if (productImage) {
            const fileExt = productImage.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, productImage);

            if (uploadError) {
                console.error('Upload Error', uploadError);
                alert('Resim yüklenirken hata oluştu');
                setIsSaving(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
        }

        let error;
        if (isEditModeProduct && editingProduct.id) {
            // Update
            const { error: err } = await supabase
                .from('products')
                .update({
                    category_id: editingProduct.category_id,
                    name: editingProduct.name,
                    price: editingProduct.price,
                    description: editingProduct.description,
                    image_url: imageUrl,
                    is_available: editingProduct.is_available
                })
                .eq('id', editingProduct.id);
            error = err;
        } else {
            // Create
            const { error: err } = await supabase
                .from('products')
                .insert({
                    category_id: editingProduct.category_id,
                    name: editingProduct.name,
                    price: editingProduct.price,
                    description: editingProduct.description,
                    image_url: imageUrl,
                    is_available: true,
                    display_order: 1 // simplified logic
                });
            error = err;
        }

        setIsSaving(false);

        if (!error) {
            setEditingProduct({ category_id: '', name: '', price: 0, description: '', is_available: true });
            setProductImage(null);
            setIsProductModalOpen(false);
            fetchData();
        } else {
            alert('Hata oluştu: ' + error.message);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Ürünü silmek istiyor musunuz?')) return;

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleToggleProductVisibility = async (product: Product) => {
        const newStatus = !product.is_visible;
        // Optimistic update
        setProducts(products.map(p => p.id === product.id ? { ...p, is_visible: newStatus } : p));

        const { error } = await supabase
            .from('products')
            .update({ is_visible: newStatus })
            .eq('id', product.id);

        if (error) {
            alert('Güncelleme başarısız: ' + error.message);
            fetchData(); // Revert
        }
    };
    // --- VARIANT ACTIONS ---

    const handleAddVariant = async () => {
        if (!editingProduct.id || !variantName) return;
        setIsSavingVariant(true);

        try {
            const { data, error } = await supabase
                .from('product_variants')
                .insert({
                    product_id: editingProduct.id,
                    name: variantName,
                    price: parseFloat(variantPrice.toString()) || 0,
                    description: variantDesc
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setAllVariants([...allVariants, data]);
                setVariantName('');
                setVariantPrice(0);
                setVariantDesc('');
            }
        } catch (error: any) {
            alert('Varyasyon eklenirken hata: ' + error.message);
        } finally {
            setIsSavingVariant(false);
        }
    };

    const handleDeleteVariant = async (id: string) => {
        if (!confirm('Varyasyonu silmek istiyor musunuz?')) return;
        const { error } = await supabase.from('product_variants').delete().eq('id', id);
        if (!error) {
            setAllVariants(allVariants.filter(v => v.id !== id));
        } else {
            alert('Silme hatası: ' + error.message);
        }
    };

    // --- BULK ACTIONS ---

    const toggleBulkMode = () => {
        if (!isBulkMode) {
            // Enter bulk mode: populate dictionary
            const initialPrices: { [key: string]: number } = {};
            products.forEach(p => {
                initialPrices[p.id] = p.price;
            });
            setBulkPrices(initialPrices);
        }
        setIsBulkMode(!isBulkMode);
    };

    const handleBulkPriceChange = (id: string, newPrice: string) => {
        setBulkPrices(prev => ({
            ...prev,
            [id]: parseFloat(newPrice) || 0
        }));
    };

    const handleSaveBulkPrices = async () => {
        setIsSaving(true);
        // Optimize: find only changed items
        const updates = [];
        for (const product of products) {
            const newPrice = bulkPrices[product.id];
            if (newPrice !== undefined && newPrice !== product.price) {
                updates.push(
                    supabase.from('products').update({ price: newPrice }).eq('id', product.id)
                );
            }
        }

        if (updates.length === 0) {
            setIsSaving(false);
            setIsBulkMode(false);
            return;
        }

        try {
            await Promise.all(updates);
            await fetchData();
            setIsBulkMode(false);
        } catch (error: any) {
            console.error('Bulk update error', error);
            alert('Toplu güncelleme sırasında hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Topbar title="Menü Yönetimi" />
            <div className="content-wrapper">

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                    {!isBulkMode ? (
                        <>
                            <button onClick={toggleBulkMode} className="btn btn-outline btn-sm">
                                <i className="fa-solid fa-tags" style={{ marginRight: '6px' }}></i> Toplu Fiyat Değişikliği
                            </button>
                            <button onClick={() => openCategoryModal()} className="btn btn-outline btn-sm">
                                <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Kategori Ekle
                            </button>
                            <button onClick={() => openProductModal()} className="btn btn-primary btn-sm">
                                <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Ürün Ekle
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Toplu Fiyat Düzenleme</h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={toggleBulkMode} disabled={isSaving} className="btn btn-outline btn-sm">
                                    İptal
                                </button>
                                <button onClick={handleSaveBulkPrices} disabled={isSaving} className="btn btn-primary btn-sm">
                                    {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div>Yükleniyor...</div>
                ) : isBulkMode ? (
                    // BULK MODE VIEW
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        {products.length === 0 && <p className="text-gray-500">Düzenlenecek ürün bulunamadı.</p>}
                        {products.map(product => (
                            <div key={product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                    <div style={{ width: '50px', height: '50px', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                                <i className="fa-solid fa-image"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{product.name}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={bulkPrices[product.id] ?? product.price}
                                            onChange={(e) => handleBulkPriceChange(product.id, e.target.value)}
                                            style={{
                                                width: '120px',
                                                padding: '8px 30px 8px 12px', // Increased right padding to prevent overlap with symbol
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                fontSize: '1rem',
                                                textAlign: 'right'
                                            }}
                                        />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', fontSize: '0.9rem' }}>₺</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // NORMAL VIEW
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {categories.map(cat => (
                            <div key={cat.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{cat.name}</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleToggleCategoryVisibility(cat)}
                                            className={`btn btn-xs ${cat.is_visible === false ? 'btn-outline' : 'btn-ghost'}`}
                                            style={{ padding: '4px 8px', fontSize: '0.8rem', color: cat.is_visible === false ? '#9CA3AF' : '#4B5563' }}
                                            title={cat.is_visible === false ? 'Göster' : 'Gizle'}
                                        >
                                            <i className={`fa-solid ${cat.is_visible === false ? 'fa-eye-slash' : 'fa-eye'}`}></i> {cat.is_visible === false ? 'Göster' : 'Gizle'}
                                        </button>
                                        <button onClick={() => openCategoryModal(cat)} className="btn btn-xs btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                                            <i className="fa-solid fa-pencil"></i> Düzenle
                                        </button>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-xs btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#EF4444', borderColor: '#EF4444' }}>
                                            <i className="fa-solid fa-trash"></i> Sil
                                        </button>
                                    </div>
                                </div>
                                {cat.description && (
                                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '16px', fontStyle: 'italic' }}>
                                        {cat.description}
                                    </p>
                                )}

                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {products.filter(p => p.category_id === cat.id).length === 0 && (
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>Bu kategoride ürün yok.</p>
                                    )}
                                    {products.filter(p => p.category_id === cat.id).map(product => (
                                        <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                {product.image_url && (
                                                    <img src={product.image_url} alt={product.name} style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{product.price} ₺</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <button onClick={() => openProductModal(product)} className="btn btn-xs btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                                    Düzenle
                                                </button>
                                                <button
                                                    onClick={() => handleToggleProductVisibility(product)}
                                                    className={`btn btn-xs ${product.is_visible === false ? 'btn-outline' : 'btn-ghost'}`}
                                                    style={{ padding: '4px 8px', fontSize: '0.75rem', color: product.is_visible === false ? '#9CA3AF' : '#4B5563' }}
                                                    title={product.is_visible === false ? 'Göster' : 'Gizle'}
                                                >
                                                    <i className={`fa-solid ${product.is_visible === false ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="btn btn-xs btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#EF4444', borderColor: '#EF4444' }}>
                                                    Kaldır
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Category Modal */}
            {isCatModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ marginBottom: '16px' }}>{editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</h3>
                        <form onSubmit={handleSaveCategory}>
                            <div className="form-group">
                                <label className="form-label">Kategori Adı</label>
                                <input
                                    className="form-input"
                                    value={categoryName}
                                    onChange={e => setCategoryName(e.target.value)}
                                    placeholder="Örn: Tatlılar"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Açıklama</label>
                                <textarea
                                    className="form-input"
                                    value={categoryDescription}
                                    onChange={e => setCategoryDescription(e.target.value)}
                                    placeholder="Kısaca bu kategoriyi tanıtın (İsteğe bağlı)"
                                    rows={2}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setIsCatModalOpen(false)} className="btn btn-outline btn-sm">İptal</button>
                                <button type="submit" disabled={isSaving} className="btn btn-primary btn-sm">
                                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {isProductModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ marginBottom: '16px' }}>{isEditModeProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
                        <form onSubmit={handleSaveProduct}>
                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <select
                                    className="form-input"
                                    value={editingProduct.category_id}
                                    onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seçiniz</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ürün Adı</label>
                                <input
                                    className="form-input"
                                    value={editingProduct.name}
                                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fiyat</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editingProduct.price}
                                    onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Açıklama</label>
                                <textarea
                                    className="form-input"
                                    value={editingProduct.description || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            {/* Variants Section - Accordion */}
                            {isEditModeProduct && editingProduct.id && (
                                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '20px', background: '#F9FAFB', overflow: 'hidden' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsVariantSectionOpen(!isVariantSectionOpen)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            background: '#F3F4F6',
                                            border: 'none',
                                            borderBottom: isVariantSectionOpen ? '1px solid #E5E7EB' : 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: '#374151'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <i className="fa-solid fa-layer-group" style={{ marginRight: '8px', color: '#4B5563' }}></i>
                                            Varyasyonlar / Seçenekler
                                        </div>
                                        <i className={`fa-solid ${isVariantSectionOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '0.8rem' }}></i>
                                    </button>

                                    {isVariantSectionOpen && (
                                        <div style={{ padding: '16px' }}>
                                            {/* Variant List */}
                                            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {allVariants.filter(v => v.product_id === editingProduct.id).map(variant => (
                                                    <div key={variant.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{variant.name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                                                                {variant.description ? `${variant.description} • ` : ''}
                                                                {variant.price > 0 ? `+${variant.price}₺` : 'Fiyat Farkı Yok'}
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => handleDeleteVariant(variant.id)} className="btn btn-ghost btn-xs" style={{ color: '#EF4444' }}>
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                                {allVariants.filter(v => v.product_id === editingProduct.id).length === 0 && (
                                                    <div style={{ fontSize: '0.85rem', color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', padding: '8px' }}>Henüz varyasyon eklenmemiş.</div>
                                                )}
                                            </div>

                                            {/* Add Variant Form - Mini */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <input
                                                    placeholder="Varyasyon Adı (Örn: Büyük Boy)"
                                                    className="form-input"
                                                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                                                    value={variantName}
                                                    onChange={e => setVariantName(e.target.value)}
                                                />
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <div style={{ flex: 1, position: 'relative' }}>
                                                        <input
                                                            type="number"
                                                            placeholder="Ek Ücret (0 olabilir)"
                                                            className="form-input"
                                                            style={{ padding: '6px 10px 6px 8px', fontSize: '0.85rem' }}
                                                            value={variantPrice}
                                                            onChange={e => setVariantPrice(e.target.value)}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddVariant}
                                                        disabled={isSavingVariant || !variantName}
                                                        className="btn btn-primary btn-xs"
                                                        style={{ whiteSpace: 'nowrap' }}
                                                    >
                                                        Ekle
                                                    </button>
                                                </div>
                                                <textarea
                                                    placeholder="Açıklama (İsteğe bağlı)"
                                                    className="form-input"
                                                    rows={1}
                                                    style={{ padding: '6px 10px', fontSize: '0.85rem', minHeight: '34px' }}
                                                    value={variantDesc}
                                                    onChange={e => setVariantDesc(e.target.value)}
                                                />
                                                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                                                    * Fiyat farkı ana fiyata eklenir. 0 girerseniz fiyat değişmez.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isEditModeProduct && (
                                <div style={{ padding: '12px', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '8px', color: '#C2410C', fontSize: '0.85rem', marginBottom: '20px' }}>
                                    <i className="fa-solid fa-info-circle" style={{ marginRight: '6px' }}></i>
                                    Varyasyon eklemek için önce ürünü kaydedin.
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Ürün Görseli</label>
                                <div style={{ marginBottom: 8 }}>
                                    {editingProduct.image_url && !productImage && (
                                        <img src={editingProduct.image_url} alt="Current" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }} />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="form-input"
                                    onChange={e => setProductImage(e.target.files ? e.target.files[0] : null)}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-outline btn-sm">İptal</button>
                                <button type="submit" disabled={isSaving} className="btn btn-primary btn-sm">
                                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

const modalOverlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
};

const modalStyle = {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '90vh', // Ensure it fits in viewport
    overflowY: 'auto' as const, // Scrollable content
    position: 'relative' as const // For absolute positioning inside if needed
};
