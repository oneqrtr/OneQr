# OneQR – Özellik Analiz ve Uygulama Raporu

**Tarih:** 17 Şubat 2026  
**Kapsam:** Raporlama geliştirmesi, Masa durumu, Sipariş onay/red

---

## 1. RAPORLAMA GELİŞTİRMESİ

### 1.1 Mevcut durum

- **Sayfa:** `admin/report` (Restoran Raporu)
- **Veri:** Sadece `source = 'restaurant'` siparişler, tek gün seçimi
- **Gösterim:** 
  - Özet kartlar: Toplam sipariş, günlük ciro, nakit/kart/diğer
  - Masa bazlı tablo: Masa no, sipariş sayısı, toplam tutar
- **Eksikler:** Grafik yok, dönem karşılaştırma yok, ürün bazlı satış yok, dışa aktarma yok

### 1.2 Önerilen geliştirmeler

| Özellik | Açıklama | Öncelik |
|--------|----------|---------|
| **Dönem seçici** | Gün / Hafta / Ay seçimi; hafta için pazartesi–pazar, ay için takvim ayı | Yüksek |
| **Grafikler** | Seçilen dönemde günlük ciro çizgi/bar grafik; isteğe bağlı ödeme türü dağılımı (pasta grafik) | Yüksek |
| **Ürün bazlı satış** | `orders.items` JSONB üzerinden ürün adı × adet/tutar toplamı; tablo + isteğe bağlı barlar | Yüksek |
| **Karşılaştırmalı dönem** | “Önceki dönemle karşılaştır” (örn. bu hafta vs geçen hafta); yüzde ve tutar farkı | Orta |
| **Dışa aktarma** | Excel (CSV) ve PDF; mevcut tablo + özet kartlar | Orta |

### 1.3 Veri modeli

- **Değişiklik yok.** Tüm veri `orders` tablosundan (restaurant + system siparişleri) ve `items` JSONB alanından türetilecek.
- Rapor sayfasında:
  - **Restoran siparişleri:** `source = 'restaurant'` (mevcut mantık korunacak).
  - **Ürün raporu:** Tüm sipariş tipleri (`restaurant` + `system`) dahil edilebilir; ayar ile sadece restoran da seçilebilir.

### 1.4 Teknik notlar

- **Grafik:** Ek bağımlılık olmadan CSS/HTML ile basit bar/line mümkün; daha zengin görünüm için `recharts` veya `chart.js` eklenebilir (tercih: hafif bir kütüphane).
- **Tarih aralığı:** 
  - Gün: mevcut `selectedDate` (tek gün).
  - Hafta: seçilen günün haftası (Pzt–Paz) veya “bu hafta” / “geçen hafta”.
  - Ay: seçilen ay (1–son gün).
- **Ürün bazı:** `items` array’i; her item `name`, `quantity`, `price`; toplam = quantity × price biriminde; ürün adına göre grupla (varyasyon aynı isimde birleşebilir veya “Ürün + Varyasyon” ayrı satır).
- **CSV:** Frontend’de JSON → CSV string, `Blob` + indirme.
- **PDF:** Mevcut `jspdf` (QR sayfasında kullanılıyor) veya basit HTML → print/PDF; rapor için tablo + başlık yeterli.

### 1.5 UI/UX önerisi

- Üstte: **Dönem tipi** (Gün / Hafta / Ay) + **Tarih/Hafta/Ay seçici**.
- İsteğe bağlı: **“Önceki dönemle karşılaştır”** checkbox.
- Özet kartlar (mevcut + karşılaştırmalı yüzde varsa).
- **Grafik alanı** (ciro zaman serisi).
- **Masa bazlı tablo** (mevcut).
- **Ürün bazlı satış tablosu** (ürün adı, adet, toplam tutar, %).
- Alt kısım: **Excel’e aktar**, **PDF indir** butonları.

### 1.6 Risk ve sınırlar

