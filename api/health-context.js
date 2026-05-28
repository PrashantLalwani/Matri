import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  try {
    // Try cached insight first
    const { data: insight } = await supabase
      .from("health_insights")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If cache is fresh (< 1 hour old), return it
    if (insight?.updated_at) {
      const age = Date.now() - new Date(insight.updated_at).getTime();
      if (age < 60 * 60 * 1000) {
        return res.status(200).json({
          summary: insight.context_summary,
          flags: insight.flags || [],
          doctorPrep: insight.doctor_prep_items || [],
          insightBullets: insight.insight_bullets || [],
        });
      }
    }

    // Otherwise build fresh
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();
    const { data: medicines } = await supabase
      .from("medicines").select("*").eq("user_id", user.id).eq("active", true);

    const p = profile || {};
    const ld = p.lab_data || {};
    const latest = arr => arr?.slice(-1)[0];
    const hb = latest(ld.hemoglobin);
    const tsh = latest(ld.tsh);
    const sugar = latest(ld.blood_sugar_fasting);

    const week = p.due_date
      ? Math.round(40 - (new Date(p.due_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))
      : 8; // default

    const parts = [
      `Week ${week} pregnancy`,
      p.is_first_pregnancy === true ? "first pregnancy" : p.is_first_pregnancy === false ? "experienced mother" : null,
      p.diet_type ? `${p.diet_type} diet` : null,
      (p.conditions || []).length ? `conditions: ${p.conditions.join(", ")}` : null,
      (medicines || []).length ? `medicines: ${medicines.map(m => `${m.name}${m.dosage ? " " + m.dosage : ""}`).join(", ")}` : null,
      hb ? `HB ${hb.value} g/dL${hb.value < 11 ? " (below typical range — doctor is aware)" : ""}` : null,
      tsh ? `TSH ${tsh.value} mIU/L` : null,
      sugar ? `fasting blood sugar ${sugar.value} mg/dL` : null,
      p.blood_group ? `blood group ${p.blood_group}` : null,
      p.prior_losses > 0 ? `${p.prior_losses} prior pregnancy loss` : null,
      p.next_appointment_date
        ? `next doctor appointment: ${new Date(p.next_appointment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
        : null,
    ].filter(Boolean);

    const flags = [];
    if (hb?.value < 11) flags.push("low_hb");
    if (tsh?.value > 4 || tsh?.value < 0.1) flags.push("thyroid_flag");
    if ((p.conditions || []).includes("thyroid")) flags.push("thyroid");
    if (p.prior_losses > 0) flags.push("prior_loss");
    if (p.conception_type === "ivf") flags.push("ivf");

    return res.status(200).json({
      summary: parts.join(". "),
      flags,
      week,
      doctorPrep: insight?.doctor_prep_items || [],
      insightBullets: insight?.insight_bullets || [],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
