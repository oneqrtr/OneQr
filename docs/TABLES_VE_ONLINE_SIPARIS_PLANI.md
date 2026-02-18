# Restoran Siparişleri Sekmeler + Online Sipariş Ayrımı – Uygulama Planı

**Onay sonrası uygulanacak.** Değişiklik yapılmadan önce detaylar aşağıda.

---

## 1. admin/tables – Masalar ve Paket ayrı sekmeler

### Mevcut durum
- Tek sayfa: Üstte "Masa siparişi al" ve "Paket siparişi al" butonları, altında önce **Paket Siparişleri** bloğu, sonra **Masa kartları** grid’i.

### Yapılacak
- Sayfa üstünde **iki sekme**:
  - **Masalar** (varsayılan): Sadece masa grid’i + "Masa siparişi al" butonu. Paket bölümü bu sekmede **gösterilmeyecek**.
  - **Paket**: Sadece paket sipariş listesi (açık + geçmiş) + "Paket siparişi al" butonu. Masa grid’i bu sekmede **gösterilmeyecek**.
- Tarih seçici ve başlık her iki sekmede de ortak kalabilir (veya sadece üstte bir kez).
- **Paket sekmesi mantığı (mevcut, aynen kalacak):**
  - Açık siparişler: `status === 'pending'` → Yazdır + Siparişi Kapat.
  - Kasiyer kuryeden fişi alıp "Siparişi Kapat" (Nakit/Kart) yaptığında sipariş `completed` olur ve **Geçmiş** bölümüne düşer.
  - Yani kapanmadığı sürece her paket siparişi açık listede kalacak; değişiklik yok, sadece bu blok Paket sekmesine taşınacak.

**Teknik:** `useState` ile aktif sekme (örn. `'masa' | 'paket'`). Render’da sekmeye göre ya masa grid’i ya paket listesi gösterilecek.

---

## 2. Paket siparişi bildirimi – "Siparişler"e düşmesin

### Mevcut durum
- Sidebar’da yeni sipariş geldiğinde:
  - `source === 'restaurant'` veya `table_number > 0` → **Restoran Siparişleri** badge + ses.
  - Diğer (örn. `source === 'system'`) → **Siparişler** badge + ses.
- "Paket siparişi al" ile oluşturulan sipariş `source: 'system'` olduğu için şu an **Siparişler** (orders) sayfası badge’ine düşüyor ve ses çalıyor.

### Yapılacak
- **Paket (kasiyerin açtığı)** sipariş yeni kayıt olduğunda:
  - **Siparişler** (ileride "Online Sipariş") badge’i **artmayacak**.
  - **Restoran Siparişleri** badge’i **artacak** (ve ses çalacak, şu anki restoran mantığı gibi).
- Bunun için kaynak ayrımı şart:
  - **Müşteri siteden verdiği sipariş** (dışarıdan) → ayrı bir `source` (örn. `'online'`).
  - **Kasiyerin "Paket siparişi al" ile açtığı** → `source: 'system'` (mevcut).
- Sidebar mantığı güncellenecek:
  - **Sadece** `source === 'online'` yeni siparişler → "Online Sipariş" (eski adıyla Siparişler) badge + ses.
  - `source === 'restaurant'` **veya** `source === 'system'` → "Restoran Siparişleri" badge + ses; "Online Sipariş" badge’i artmayacak.

**Özet:** Paket siparişi (source=system) artık sadece Restoran Siparişleri tarafında bildirilecek; Siparişler sayfası bildirimi tetiklemeyecek.

---

## 3. Sipariş sayfası ismi: "Online Sipariş"

### Mevcut durum
- Menü/sidebar: **"Siparişler"**.
- Sayfa başlığı: "Siparişler".
- Liste: `source !== 'restaurant'` tüm siparişler (yani masa dışı her şey; şu an `source='system'` paket siparişleri de burada).

### Yapılacak
- Sidebar ve sayfa başlığı: **"Siparişler"** → **"Online Sipariş"**.
- Bu sayfa **sadece dışarıdan (müşteri) gelen siparişler** için kullanılacak:
  - Listelenecek siparişler: **sadece** `source === 'online'`.
  - `source === 'system'` (kasiyer paket) ve `source === 'restaurant'` (masa) bu sayfada **hiç gösterilmeyecek**.

