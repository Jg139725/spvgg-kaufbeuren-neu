-- V77: Nach dem Erstellen des Benutzers in Supabase Auth ausfuehren.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('viewer','editor','admin','jugend_redaktion','foerderverein_redaktion','damen_redaktion'));

-- Nur diesen Auth-Benutzer zur Damenredaktion machen. Kein Passwort im SQL speichern.
UPDATE public.profiles SET role='damen_redaktion'
WHERE id=(SELECT id FROM auth.users WHERE lower(email)='herzfotografen@web.de');

DROP POLICY IF EXISTS "damen news select" ON public.news;
CREATE POLICY "damen news select" ON public.news FOR SELECT TO authenticated USING (category='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen news insert" ON public.news;
CREATE POLICY "damen news insert" ON public.news FOR INSERT TO authenticated WITH CHECK (category='Frauen' AND created_by=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen news update" ON public.news;
CREATE POLICY "damen news update" ON public.news FOR UPDATE TO authenticated USING (category='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion')) WITH CHECK (category='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen news delete" ON public.news;
CREATE POLICY "damen news delete" ON public.news FOR DELETE TO authenticated USING (category='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));

DROP POLICY IF EXISTS "damen training select" ON public.training_times;
CREATE POLICY "damen training select" ON public.training_times FOR SELECT TO authenticated USING (scope='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen training insert" ON public.training_times;
CREATE POLICY "damen training insert" ON public.training_times FOR INSERT TO authenticated WITH CHECK (scope='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen training update" ON public.training_times;
CREATE POLICY "damen training update" ON public.training_times FOR UPDATE TO authenticated USING (scope='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion')) WITH CHECK (scope='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen training delete" ON public.training_times;
CREATE POLICY "damen training delete" ON public.training_times FOR DELETE TO authenticated USING (scope='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));

-- team_staff ist Bestandteil des vorhandenen Trainer-Moduls.
DROP POLICY IF EXISTS "damen staff select" ON public.team_staff;
CREATE POLICY "damen staff select" ON public.team_staff FOR SELECT TO authenticated USING (area='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen staff insert" ON public.team_staff;
CREATE POLICY "damen staff insert" ON public.team_staff FOR INSERT TO authenticated WITH CHECK (area='Frauen' AND team_key='damen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen staff update" ON public.team_staff;
CREATE POLICY "damen staff update" ON public.team_staff FOR UPDATE TO authenticated USING (area='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion')) WITH CHECK (area='Frauen' AND team_key='damen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
DROP POLICY IF EXISTS "damen staff delete" ON public.team_staff;
CREATE POLICY "damen staff delete" ON public.team_staff FOR DELETE TO authenticated USING (area='Frauen' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));

DROP POLICY IF EXISTS "damen image upload" ON storage.objects;
CREATE POLICY "damen image upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='news-images' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='damen_redaktion'));
