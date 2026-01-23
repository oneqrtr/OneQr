export default function PublicMenuPage({ params }: { params: { slug: string } }) {
    // In a real app, fetch restaurant data based on params.slug
    const restaurantName = params.slug === 'lezzet-duragi' ? 'Lezzet Durağı' : 'Restoran';

    return (
        <div className="menu-body">
            {/* Header */}
            <header className="menu-header">
                <div className="restaurant-logo">🍔</div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>{restaurantName}</h1>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>En iyi burger ve atıştırmalıklar</p>
            </header>

            {/* Category Scroll */}
            <div className="menu-categories sticky">
                <div className="cat-pill active">Popüler</div>
                <div className="cat-pill">Burgerler</div>
                <div className="cat-pill">Yan Ürünler</div>
                <div className="cat-pill">İçecekler</div>
                <div className="cat-pill">Tatlılar</div>
            </div>

            {/* Menu Content */}

            {/* Section: Popular */}
            <div className="menu-section">
                <h3 className="menu-section-title">Popüler</h3>

                <div className="menu-item">
                    <div className="item-info">
                        <h4>Truffle Burger</h4>
                        <p className="item-desc">Özel trüf mantarı sosu, 140gr dana köfte, karamelize soğan.</p>
                        <div className="item-price">₺240.00</div>
                    </div>
                    {/* Placeholder image */}
                    <div className="item-image" style={{ background: "url('https://placehold.co/160x160/e2e8f0/94a3b8?text=Burger') center/cover" }}></div>
                </div>

                <div className="menu-item">
                    <div className="item-info">
                        <h4>Çıtır Tavuk Sepeti</h4>
                        <p className="item-desc">6 parça tenders, patates kızartması ve özel sos ile.</p>
                        <div className="item-price">₺180.00</div>
                    </div>
                    <div className="item-image" style={{ background: "url('https://placehold.co/160x160/e2e8f0/94a3b8?text=Chicken') center/cover" }}></div>
                </div>
            </div>

            {/* Section: Beverages */}
            <div className="menu-section">
                <h3 className="menu-section-title">İçecekler</h3>

                <div className="menu-item">
                    <div className="item-info">
                        <h4>Ev Yapımı Limonata</h4>
                        <p className="item-desc">Taze nane ile.</p>
                        <div className="item-price">₺60.00</div>
                    </div>
                    <div className="item-image" style={{ background: "url('https://placehold.co/160x160/e2e8f0/94a3b8?text=Lemonade') center/cover" }}></div>
                </div>
                <div className="menu-item">
                    <div className="item-info">
                        <h4>Ayran</h4>
                        <p className="item-desc">Yayık ayranı, bol köpüklü.</p>
                        <div className="item-price">₺30.00</div>
                    </div>
                    {/* No image example */}
                </div>
            </div>

            <footer style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                <p>OneQR Altyapısı ile Sunulmaktadır</p>
            </footer>

        </div>
    )
}
