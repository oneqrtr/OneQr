-- Existing 'yicem' slug'ını 'demo' olarak güncelle
UPDATE restaurants 
SET slug = 'demo', 
    name = 'OneQr Demo', 
    website_url = 'https://demo.oneqr.tr' 
WHERE slug = 'yicem';
