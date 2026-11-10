-- SVK V92: Jugend-App – Aufgaben mit Zuweisung, Status und Chat
-- Sichtbar für: Jugendleitung (alles), Ersteller und zugewiesene Personen.
-- Bestehende Tabellen und Logins bleiben unverändert.

CREATE OR REPLACE FUNCTION public.jugend_ist_mitglied()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.jugend_ist_leitung()
      OR EXISTS (SELECT 1 FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.freigegeben);
$$;
REVOKE ALL ON FUNCTION public.jugend_ist_mitglied() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.jugend_ist_mitglied() TO authenticated;

-- Personen, denen man Aufgaben geben kann (nur für App-Mitglieder abrufbar)
CREATE OR REPLACE FUNCTION public.jugend_personen()
RETURNS TABLE (user_id uuid, name text, rolle text, telefon text, email text, teams text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT m.user_id, m.name, m.rolle, m.telefon, m.email, m.teams
    FROM public.jugend_app_mitglieder m
   WHERE m.freigegeben AND public.jugend_ist_mitglied()
   ORDER BY m.name;
$$;
REVOKE ALL ON FUNCTION public.jugend_personen() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.jugend_personen() TO authenticated;

CREATE TABLE IF NOT EXISTS public.jugend_aufgaben (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titel text NOT NULL CHECK (length(titel) BETWEEN 1 AND 200),
  beschreibung text NOT NULL DEFAULT '',
  team_key text,
  zugewiesen_an uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','in_bearbeitung','erledigt')),
  wichtig boolean NOT NULL DEFAULT false,
  faellig_am date,
  erledigt_am timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jugend_aufgaben_zugewiesen_idx ON public.jugend_aufgaben USING gin (zugewiesen_an);
CREATE INDEX IF NOT EXISTS jugend_aufgaben_status_idx ON public.jugend_aufgaben (status);

CREATE TABLE IF NOT EXISTS public.jugend_aufgaben_nachrichten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aufgabe_id uuid NOT NULL REFERENCES public.jugend_aufgaben(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  text text NOT NULL CHECK (length(text) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jugend_aufgaben_nachrichten_aufgabe_idx ON public.jugend_aufgaben_nachrichten (aufgabe_id, created_at);

ALTER TABLE public.jugend_aufgaben ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugend_aufgaben_nachrichten ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jugend_aufgaben FROM anon;
REVOKE ALL ON TABLE public.jugend_aufgaben_nachrichten FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jugend_aufgaben TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.jugend_aufgaben_nachrichten TO authenticated;

DROP POLICY IF EXISTS "v92 aufgaben select" ON public.jugend_aufgaben;
CREATE POLICY "v92 aufgaben select" ON public.jugend_aufgaben FOR SELECT TO authenticated
  USING (public.jugend_ist_leitung() OR (public.jugend_ist_mitglied() AND (created_by = auth.uid() OR auth.uid() = ANY (zugewiesen_an))));
DROP POLICY IF EXISTS "v92 aufgaben insert" ON public.jugend_aufgaben;
CREATE POLICY "v92 aufgaben insert" ON public.jugend_aufgaben FOR INSERT TO authenticated
  WITH CHECK (public.jugend_ist_mitglied() AND created_by = auth.uid());
DROP POLICY IF EXISTS "v92 aufgaben update" ON public.jugend_aufgaben;
CREATE POLICY "v92 aufgaben update" ON public.jugend_aufgaben FOR UPDATE TO authenticated
  USING (public.jugend_ist_leitung() OR (public.jugend_ist_mitglied() AND (created_by = auth.uid() OR auth.uid() = ANY (zugewiesen_an))))
  WITH CHECK (public.jugend_ist_mitglied());
DROP POLICY IF EXISTS "v92 aufgaben delete" ON public.jugend_aufgaben;
CREATE POLICY "v92 aufgaben delete" ON public.jugend_aufgaben FOR DELETE TO authenticated
  USING (public.jugend_ist_leitung() OR created_by = auth.uid());

DROP POLICY IF EXISTS "v92 nachrichten select" ON public.jugend_aufgaben_nachrichten;
CREATE POLICY "v92 nachrichten select" ON public.jugend_aufgaben_nachrichten FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jugend_aufgaben a WHERE a.id = aufgabe_id));
DROP POLICY IF EXISTS "v92 nachrichten insert" ON public.jugend_aufgaben_nachrichten;
CREATE POLICY "v92 nachrichten insert" ON public.jugend_aufgaben_nachrichten FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.jugend_aufgaben a WHERE a.id = aufgabe_id));
DROP POLICY IF EXISTS "v92 nachrichten delete" ON public.jugend_aufgaben_nachrichten;
CREATE POLICY "v92 nachrichten delete" ON public.jugend_aufgaben_nachrichten FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.jugend_ist_leitung());

-- Live-Updates in der App (Realtime beachtet die Regeln oben)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'jugend_aufgaben') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jugend_aufgaben;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'jugend_aufgaben_nachrichten') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jugend_aufgaben_nachrichten;
  END IF;
END $$;