- Çok büyük sipariş geçmişinde (örn. 1 yıl) istemci tarafında toplama yavaşlayabilir; ilk aşamada seçilen dönem max 1 ay ile sınırlanabilir veya sayfalama düşünülebilir.

---

## 2. MASA DURUMU VE MASA KARTI TIKLANABİLİRLİĞİ

### 2.1 Mevcut durum

- **Sayfa:** `admin/tables`
- Masalar: 1..tableCount için sabit grid; her kartta “Masa N” başlığı, altında o masaya ait **açık** (pending) ve **kapatılmış** siparişler listeleniyor.
- Masa ile ilgili tek bilgi: “Bu masada sipariş var mı?”; **açık/kapalı**, **hesap istendi** gibi durum yok.
- “Masa siparişi al” ayrı butonla açılan modalda masa seçiliyor; masa kartına tıklanınca doğrudan sipariş modalı açılmıyor.

### 2.2 Önerilen geliştirmeler

| Özellik | Açıklama | Öncelik |
|--------|----------|---------|
| **Masa durumu** | Her masa için durum: **Boş** / **Dolu** / **Hesap istendi** | Yüksek |
| **Karta tıklayınca modal** | Masa kartına tıklanınca doğrudan **Masa siparişi al** modalı açılsın, ilgili masa önceden seçili olsun | Yüksek |
| **Görsel geri bildirim** | Boş: yeşil/neutral, Dolu: turuncu/sarı, Hesap istendi: kırmızı veya ayrı ikon | Yüksek |

### 2.3 Masa durumu mantığı

- **Boş:** O masada o gün hiç açık (pending) sipariş yok.
- **Dolu:** O masada en az bir açık (pending) sipariş var; henüz hesap kapatılmadı.
- **Hesap istendi:** İşletme “Hesap istendi” işaretledi (yeni alan veya sipariş üzerinden).

**Seçenek A – Siparişten türet (ek tablo yok):**  
- Boş/Dolu: Mevcut `orders` + `table_number` + `status = 'pending'` ile hesaplanır.  
- “Hesap istendi” için: En az bir açık siparişi olan masada kullanıcı “Hesap istendi” butonuna basar; bu bilgi nereye yazılacak?

**Seçenek B – Masa durumu tablosu (önerilen):**  
- Yeni tablo: `table_status` (veya `restaurant_tables` genişletmesi):
  - `restaurant_id`, `table_number` (1..N), `status`: `'empty' | 'occupied' | 'bill_requested'`, `updated_at`
  - Günlük sıfırlama: İsteğe bağlı (gece yarısı tüm masalar `empty` yapılabilir) veya sadece “Tüm masaları boşalt” butonu.
- Sipariş açıldığında: İlgili masa `occupied` yapılır (veya zaten doluysa kalır).
- Sipariş kapatıldığında: O masada başka açık sipariş yoksa masa `empty` yapılır.
- “Hesap istendi” butonu: Masa kartında veya sipariş kartında; `table_status` → `bill_requested`.

**Seçenek C – Sadece siparişten (minimal):**  
- Durum sadece “Boş / Dolu” (açık sipariş var mı).  
- “Hesap istendi” olmadan; masa kartı tıklanınca modal açılır, masa seçili gelir.

**Öneri:** Önce **Seçenek C** ile masa kartı tıklanınca modal + masa ön seçimi ve görsel olarak “Boş/Dolu” (sadece siparişten) uygulanabilir. “Hesap istendi” ve kalıcı masa durumu (Seçenek B) ikinci aşamada eklenebilir.

### 2.4 Veri modeli (Seçenek B tercih edilirse)

- **Yeni tablo:** `table_status`
  - `id` UUID PK
  - `restaurant_id` UUID FK → restaurants
  - `table_number` INTEGER (1..table_count)
  - `status` TEXT: `'empty' | 'occupied' | 'bill_requested'`
  - `updated_at` TIMESTAMPTZ
  - UNIQUE(restaurant_id, table_number)
