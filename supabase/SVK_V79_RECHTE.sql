-- V79: PostgreSQL-Rechte zusaetzlich zu den vorhandenen RLS-Policies
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.damen_players, public.damen_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.damen_players, public.damen_content TO authenticated;
-- Die RLS-Policies aus V78 bleiben aktiv und beschraenken Schreibrechte auf admin/damen_redaktion.
