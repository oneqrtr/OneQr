-- Add new settings columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS notification_sound TEXT DEFAULT 'ding', -- Options: 'ding', 'bell', 'piano'
ADD COLUMN IF NOT EXISTS printer_header TEXT,
ADD COLUMN IF NOT EXISTS printer_footer TEXT,
ADD COLUMN IF NOT EXISTS printer_copy_count INTEGER DEFAULT 1;

-- Add check constraint for copy count (optional but good practice)
ALTER TABLE public.restaurants 
ADD CONSTRAINT check_printer_copy_count CHECK (printer_copy_count >= 1 AND printer_copy_count <= 5);