- RLS: Restaurant owner erişimi.
- Sipariş insert/update ve “Hesap istendi” / “Sipariş kapat” akışlarında bu tablo güncellenir.

### 2.5 UI/UX önerisi

- Masa kartı:
  - Tüm kart tıklanabilir; tıklanınca **Masa siparişi al** modalı açılır, `selectedTableNum = tableNum` set edilir.
  - Başlıkta veya köşede durum göstergesi: Boş (yeşil nokta/border), Dolu (turuncu), Hesap istendi (kırmızı/bell ikonu).
- “Masa siparişi al” üst butonu mevcut kalsın; yeni sipariş için masa seçimi modal içinde yapılmaya devam eder.
- Dolu masada “Hesap istendi” butonu: Kart içinde veya sipariş kartında; tıklanınca ilgili masa `bill_requested` yapılır (Seçenek B).

### 2.6 Risk ve sınırlar

- Aynı masaya aynı gün birden fazla “oturum” (aç-kapa) varsa, masa durumu ile siparişlerin tutarlı kalması için kurallar net yazılmalı (sipariş kapatılınca masa boşaltma mantığı).

---

## 3. SİPARİŞ ONAY / RED

### 3.1 Mevcut durum

- **Online siparişler** (`source !== 'restaurant'`): `admin/orders` sayfasında listeleniyor; durum alanı `pending` | `completed` (kapatıldığında).
- Yeni gelen sipariş otomatik “pending”; işletme sadece **Siparişi kapat** (ödeme alındı) ile `completed` yapıyor.
- **Onaylama/red** yok: Stok, kapasite veya başka sebeplerle siparişi reddetme veya açıkça onaylama akışı yok.

### 3.2 Önerilen geliştirmeler

| Özellik | Açıklama | Öncelik |
|--------|----------|---------|
| **Onayla** | Sipariş “onaylandı” durumuna geçer; müşteriye (ileride) bildirilebilir; mutfak/hazırlık aşamasına alınır | Yüksek |
| **Reddet** | Sipariş iptal edilir; red sebebi (opsiyonel) kaydedilir; müşteriye (ileride) bildirilebilir | Yüksek |
| **Red sebebi** | Reddederken kısa sebep (stok yok, kapasite dolu, adres dışı vb.) seçimi veya serbest metin | Orta |

### 3.3 Durum modeli

- **Mevcut:** `status` CHECK: `'pending' | 'processing' | 'completed' | 'cancelled'`.
- **Kullanım:**
  - `pending`: Yeni gelen sipariş, işletme henüz onaylamadı/reddetmedi.
  - `processing` (veya `confirmed`): İşletme onayladı; hazırlanıyor.
  - `completed`: Ödeme alındı / teslim edildi (mevcut “Siparişi kapat”).
  - `cancelled`: İşletme reddetti (veya müşteri iptal).

**Öneri:**  
- Onayla → `status = 'processing'` (veya DB’ye `'confirmed'` eklenirse `confirmed`).  
- Reddet → `status = 'cancelled'`.  
- “Siparişi kapat” sadece `processing` (veya `confirmed`) siparişlerde görünsün; `pending` siparişlerde önce “Onayla” veya “Reddet” olsun.

### 3.4 Veri modeli

- **orders.status:** Mevcut CHECK’e `'confirmed'` eklenebilir (opsiyonel); yoksa `'processing'` = onaylandı kabul edilir.
- **orders.rejection_reason** (opsiyonel): TEXT, sadece `status = 'cancelled'` ve işletme reddiyse dolu.

```sql
-- Opsiyonel: red sebebi
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- CHECK güncelleme (confirmed eklenirse)
-- CHECK (status IN ('pending', 'processing', 'confirmed', 'completed', 'cancelled'))
```

### 3.5 UI/UX önerisi (admin/orders)

