import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function buildFreshContext(userId) {
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", userId).single();
  const [{ data: medicines }, { data: completedScans }] = await Promise.all([
    supabase.from("medicines").select("*").eq("user_id", userId).eq("active", true),
    supabase.from("scans")
      .select("scan_name, scan_type, findings, scan_date")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("scan_date", { ascending: false })
      .limit(3),
  ]);

  const p = profile || {};
  const ld = p.lab_data || {};
  const latest = arr => arr?.slice(-1)[0];
  const hb    = latest(ld.hemoglobin);
  const tsh   = latest(ld.tsh);
  const sugar = latest(ld.blood_sugar_fasting);

  const week = p.due_date
    ? Math.round(40 - (new Date(p.due_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))
    : 8;

  const parts = [
    `Week ${week} pregnancy`,
    p.is_first_pregnancy === true  ? "first pregnancy"    : null,
    p.is_first_pregnancy === false ? "experienced mother" : null,
    p.diet_type ? `${p.diet_type} diet` : null,
    (p.conditions || []).length ? `conditions: ${p.conditions.join(", ")}` : null,
    (medicines || []).length ? `medicines: ${medicines.map(m => `${m.name}${m.dosage ? " " + m.dosage : ""}`).join(", ")}` : null,
    hb    ? `HB ${hb.value} g/dL${hb.value < 11 ? " (below typical range — doctor is aware)" : ""}` : null,
    tsh   ? `TSH ${tsh.value} mIU/L`                      : null,
    sugar ? `fasting blood sugar ${sugar.value} mg/dL`    : null,
    p.blood_group    ? `blood group ${p.blood_group}`     : null,
    p.prior_losses > 0 ? `${p.prior_losses} prior pregnancy loss` : null,
    p.next_appointment_date
      ? `next doctor appointment: ${new Date(p.next_appointment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
      : null,
    (completedScans || []).length ? `recent scan findings: ${completedScans.map(s => {
      const f = s.findings || {};
      return [
        s.scan_name || s.scan_type,
        f.heartbeat_bpm ? `HR ${f.heartbeat_bpm}bpm` : null,
        f.position || null,
        f.fluid_level && f.fluid_level !== "normal" ? `fluid ${f.fluid_level}` : null,
        f.nt_measurement ? `NT ${f.nt_measurement}mm` : null,
        f.weight_grams ? `${Math.round(f.weight_grams)}g` : null,
      ].filter(Boolean).join(", ");
    }).join("; ")}` : null,
  ].filter(Boolean);

  const flags = [];
  if (hb?.value < 11)                  flags.push("low_hb");
  if (tsh?.value > 4 || tsh?.value < 0.1) flags.push("thyroid_flag");
  if ((p.conditions || []).includes("thyroid")) flags.push("thyroid");
  if (p.prior_losses > 0)              flags.push("prior_loss");
  if (p.conception_type === "ivf")     flags.push("ivf");

  const summary = parts.join(". ");

  // Generate personalised insights via AI (fire-and-forget friendly — we await but keep it fast)
  let insightBullets = [];
  try {
    const aiResp = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: "You are Matri, a warm pregnancy companion. Based on the woman's health data, generate 2-3 personalised proactive insights. Return ONLY a JSON array: [{text: string, type: 'info'|'nudge'|'prep', priority: 'high'|'medium'|'low'}]. Each text max 12 words. Warm, never alarming. No markdown.",
      messages: [{ role: "user", content: `Health context: ${summary}. Generate 2-3 insights.` }],
    });
    const raw = aiResp.content?.[0]?.text || "[]";
    insightBullets = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch { insightBullets = []; }

  await supabase.from("health_insights").upsert({
    user_id:         userId,
    updated_at:      new Date().toISOString(),
    context_summary: summary,
    flags,
    current_week:    week,
    insight_bullets: insightBullets,
  }, { onConflict: "user_id" });

  return { summary, flags, week, doctorPrep: [], insightBullets };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    // POST — force rebuild, bypass cache
    if (req.method === "POST") {
      const context = await buildFreshContext(user.id);
      return res.status(200).json(context);
    }

    // GET — serve from cache if fresh (< 1 hour)
    const { data: insight } = await supabase
      .from("health_insights")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (insight?.updated_at) {
      const age = Date.now() - new Date(insight.updated_at).getTime();
      if (age < 60 * 60 * 1000) {
        return res.status(200).json({
          summary:        insight.context_summary,
          flags:          insight.flags || [],
          week:           insight.current_week ?? null,
          doctorPrep:     insight.doctor_prep_items || [],
          insightBullets: insight.insight_bullets   || [],
        });
      }
    }

    const context = await buildFreshContext(user.id);
    return res.status(200).json(context);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
