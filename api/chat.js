import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function loadHealthContext(userId) {
  try {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!p) return null;

    const { data: medicines } = await supabase
      .from("medicines").select("name,dosage,frequency").eq("user_id", userId).eq("active", true);

    const { data: testOrders } = await supabase
      .from("test_orders").select("test_name,due_date,status").eq("user_id", userId);

    const ld  = p.lab_data        || {};
    const le  = p.lab_extras_v2   || {};
    const latest = arr => arr?.slice(-1)[0];

    const hb    = latest(ld.hemoglobin);
    const tsh   = latest(ld.tsh);
    const fbg   = latest(ld.blood_sugar_fasting);
    const ppbg  = latest(ld.blood_sugar_pp);

    const week = p.due_date
      ? Math.round(40 - (new Date(p.due_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))
      : null;
    const trimester = !week ? null : week <= 13 ? "First Trimester" : week <= 26 ? "Second Trimester" : "Third Trimester";

    // Extra lab values (ferritin, vitamin D, etc.)
    const extraLines = Object.entries(le)
      .filter(([, d]) => d?.entries?.length)
      .map(([name, d]) => {
        const v = d.entries[d.entries.length - 1];
        return `${name} ${v.value}${d.unit ? " " + d.unit : ""}`;
      });

    // Active medicines with dosage + frequency
    const medLines = (medicines || []).map(m =>
      [m.name, m.dosage, m.frequency].filter(Boolean).join(" ")
    );

    // Pending test orders
    const pendingTests = (testOrders || [])
      .filter(t => t.status === "ordered")
      .map(t => t.test_name);

    const flags = [];
    if (hb?.value < 11)               flags.push("low_hb");
    if (tsh?.value > 4 || tsh?.value < 0.1) flags.push("thyroid_flag");
    if ((p.conditions || []).includes("thyroid")) flags.push("thyroid");
    if (p.prior_losses > 0)           flags.push("prior_loss");

    const parts = [
      week       ? `Week ${week} pregnancy (${trimester})` : null,
      p.name     ? `Patient: ${p.name}` : null,
      p.is_first_pregnancy === true  ? "First pregnancy" : p.is_first_pregnancy === false ? "Has had previous pregnancy" : null,
      p.blood_group ? `Blood group: ${p.blood_group}` : null,
      p.diet_type   ? `Diet: ${p.diet_type}` : null,
      p.city        ? `City: ${p.city}` : null,
      (p.conditions || []).length  ? `Medical conditions: ${p.conditions.join(", ")}` : null,
      medLines.length ? `Active medicines: ${medLines.join("; ")}` : null,
      hb    ? `Latest HB: ${hb.value} g/dL${hb.value < 11 ? " — below normal range" : ""}` : null,
      tsh   ? `Latest TSH: ${tsh.value} mIU/L${(tsh.value > 4 || tsh.value < 0.1) ? " — outside normal range" : ""}` : null,
      fbg   ? `Fasting blood sugar: ${fbg.value} mg/dL${fbg.value > 95 ? " — above normal range" : ""}` : null,
      ppbg  ? `PP blood sugar: ${ppbg.value} mg/dL${ppbg.value > 140 ? " — above normal range" : ""}` : null,
      extraLines.length ? `Other lab values: ${extraLines.join(", ")}` : null,
      pendingTests.length ? `Tests ordered by doctor (pending): ${pendingTests.join(", ")}` : null,
      p.prior_losses > 0 ? `Prior pregnancy losses: ${p.prior_losses}` : null,
      p.doctor_name ? `Doctor: ${p.doctor_name}${p.clinic_name ? ", " + p.clinic_name : ""}` : null,
    ].filter(Boolean);

    return { context_summary: parts.join("\n"), flags };
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);

  try {
    const { messages, system, max_tokens } = req.body;

    let enrichedSystem = system || "";
    if (user) {
      const ctx = await loadHealthContext(user.id);
      if (ctx?.context_summary && system) {
        enrichedSystem = `${system}

Her personal health context (use this to personalise your response — do not mention these details unless directly relevant):
${ctx.context_summary}
${ctx.flags?.includes("prior_loss") ? "\nIMPORTANT: She has had a prior pregnancy loss. Be especially gentle." : ""}
${ctx.flags?.includes("low_hb") ? "\nNote: Her haemoglobin is below typical range." : ""}
${ctx.flags?.includes("thyroid") || ctx.flags?.includes("thyroid_flag") ? "\nNote: She has a thyroid condition." : ""}`;
      }
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: max_tokens || 600,
      system: enrichedSystem,
      messages,
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