**Etkilenen dosyalar:**  
`Sidebar.tsx` (menü metni), `admin/orders/page.tsx` (sayfa başlığı + filtre: `source === 'online'`).

---

## 4. Müşteri online siparişi için source = 'online'

### Mevcut durum
- Menüden sipariş verilirken: restoran modu değilse `source: 'system'` atanıyor (paket/online aynı kodu kullanıyor).

### Yapılacak
- Müşteri **siteden/menüden** verdiği siparişte (restoran/kasiyer modu **değilse**) artık `source: 'online'` kullanılacak.
- Admin "Paket siparişi al" akışı **değişmeyecek:** `source: 'system'` kalacak.

**Etkilenen dosya:** `menu/[slug]/page.tsx` – sipariş insert’te `orderSource = isRestaurantMode ? 'restaurant' : 'online'` (şu an `'system'` olan yerde `'online'`).

**Veritabanı:** `orders.source` zaten serbest metin; yeni değer için migration gerekmez. Eski müşteri siparişleri `'system'` kalır; istenirse ileride bir kerelik "system → online" güncellemesi yapılabilir (şart değil).

---

## 5. Özet tablo

| Konu | Şu an | Sonra |
|------|--------|--------|
| **admin/tables** | Tek sayfa: paket bloğu + masa grid | İki sekme: **Masalar** (sadece masa + Masa siparişi al), **Paket** (sadece paket listesi + Paket siparişi al) |
| **Paket siparişi bildirimi** | source=system → Siparişler badge + ses | source=system → Sadece Restoran Siparişleri badge + ses |
| **Siparişler sayfası adı** | "Siparişler" | "Online Sipariş" |
| **Siparişler sayfası içeriği** | source !== 'restaurant' (system dahil) | Sadece **source === 'online'** (dışarıdan gelen) |
| **Menüden verilen sipariş** | source = 'system' | source = **'online'** |
| **Paket sekmesi açık/kapanış** | Açık = pending, kapatınca geçmiş | Aynı (kapanmadığı sürece açık; kasiyer kapatınca geçmişte) |

---

## 6. Dosya bazlı değişiklik listesi

1. **`src/app/admin/tables/page.tsx`**
   - Sekme state: `activeTab: 'masa' | 'paket'`.
   - Üstte sekme butonları (Masalar | Paket).
   - "Masalar" seçiliyken: masa grid + "Masa siparişi al" butonu.
   - "Paket" seçiliyken: paket açık/geçmiş listesi + "Paket siparişi al" butonu.
   - Tarih seçici tek yerde (üstte) kalabilir.

2. **`src/components/Sidebar.tsx`**
   - "Siparişler" metni → **"Online Sipariş"**.
   - Yeni sipariş geldiğinde:
     - `source === 'online'` → Sadece "Online Sipariş" badge (ve ses).
     - `source === 'restaurant'` veya `source === 'system'` → Sadece "Restoran Siparişleri" badge (ve ses); "Online Sipariş" badge’i artmayacak.

3. **`src/app/admin/orders/page.tsx`**
   - Topbar/sayfa başlığı: "Siparişler" → **"Online Sipariş"**.
   - Liste filtresi: `source !== 'restaurant'` yerine **`source === 'online'`** (sadece dışarıdan gelen siparişler).

4. **`src/app/menu/[slug]/page.tsx`**
   - Sipariş kaydında: Restoran modu değilse `source: 'online'` (şu anki `'system'` yerine).

---

## 7. Dikkat edilecekler

- **Eski siparişler:** Zaten `source='system'` olan kayıtlar (hem eski müşteri hem eski paket) değişmeyecek. Sadece yeni müşteri siparişleri `'online'` olacak. Online Sipariş sayfasında şu an `source='system'` görünen eski müşteri siparişleri, bu değişiklikten sonra listelenmez (çünkü filtre `source === 'online'` olacak). İstenirse ileride tek seferlik migration ile müşteri siparişleri `system` → `online` yapılabilir.
- **Raporlama / diğer sayfalar:** Restoran raporu vb. sadece `source='restaurant'` kullanıyorsa etkilenmez. Başka yerde `source='system'` sayan bir mantık varsa, "paket" saymak için aynı kalır; "online sipariş" saymak isterseniz ayrıca `source === 'online'` eklenebilir.

Bu planı onaylarsanız, sırayla bu dosyalarda değişiklikleri uygulayacağım.
