import Topbar from '@/components/Topbar';
import Link from 'next/link';

export default function AdminDashboard() {
    return (
        <>
            <Topbar title="Genel Bakış" />
            <div className="content-wrapper">
                {/* Status Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-title">Toplam Görüntülenme</div>
                        <div className="stat-value">1,245</div>
                        <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '4px' }}>▲ %12 bu hafta</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Aktif Ürünler</div>
                        <div className="stat-value">34</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Kalan Deneme Süresi</div>
                        <div className="stat-value highlight-orange">5 Gün</div>
                        <div style={{ marginTop: '8px' }}>
                            <Link href="#" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 500 }}>Şimdi Yükselt →</Link>
                        </div>
                    </div>
                </div>

                {/* Recent Activity / Quick Actions Placeholders */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', color: '#E5E7EB', marginBottom: '16px' }}>
                        <i className="fa-solid fa-chart-line"></i>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Analitik Verileri</h3>
                    <p style={{ color: 'var(--text-light)', maxWidth: '400px' }}>Detaylı ziyaretçi istatistikleri ve sipariş trendleri yakında burada olacak.</p>
                </div>

            </div>
        </>
    )
}
