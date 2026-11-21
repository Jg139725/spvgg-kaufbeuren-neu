-- SVK V97: Jugend-App – echte Sperre pro Person
-- Problem vorher: Website-Admins (profiles.role admin/jugend_redaktion) kamen IMMER als Jugendleitung rein,
-- auch wenn ihr Zugang in der App gesperrt war. Jetzt gilt: gesperrt = kein Zugriff auf die Jugend-App.
-- Die Rechte auf der Website (Redaktion, Admin-Bereich) bleiben davon unberührt.

ALTER TABLE public.jugend_app_mitglieder ADD COLUMN IF NOT EXISTS gesperrt boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.jugend_ist_gesperrt()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.gesperrt);
$$;
REVOKE ALL ON FUNCTION public.jugend_ist_gesperrt() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.jugend_ist_gesperrt() TO authenticated;

CREATE OR REPLACE FUNCTION public.jugend_ist_leitung()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT NOT public.jugend_ist_gesperrt() AND (
       EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','jugend_redaktion'))
    OR EXISTS (SELECT 1 FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.freigegeben AND m.rolle = 'leitung'));
$$;

CREATE OR REPLACE FUNCTION public.jugend_ist_mitglied()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.jugend_ist_leitung()
      OR EXISTS (SELECT 1 FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.freigegeben AND NOT m.gesperrt);
$$;

CREATE OR REPLACE FUNCTION public.jugend_meine_teams()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT coalesce((SELECT m.teams FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.freigegeben AND NOT m.gesperrt), '{}'::text[]);
$$;

CREATE OR REPLACE FUNCTION public.jugend_darf_freigeben()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.freigegeben AND m.darf_freigeben AND NOT m.gesperrt);
$$;

CREATE OR REPLACE FUNCTION public.jugend_personen()
RETURNS TABLE(user_id uuid, name text, rolle text, telefon text, email text, teams text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT m.user_id, m.name, m.rolle, m.telefon, m.email, m.teams
    FROM public.jugend_app_mitglieder m
   WHERE m.freigegeben AND NOT m.gesperrt AND public.jugend_ist_mitglied()
   ORDER BY m.name;
$$;

-- Eigenen Eintrag anlegen: niemand kann sich selbst als entsperrt eintragen.
-- Gesperrte Einträge darf nur der Freigeber ändern oder löschen (V93), die Sperre lässt sich also nicht selbst aufheben.
DROP POLICY IF EXISTS "v93 mitglieder insert" ON public.jugend_app_mitglieder;
CREATE POLICY "v93 mitglieder insert" ON public.jugend_app_mitglieder FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND darf_freigeben = false AND gesperrt = false AND (
       (freigegeben = false AND rolle = 'trainer' AND teams = '{}')
       OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','jugend_redaktion'))
    ))
    OR public.jugend_darf_freigeben()
  );

-- Herzfotografen für die Jugend-App sperren (Website-Rechte bleiben)
UPDATE public.jugend_app_mitglieder m SET gesperrt = true, freigegeben = false, updated_at = now()
  FROM auth.users u WHERE u.id = m.user_id AND lower(u.email) = 'herzfotografen@web.de';
DELETE FROM public.jugend_push_abos a USING auth.users u
  WHERE u.id = a.user_id AND lower(u.email) = 'herzfotografen@web.de';
