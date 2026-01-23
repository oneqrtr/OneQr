const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually read .env.local
let envConfig = {};
try {
    const envContent = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key && value) envConfig[key] = value;
        }
    });
} catch (e) {
    console.log("Env dosyası okunamadı.");
}

async function testSystem() {
    console.log("--- SİSTEM TESTİ BAŞLIYOR ---");

    const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("HATA: .env.local dosyasından Supabase bilgileri okunamadı.");
        console.log("Mevcut env:", Object.keys(envConfig));
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. LOGIN TEST
    console.log("\n1. GİRİŞ TESTİ (oneqrtr@gmail.com)...");
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'oneqrtr@gmail.com',
        password: '123456789'
    });

    if (authError) {
        console.error("GİRİŞ BAŞARISIZ:", authError.message);
        console.log("-> Kullanıcı kayıtlı olmayabilir. Kayıt olmayı deniyor...");

        // Try Registration if login fails
        const { data: regUser, error: regError } = await supabase.auth.signUp({
            email: 'oneqrtr@gmail.com',
            password: '123456789'
        });

        if (regError) {
            console.error("KAYIT DA BAŞARISIZ:", regError.message);
            return;
        }
        console.log("KAYIT BAŞARILI! Yeni Kullanıcı ID:", regUser.user?.id);

        // Login again to be sure
        const { data: { user: newUser } } = await supabase.auth.signInWithPassword({
            email: 'oneqrtr@gmail.com',
            password: '123456789'
        });
        if (newUser) runChecks(supabase, newUser);

    } else {
        console.log("GİRİŞ BAŞARILI! Kullanıcı ID:", user.id);
        await runChecks(supabase, user);
    }
}

async function runChecks(supabase, user) {
    // 2. RESTAURANT CHECK
    console.log("\n2. İŞLETME KONTROLÜ...");
    const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single();

    if (restError || !restaurant) {
        console.log("-> İşletme bulunamadı. Onboarding akışı gerekiyor.");

        const slug = `test-isletme-${Math.floor(Math.random() * 1000)}`;
        const { data: newRest, error: createError } = await supabase
            .from('restaurants')
            .insert({
                name: "Test İşletmesi",
                slug: slug,
                owner_id: user.id
            })
            .select()
            .single();

        if (createError) {
            console.error("İşletme oluşturma hatası:", createError.message);
            return;
        }
        console.log(`-> İşletme oluşturuldu: ${newRest.name} (Slug: ${newRest.slug})`);

        const { data: cat } = await supabase.from('categories').insert({ restaurant_id: newRest.id, name: 'Test Kategori', display_order: 1 }).select().single();
        await supabase.from('products').insert({ category_id: cat.id, name: 'Test Ürün', price: 99.90, is_available: true });
        console.log("-> Test verileri (Kategori/Ürün) eklendi.");

    } else {
        console.log(`-> İşletme Mevcut: ${restaurant.name}`);
        console.log(`-> Link: oneqr.tr/m/${restaurant.slug}`);

        // 3. MENU CONTENT CHECK
        console.log("\n3. MENÜ İÇERİĞİ...");
        const { data: categories } = await supabase.from('categories').select('id, name').eq('restaurant_id', restaurant.id);
        console.log(`-> Kategori Sayısı: ${categories ? categories.length : 0}`);

        if (categories && categories.length > 0) {
            const catIds = categories.map(c => c.id);
            const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).in('category_id', catIds);
            console.log(`-> Toplam Ürün Sayısı: ${count}`);
        }
    }

    console.log("\n--- TEST TAMAMLANDI: SİSTEM SAĞLIKLI GÖRÜNÜYOR ---");
}

testSystem();
