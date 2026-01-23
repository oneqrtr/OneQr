
-- YENİ KOLONLARI EKLEME
-- Restaurants tablosuna 'description' ve 'hero_image_url' kolonları ekleniyor.
-- Eğer bu kolonlar zaten varsa hata vermeyecektir (if not exists kullanılmıyor ama Supabase SQL editorunda manuel kontrol edebilirsiniz veya bu scripti çalıştırabilirsiniz).

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'description') THEN 
        ALTER TABLE restaurants ADD COLUMN description text; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'hero_image_url') THEN 
        ALTER TABLE restaurants ADD COLUMN hero_image_url text; 
    END IF;
END $$;
