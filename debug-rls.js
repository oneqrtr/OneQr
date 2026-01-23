const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fnlbwadnxticcdbmdahi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZubGJ3YWRueHRpY2NkYm1kYWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjI0NDgsImV4cCI6MjA4NDY5ODQ0OH0.8Tf_bpyO5esBGgZzI4d9cqZCwXCuNIppOIn3m7CSmlo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRest() {
    console.log("Kontrol ediliyor...");

    // 1. OneQRTR kullanıcısıyla giriş yapalım
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'oneqrtr@gmail.com',
        password: '123456789'
    });

    if (authError) {
        console.error("Giriş Hatası:", authError.message);
        return;
    }
    console.log("Giriş Başarılı:", user.id);

    // 2. Restoran var mı bak
    const { data: rest, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id);

    console.log("Mevcut Restoranlar:", rest);

    if (rest.length === 0) {
        console.log("Restoran yok, oluşturuluyor...");
        const { data: newRest, error: createError } = await supabase
            .from('restaurants')
            .insert({
                name: "Debug Restoran",
                slug: `debug-${Math.floor(Math.random() * 1000)}`,
                owner_id: user.id
            })
            .select();

        if (createError) {
            console.error("RESTORAN OLUŞTURMA HATASI (RLS OLABİLİR):", createError);
        } else {
            console.log("Restoran başarıyla oluşturuldu:", newRest);
        }
    }
}

checkRest();
