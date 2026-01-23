import Link from 'next/link';

export default function SuperAdminPage() {
    return (
        <div className="app-body">
            {/* Dark Sidebar for Distinction */}
            <aside className="sidebar" style={{ backgroundColor: '#111827', color: '#fff', borderRight: 'none' }}>
                <div className="sidebar-header" style={{ borderBottom: '1px solid #1F2937' }}>
                    <div className="sidebar-brand" style={{ color: '#fff' }}>OneQR Admin</div>
                </div>
                <nav className="sidebar-nav">
                    <Link href="#" className="nav-item active" style={{ backgroundColor: '#374151', color: '#fff' }}>
                        <span className="nav-icon"><i className="fa-solid fa-gauge"></i></span>
                        Genel Bakış
                    </Link>
                    <Link href="#" className="nav-item" style={{ color: '#9CA3AF' }}>
                        <span className="nav-icon"><i className="fa-solid fa-users"></i></span>
                        Müşteriler
                    </Link>
                    <Link href="#" className="nav-item" style={{ color: '#9CA3AF' }}>
                        <span className="nav-icon"><i className="fa-solid fa-money-bill"></i></span>
                        Ödemeler
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="topbar">
                    <div className="page-title">Müşteri Listesi</div>
                    <div className="user-profile">
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Super Admin</div>
                        </div>
                    </div>
                </header>

                <div className="content-wrapper">

                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>İşletme Adı</th>
                                    <th>E-posta</th>
                                    <th>Kayıt Tarihi</th>
                                    <th>Durum</th>
                                    <th>Plan</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: 500 }}>Lezzet Durağı</td>
                                    <td style={{ color: 'var(--text-light)' }}>info@lezzetduragi.com</td>
                                    <td>22.01.2024</td>
                                    <td><span className="status-badge status-active">Aktif</span></td>
                                    <td>Standart</td>
                                    <td><Link href="#" className="btn btn-sm btn-outline"><i className="fa-solid fa-eye"></i></Link></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 500 }}>Burger Kingim</td>
                                    <td style={{ color: 'var(--text-light)' }}>ali@burger.com</td>
                                    <td>20.01.2024</td>
                                    <td><span className="status-badge status-trial">Deneme</span></td>
                                    <td>Deneme</td>
                                    <td><Link href="#" className="btn btn-sm btn-outline"><i className="fa-solid fa-eye"></i></Link></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 500 }}>Cafe Misto</td>
                                    <td style={{ color: 'var(--text-light)' }}>selam@misto.com</td>
                                    <td>15.01.2024</td>
                                    <td><span className="status-badge status-expired">Süresi Doldu</span></td>
                                    <td>Deneme</td>
                                    <td><Link href="#" className="btn btn-sm btn-outline"><i className="fa-solid fa-eye"></i></Link></td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 500 }}>Kebapçı İskender</td>
                                    <td style={{ color: 'var(--text-light)' }}>iskender@kebap.com</td>
                                    <td>01.01.2024</td>
                                    <td><span className="status-badge status-active">Aktif</span></td>
                                    <td>Premium</td>
                                    <td><Link href="#" className="btn btn-sm btn-outline"><i className="fa-solid fa-eye"></i></Link></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            </main>
        </div>
    )
}
