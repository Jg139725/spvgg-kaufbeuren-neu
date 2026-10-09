
-- V73: im Supabase SQL Editor einmalig ausführen.
-- Eigenen Förderverein-Benutzer zuerst in Authentication > Users anlegen.
-- Anschließend seine UUID unten in der UPDATE-Anweisung manuell einsetzen.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('viewer','editor','admin','jugend_redaktion','foerderverein_redaktion'));

CREATE TABLE IF NOT EXISTS public.foerderverein_content(
 id integer PRIMARY KEY CHECK(id=1),
 caption text,
 image_url text,
 people jsonb NOT NULL DEFAULT '[]'::jsonb,
 sponsors jsonb NOT NULL DEFAULT '[]'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.foerderverein_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fv public read" ON public.foerderverein_content;
CREATE POLICY "fv public read" ON public.foerderverein_content FOR SELECT TO anon,authenticated USING(true);
DROP POLICY IF EXISTS "fv staff insert" ON public.foerderverein_content;
CREATE POLICY "fv staff insert" ON public.foerderverein_content FOR INSERT TO authenticated WITH CHECK (
 EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN('admin','editor','foerderverein_redaktion'))
);
DROP POLICY IF EXISTS "fv staff update" ON public.foerderverein_content;
CREATE POLICY "fv staff update" ON public.foerderverein_content FOR UPDATE TO authenticated USING (
 EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN('admin','editor','foerderverein_redaktion'))
) WITH CHECK (
 EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN('admin','editor','foerderverein_redaktion'))
);

-- Förderverein-Redaktion darf ausschließlich Förderverein-Berichte bearbeiten.
DROP POLICY IF EXISTS "fv news read" ON public.news;
CREATE POLICY "fv news read" ON public.news FOR SELECT TO authenticated USING(
 category='Förderverein' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='foerderverein_redaktion')
);
DROP POLICY IF EXISTS "fv news insert" ON public.news;
CREATE POLICY "fv news insert" ON public.news FOR INSERT TO authenticated WITH CHECK(
 category='Förderverein' AND created_by=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='foerderverein_redaktion')
);
DROP POLICY IF EXISTS "fv news update" ON public.news;
CREATE POLICY "fv news update" ON public.news FOR UPDATE TO authenticated USING(
 category='Förderverein' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='foerderverein_redaktion')
) WITH CHECK(
 category='Förderverein' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='foerderverein_redaktion')
);

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('foerderverein-images','foerderverein-images',true,5000000,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO NOTHING;
DROP POLICY IF EXISTS "fv images public" ON storage.objects;
CREATE POLICY "fv images public" ON storage.objects FOR SELECT TO anon,authenticated USING(bucket_id='foerderverein-images');
DROP POLICY IF EXISTS "fv images upload" ON storage.objects;
CREATE POLICY "fv images upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(
 bucket_id='foerderverein-images' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN('admin','editor','foerderverein_redaktion'))
);

-- Bestehenden Bucket 'news-images': zusätzliche Uploadberechtigung nur für Förderverein-Redaktion.
DROP POLICY IF EXISTS "fv news images upload" ON storage.objects;
CREATE POLICY "fv news images upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(
 bucket_id='news-images' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='foerderverein_redaktion')
);

-- NACH Anlegen des neuen Auth-Benutzers ausführen (UUID ersetzen):
-- UPDATE public.profiles SET role='foerderverein_redaktion' WHERE id='HIER-UUID-DES-NEUEN-BENUTZERS';
