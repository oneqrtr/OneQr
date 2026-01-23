'use client';
import { useEffect, useState } from 'react';
import Topbar from '@/components/Topbar';
import { createClient } from '@/lib/supabase';

interface Category {
    id: string;
    name: string;
    display_order: number;
}

interface Product {
    id: string;
    category_id: string;
    name: string;
    price: number;
    description?: string;
    is_available: boolean;
    display_order: number;
}

export default function MenuManagementPage() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    // Modal States
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Form States
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingProduct, setEditingProduct] = useState<Partial<Product>>({ category_id: '', name: '', price: 0, description: '', is_available: true });

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
                // Ideally filtering by restaurant categories
                if (cats && cats.length > 0) {
                    const catIds = cats.map(c => c.id);
                    const { data: prods } = await supabase
                        .from('products')
                        .select('*')
                        .in('category_id', catIds)
                        .order('display_order', { ascending: true });
                    if (prods) setProducts(prods);
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

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId || !newCategoryName) return;

        const { error } = await supabase
            .from('categories')
            .insert({
                restaurant_id: restaurantId,
                name: newCategoryName,
                display_order: categories.length + 1
            });

        if (!error) {
            setNewCategoryName('');
            setIsCatModalOpen(false);
            fetchData();
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct.category_id || !editingProduct.name) return;

        const { error } = await supabase
            .from('products')
            .insert({
                category_id: editingProduct.category_id,
                name: editingProduct.name,
                price: editingProduct.price,
                description: editingProduct.description,
                is_available: true,
                display_order: 1 // simplified
            });

        if (!error) {
            setEditingProduct({ category_id: '', name: '', price: 0, description: '', is_available: true });
            setIsProductModalOpen(false);
            fetchData();
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) fetchData();
    };

    return (
        <>
            <Topbar title="Menü Yönetimi" />
            <div className="content-wrapper">

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={() => setIsCatModalOpen(true)} className="btn btn-outline btn-sm">
                        <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Kategori Ekle
                    </button>
                    <button onClick={() => setIsProductModalOpen(true)} className="btn btn-primary btn-sm">
                        <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Ürün Ekle
                    </button>
                </div>

                {loading ? (
                    <div>Yükleniyor...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {categories.map(cat => (
                            <div key={cat.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{cat.name}</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {/* Actions could go here */}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {products.filter(p => p.category_id === cat.id).length === 0 && (
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>Bu kategoride ürün yok.</p>
                                    )}
                                    {products.filter(p => p.category_id === cat.id).map(product => (
                                        <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{product.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{product.price} ₺</div>
                                            </div>
                                            <button onClick={() => handleDeleteProduct(product.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
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
                        <h3 style={{ marginBottom: '16px' }}>Yeni Kategori Ekle</h3>
                        <form onSubmit={handleAddCategory}>
                            <div className="form-group">
                                <label className="form-label">Kategori Adı</label>
                                <input
                                    className="form-input"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Örn: Tatlılar"
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setIsCatModalOpen(false)} className="btn btn-outline btn-sm">İptal</button>
                                <button type="submit" className="btn btn-primary btn-sm">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {isProductModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ marginBottom: '16px' }}>Yeni Ürün Ekle</h3>
                        <form onSubmit={handleAddProduct}>
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
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-outline btn-sm">İptal</button>
                                <button type="submit" className="btn btn-primary btn-sm">Kaydet</button>
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
    maxWidth: '400px'
};
