-- SVK V78: eigenstaendige Damenverwaltung, sicher getrennt durch RLS
CREATE TABLE IF NOT EXISTS public.damen_content (key text PRIMARY KEY, value text NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS public.damen_players (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, position text NOT NULL DEFAULT '', number text NOT NULL DEFAULT '', image text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0);
ALTER TABLE public.damen_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damen_players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "damen content public read" ON public.damen_content;
CREATE POLICY "damen content public read" ON public.damen_content FOR SELECT TO anon,authenticated USING (true);
DROP POLICY IF EXISTS "damen players public read" ON public.damen_players;
CREATE POLICY "damen players public read" ON public.damen_players FOR SELECT TO anon,authenticated USING (true);
DROP POLICY IF EXISTS "v78 damen_content insert" ON public.damen_content;
CREATE POLICY "v78 damen_content insert" ON public.damen_content FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion')));
DROP POLICY IF EXISTS "v78 damen_content update" ON public.damen_content;
CREATE POLICY "v78 damen_content update" ON public.damen_content FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion')));
DROP POLICY IF EXISTS "v78 damen_content delete" ON public.damen_content;
CREATE POLICY "v78 damen_content delete" ON public.damen_content FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion')));
DROP POLICY IF EXISTS "v78 damen_players insert" ON public.damen_players;
CREATE POLICY "v78 damen_players insert" ON public.damen_players FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion')));
DROP POLICY IF EXISTS "v78 damen_players update" ON public.damen_players;
CREATE POLICY "v78 damen_players update" ON public.damen_players FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion'))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion')));
DROP POLICY IF EXISTS "v78 damen_players delete" ON public.damen_players;
CREATE POLICY "v78 damen_players delete" ON public.damen_players FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion')));

-- Daten werden beim ersten Speichern aus der vorhandenen Kaderseite übernommen.

-- Bild-Upload fuer Damenredaktion UND Admin (nur Pfad damen/)
DROP POLICY IF EXISTS "v78 damen image upload" ON storage.objects;
CREATE POLICY "v78 damen image upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='news-images' AND name LIKE 'damen/%' AND EXISTS
 (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('admin','damen_redaktion')));
