-- SVK V93: Jugend-App – nur ausgewählte Personen (Freigeber) dürfen Zugänge freigeben/ändern
-- Freigeber: Justin Grundei. Alle übrigen Rechte bleiben wie in V91/V92.

ALTER TABLE public.jugend_app_mitglieder ADD COLUMN IF NOT EXISTS darf_freigeben boolean NOT NULL DEFAULT false;

UPDATE public.jugend_app_mitglieder m SET darf_freigeben = true
  FROM auth.users u WHERE u.id = m.user_id AND lower(u.email) = 'justin.grundei@outlook.de';

CREATE OR REPLACE FUNCTION public.jugend_darf_freigeben()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.jugend_app_mitglieder m WHERE m.user_id = auth.uid() AND m.freigegeben AND m.darf_freigeben);
$$;
REVOKE ALL ON FUNCTION public.jugend_darf_freigeben() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.jugend_darf_freigeben() TO authenticated;

-- Eintragen: Trainer beantragen selbst; Website-Leitung (admin/jugend_redaktion) legt nur den EIGENEN Eintrag an; Freigeber alles
DROP POLICY IF EXISTS "v91 mitglieder selbst registrieren" ON public.jugend_app_mitglieder;
DROP POLICY IF EXISTS "v93 mitglieder insert" ON public.jugend_app_mitglieder;
CREATE POLICY "v93 mitglieder insert" ON public.jugend_app_mitglieder FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND darf_freigeben = false AND (
       (freigegeben = false AND rolle = 'trainer' AND teams = '{}')
       OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','jugend_redaktion'))
    ))
    OR public.jugend_darf_freigeben()
  );

-- Ändern / Löschen (freigeben, sperren, Teams, Rolle): nur Freigeber
DROP POLICY IF EXISTS "v91 mitglieder leitung update" ON public.jugend_app_mitglieder;
DROP POLICY IF EXISTS "v93 mitglieder update" ON public.jugend_app_mitglieder;
CREATE POLICY "v93 mitglieder update" ON public.jugend_app_mitglieder FOR UPDATE TO authenticated
  USING (public.jugend_darf_freigeben()) WITH CHECK (public.jugend_darf_freigeben());
DROP POLICY IF EXISTS "v91 mitglieder leitung delete" ON public.jugend_app_mitglieder;
DROP POLICY IF EXISTS "v93 mitglieder delete" ON public.jugend_app_mitglieder;
CREATE POLICY "v93 mitglieder delete" ON public.jugend_app_mitglieder FOR DELETE TO authenticated
  USING (public.jugend_darf_freigeben() AND user_id <> auth.uid());
