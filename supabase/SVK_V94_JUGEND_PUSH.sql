-- SVK V94: Jugend-App – Push-Benachrichtigungen
-- jugend_push_abos: Geräte, die Benachrichtigungen bekommen wollen (jeder verwaltet nur seine eigenen).
-- jugend_push_config: VAPID-Schlüssel für den Versand. Nur für den Server (Edge Function mit Service-Role) lesbar.
-- Der private Schlüssel steht NICHT in dieser Datei, er wird separat eingetragen.

CREATE TABLE IF NOT EXISTS public.jugend_push_abos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  geraet text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
CREATE INDEX IF NOT EXISTS jugend_push_abos_user_idx ON public.jugend_push_abos (user_id);
ALTER TABLE public.jugend_push_abos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jugend_push_abos FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jugend_push_abos TO authenticated;

DROP POLICY IF EXISTS "v94 push abos eigene" ON public.jugend_push_abos;
CREATE POLICY "v94 push abos eigene" ON public.jugend_push_abos FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.jugend_ist_mitglied());

CREATE TABLE IF NOT EXISTS public.jugend_push_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  vapid_public text NOT NULL,
  vapid_private text NOT NULL,
  subject text NOT NULL DEFAULT 'mailto:info@spvgg-kaufbeuren.de'
);
ALTER TABLE public.jugend_push_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jugend_push_config FROM anon, authenticated;
-- keine Policies: nur die Service-Role (Edge Function) kann lesen
