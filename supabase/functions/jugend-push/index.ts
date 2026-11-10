// SVK Jugend-App – Push-Benachrichtigungen verschicken
// Aufruf aus der App (eingeloggt): { typ: 'neu' | 'status' | 'nachricht', aufgabe_id, an?: uuid[], text?: string }
// Sicherheit: Die Aufgabe wird mit dem Login des Aufrufers gelesen (Datenbank-Regeln greifen).
// Nur wer die Aufgabe sehen darf, kann Benachrichtigungen dazu auslösen – und nur an Beteiligte.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const STATUS: Record<string, string> = { offen: "Offen", in_bearbeitung: "In Bearbeitung", erledigt: "Erledigt" };
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(url, service);

  const { data: u } = await asUser.auth.getUser();
  const me = u?.user?.id;
  if (!me) return json({ error: "auth" }, 401);

  let body: { typ?: string; aufgabe_id?: string; an?: string[]; text?: string };
  try { body = await req.json(); } catch { return json({ error: "body" }, 400); }
  const typ = body.typ ?? "";
  if (!["neu", "status", "nachricht"].includes(typ) || !body.aufgabe_id) return json({ error: "params" }, 400);

  // Aufgabe mit den Rechten des Aufrufers lesen
  const { data: a } = await asUser.from("jugend_aufgaben").select("id,titel,status,zugewiesen_an,created_by").eq("id", body.aufgabe_id).maybeSingle();
  if (!a) return json({ error: "forbidden" }, 403);

  const beteiligt = new Set<string>([...(a.zugewiesen_an ?? []), a.created_by]);
  let empfaenger: string[];
  if (typ === "neu") empfaenger = (body.an ?? []).filter((id) => (a.zugewiesen_an ?? []).includes(id));
  else empfaenger = [...beteiligt];
  empfaenger = [...new Set(empfaenger)].filter((id) => id && id !== me);
  if (!empfaenger.length) return json({ ok: true, gesendet: 0 });

  const { data: absender } = await admin.from("jugend_app_mitglieder").select("name").eq("user_id", me).maybeSingle();
  const wer = absender?.name?.split(" ")[0] || "Jugendleitung";

  let title = "", text = "";
  if (typ === "neu") { title = `Neue Aufgabe von ${wer}`; text = a.titel; }
  if (typ === "status") { title = `${wer}: ${STATUS[a.status] ?? a.status}`; text = a.titel; }
  if (typ === "nachricht") { title = `${wer} in „${cut(a.titel, 40)}“`; text = cut(String(body.text ?? "Neue Nachricht"), 160); }

  const { data: cfg } = await admin.from("jugend_push_config").select("*").eq("id", 1).maybeSingle();
  if (!cfg) return json({ error: "config" }, 500);
  webpush.setVapidDetails(cfg.subject, cfg.vapid_public, cfg.vapid_private);

  const { data: abos } = await admin.from("jugend_push_abos").select("*").in("user_id", empfaenger);
  const payload = JSON.stringify({ title, body: text, url: `/jugendapp/#aufgabe=${a.id}`, tag: `aufgabe-${a.id}` });

  let gesendet = 0;
  await Promise.all((abos ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24, urgency: "high" });
      gesendet++;
      await admin.from("jugend_push_abos").update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await admin.from("jugend_push_abos").delete().eq("id", s.id); // Gerät abgemeldet
      else console.error("push failed", code, (e as Error).message);
    }
  }));
  return json({ ok: true, gesendet, geraete: abos?.length ?? 0 });
});
