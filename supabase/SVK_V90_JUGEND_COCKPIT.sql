-- SVK V90: Jugendleiter-Cockpit – Spielverlegungen
-- Interne Daten: NICHT öffentlich lesbar. Nur admin und jugend_redaktion.
-- Bestehende Tabellen, Logins und Policies werden nicht verändert.

CREATE TABLE IF NOT EXISTS public.jugend_spielverlegungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_key text NOT NULL,
  team_name text NOT NULL,
  gegner text NOT NULL,
  heim boolean NOT NULL DEFAULT true,
  wettbewerb text NOT NULL DEFAULT 'Punktspiel',
  alt_datum date,
  alt_uhrzeit time,
  neu_datum date,
  neu_uhrzeit time,
  neu_ort text,
  grund text NOT NULL DEFAULT '',
  angefragt_von text NOT NULL DEFAULT 'wir' CHECK (angefragt_von IN ('wir','gegner')),
  status text NOT NULL DEFAULT 'offen'
    CHECK (status IN ('offen','angefragt','zugestimmt','beantragt','erledigt','abgelehnt')),
  kontakt_name text,
  kontakt_telefon text,
  kontakt_email text,
  notizen text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jugend_spielverlegungen_status_idx ON public.jugend_spielverlegungen(status);

ALTER TABLE public.jugend_spielverlegungen ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.jugend_spielverlegungen FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jugend_spielverlegungen TO authenticated;

DROP POLICY IF EXISTS "v90 jugend verlegungen all" ON public.jugend_spielverlegungen;
CREATE POLICY "v90 jugend verlegungen all" ON public.jugend_spielverlegungen
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','jugend_redaktion')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','jugend_redaktion')));