- Sipariş kartı:
  - **pending:** “Onayla” (yeşil) ve “Reddet” (kırmızı) butonları gösterilir; “Siparişi kapat” gösterilmez veya pasif.
  - **processing/confirmed:** “Siparişi kapat” gösterilir (mevcut akış).
  - **cancelled:** “İptal edildi” etiketi ve varsa red sebebi; buton yok.
  - **completed:** Mevcut görünüm (kapatıldı).
- Reddet tıklanınca: Küçük modal veya inline alan – “Red sebebi (opsiyonel)” dropdown (Stok yok, Kapasite dolu, Adres teslimat dışı, Diğer) + serbest metin; “Reddet” onayı.
- Liste filtreleme: “Bekleyen / Onaylanan / Tamamlanan / İptal” sekmeleri veya filtre (opsiyonel, ikinci aşama).

### 3.6 İş kuralları

- Sadece **online siparişler** (source !== 'restaurant') için onay/red; restoran/masa siparişleri zaten işletme girişli, ek onay gerekmez.
- Realtime: Sipariş onaylandı/iptal edildiğinde liste anında güncellenir (mevcut Supabase channel ile uyumlu).

### 3.7 Müşteri tarafı (ileride)

- Müşteri sipariş sonrası sayfada veya e-posta/SMS ile “Siparişiniz onaylandı” / “Siparişiniz maalesef kabul edilemedi” bilgisi verilebilir. Bu rapor kapsamında zorunlu değil; altyapı (status) buna uygun hazırlanır.

### 3.8 Risk ve sınırlar

- Çok eski siparişlerin yanlışlıkla iptal edilmesini önlemek için “Sadece bugünkü/son X saatteki pending siparişlerde Onayla/Reddet” kuralı konulabilir (opsiyonel).

---

## 4. UYGULAMA SIRASI VE KISA ÖZET

| # | Özellik seti | Kapsam | Tahmini karmaşıklık |
|---|--------------|--------|----------------------|
| 1 | **Sipariş onay/red** | orders sayfası: Onayla/Reddet, status + opsiyonel rejection_reason, buton görünürlüğü | Orta |
| 2 | **Masa kartı tıklanınca modal** | tables: Masa kartı tıklanınca Masa siparişi al modalı açılır, masa ön seçili; Boş/Dolu görseli (sadece siparişten) | Düşük–Orta |
| 3 | **Masa durumu (Hesap istendi)** | table_status tablosu + “Hesap istendi” butonu + sipariş aç/kapa ile senkron | Orta |
| 4 | **Raporlama – dönem + grafik + ürün** | report: Gün/Hafta/Ay, grafik, ürün bazlı tablo, karşılaştırma (opsiyonel) | Orta–Yüksek |
| 5 | **Raporlama – dışa aktarma** | report: CSV + PDF indir | Düşük–Orta |

Önerilen sıra: **1 → 2 → 3 → 4 → 5** (önce sipariş onay/red ve masa UX, sonra masa durumu, ardından raporlama ve export).

---

## 5. ONAY SONRASI ADIMLAR

Bu rapor onaylandıktan sonra:

1. **Sipariş onay/red:** `admin/orders` güncellemesi, opsiyonel DB migration (rejection_reason, status CHECK).
2. **Masa kartı + modal:** `admin/tables` masa kartı onClick, `setSelectedTableNum(tableNum); setMasaModalOpen(true)`; Boş/Dolu stil.
3. **Masa durumu (Hesap istendi):** Migration `table_status`, tables sayfası ve sipariş kapatma/hesap istendi akışları.
4. **Raporlama:** Report sayfasında dönem seçici, grafik bileşeni, ürün tablosu, karşılaştırma, CSV/PDF.

Bu belge, değişikliklere başlamadan önce onay için hazırlanmıştır. Onaylarsanız yukarıdaki sırayla uygulama adımlarına geçilecektir.
