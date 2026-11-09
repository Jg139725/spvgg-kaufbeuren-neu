-- SVK V91: Jugend-App – Trainer-Zugänge und Team-Rechte
-- Bestehende Logins/Rollen in public.profiles bleiben unverändert.
-- Leitung = profiles.role admin/jugend_redaktion ODER freigegebenes App-Mitglied mit rolle 'leitung'.
-- Trainer sehen und bearbeiten nur die Spielverlegungen ihrer eigenen Teams.

CREATE TABLE IF NOT EXISTS public.jugend_app_mitglieder (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  telefon text,
  email text,
  rolle text NOT NULL DEFAULT 'trainer' CHECK (rolle IN ('trainer','leitung')),
  teams text[] NOT NULL DEFAULT '{}',
  freigegeben boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jugend_app_mitglieder ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jugend_app_mitglieder FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jugend_app_mitglieder TO authenticated;

CREATE OR REPLACE FUNCTION public.jugend_ist_leitung()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','jugend_redaktion'))
      OR EXISTS (SELECT 1 FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.freigegeben AND m.rolle = 'leitung');
$$;

CREATE OR REPLACE FUNCTION public.jugend_meine_teams()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT coalesce((SELECT m.teams FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.freigegeben), '{}'::text[]);
$$;

REVOKE ALL ON FUNCTION public.jugend_ist_leitung() FROM public, anon;
REVOKE ALL ON FUNCTION public.jugend_meine_teams() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.jugend_ist_leitung() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jugend_meine_teams() TO authenticated;

-- Mitglieder
DROP POLICY IF EXISTS "v91 mitglieder select" ON public.jugend_app_mitglieder;
CREATE POLICY "v91 mitglieder select" ON public.jugend_app_mitglieder FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.jugend_ist_leitung());
DROP POLICY IF EXISTS "v91 mitglieder selbst registrieren" ON public.jugend_app_mitglieder;
CREATE POLICY "v91 mitglieder selbst registrieren" ON public.jugend_app_mitglieder FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid() AND freigegeben = false AND rolle = 'trainer' AND teams = '{}') OR public.jugend_ist_leitung());
DROP POLICY IF EXISTS "v91 mitglieder leitung update" ON public.jugend_app_mitglieder;
CREATE POLICY "v91 mitglieder leitung update" ON public.jugend_app_mitglieder FOR UPDATE TO authenticated
  USING (public.jugend_ist_leitung()) WITH CHECK (public.jugend_ist_leitung());
DROP POLICY IF EXISTS "v91 mitglieder leitung delete" ON public.jugend_app_mitglieder;
CREATE POLICY "v91 mitglieder leitung delete" ON public.jugend_app_mitglieder FOR DELETE TO authenticated
  USING (public.jugend_ist_leitung());

-- Spielverlegungen: Leitung alles, Trainer nur eigene Teams
DROP POLICY IF EXISTS "v90 jugend verlegungen all" ON public.jugend_spielverlegungen;
DROP POLICY IF EXISTS "v91 verlegungen select" ON public.jugend_spielverlegungen;
CREATE POLICY "v91 verlegungen select" ON public.jugend_spielverlegungen FOR SELECT TO authenticated
  USING (public.jugend_ist_leitung() OR team_key = ANY (public.jugend_meine_teams()));
DROP POLICY IF EXISTS "v91 verlegungen insert" ON public.jugend_spielverlegungen;
CREATE POLICY "v91 verlegungen insert" ON public.jugend_spielverlegungen FOR INSERT TO authenticated
  WITH CHECK (public.jugend_ist_leitung() OR team_key = ANY (public.jugend_meine_teams()));
DROP POLICY IF EXISTS "v91 verlegungen update" ON public.jugend_spielverlegungen;
CREATE POLICY "v91 verlegungen update" ON public.jugend_spielverlegungen FOR UPDATE TO authenticated
  USING (public.jugend_ist_leitung() OR team_key = ANY (public.jugend_meine_teams()))
  WITH CHECK (public.jugend_ist_leitung() OR team_key = ANY (public.jugend_meine_teams()));
DROP POLICY IF EXISTS "v91 verlegungen delete" ON public.jugend_spielverlegungen;
CREATE POLICY "v91 verlegungen delete" ON public.jugend_spielverlegungen FOR DELETE TO authenticated
  USING (public.jugend_ist_leitung());
