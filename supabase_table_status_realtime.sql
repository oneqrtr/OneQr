-- table_status için Realtime: Hesap istendi vb. masa durumu değişiklikleri anlık yansısın
-- Bu dosyayı Supabase SQL Editor'da bir kez çalıştırın (table_status tablosu zaten varsa).
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_status;
