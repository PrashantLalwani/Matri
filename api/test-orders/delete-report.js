import { createClient } from "@supabase/supabase-js";

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

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { test_order_id } = req.body;
  if (!test_order_id) return res.status(400).json({ error: "Missing test_order_id" });

  // Fetch the test order (security: must belong to this user)
  const { data: order, error: fetchErr } = await supabase
    .from("test_orders")
    .select("*")
    .eq("id", test_order_id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !order) return res.status(404).json({ error: "Test order not found" });

  const reportDate = order.extracted_values?.report_date || null;

  // 1. Delete file from storage (best-effort)
  if (order.file_url) {
    try {
      const match = order.file_url.match(/\/storage\/v1\/object\/(?:public\/)?([^/?]+)\/(.+?)(\?.*)?$/);
      if (match) {
        const [, bucket, filePath] = match;
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (e) {
      console.warn("Storage delete failed (non-fatal):", e.message);
    }
  }

  // 2. Reset test_order back to "ordered", clear report fields
  const { error: resetErr } = await supabase
    .from("test_orders")
    .update({
      status: "ordered",
      file_url: null,
      report_summary: null,
      extracted_values: null,
    })
    .eq("id", test_order_id)
    .eq("user_id", user.id);

  if (resetErr) return res.status(500).json({ error: resetErr.message });

  // 3. Remove lab values that came from this report
  // Strategy: match by date (primary) OR by extracted value (fallback for date mismatches)
  const ev = order.extracted_values || {};
  const coreExtractedValues = {
    hemoglobin:           ev.hemoglobin,
    tsh:                  ev.tsh,
    blood_sugar_fasting:  ev.blood_sugar_fasting,
    blood_sugar_pp:       ev.blood_sugar_pp,
  };
  // Build a map of extra name → extracted value for value-based fallback
  const extraExtractedValues = {};
  (ev.extras || []).forEach(ex => { if (ex.name) extraExtractedValues[ex.name] = ex.value; });

  const shouldRemoveEntry = (entry, extractedValue) => {
    if (reportDate && entry.date === reportDate) return true;
    // Fallback: remove if the value exactly matches what was extracted from this report
    if (extractedValue != null && entry.value === extractedValue) return true;
    return false;
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("lab_data, lab_extras_v2")
    .eq("id", user.id)
    .single();

  if (profile) {
    const ld = profile.lab_data || {};
    const updatedLd = {};
    for (const [key, entries] of Object.entries(ld)) {
      updatedLd[key] = (entries || []).filter(e => !shouldRemoveEntry(e, coreExtractedValues[key]));
    }

    const le = profile.lab_extras_v2 || {};
    const updatedLe = {};
    for (const [name, data] of Object.entries(le)) {
      const filtered = (data.entries || []).filter(e => !shouldRemoveEntry(e, extraExtractedValues[name]));
      if (filtered.length > 0) {
        updatedLe[name] = { ...data, entries: filtered };
      }
      // Key dropped entirely when empty — no ghost rows
    }

    await supabase
      .from("profiles")
      .update({ lab_data: updatedLd, lab_extras_v2: updatedLe })
      .eq("id", user.id);
  }

  // 4. Refresh health context so AI no longer sees stale values
  try {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const { data: medicines } = await supabase.from("medicines").select("*").eq("user_id", user.id).eq("active", true);
    const p = profile || {};
    const ld = p.lab_data || {};
    const latest = arr => arr?.slice(-1)[0];
    const hb  = latest(ld.hemoglobin);
    const tsh = latest(ld.tsh);
    const sugar = latest(ld.blood_sugar_fasting);
    const flags = [];
    if (hb?.value < 11) flags.push("low_hb");
    if (tsh?.value > 4 || tsh?.value < 0.1) flags.push("thyroid_flag");
    if ((p.conditions || []).includes("thyroid")) flags.push("thyroid");
    if (p.prior_losses > 0) flags.push("prior_loss");
    const week = p.due_date
      ? Math.round(40 - (new Date(p.due_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))
      : null;
    const parts = [
      week ? `Week ${week} pregnancy` : null,
      (p.conditions || []).length ? `conditions: ${p.conditions.join(", ")}` : null,
      (medicines || []).length ? `active medicines: ${medicines.map(m => m.name).join(", ")}` : null,
      hb    ? `HB ${hb.value} g/dL`           : null,
      tsh   ? `TSH ${tsh.value} mIU/L`         : null,
      sugar ? `blood sugar fasting ${sugar.value} mg/dL` : null,
    ].filter(Boolean);
    await supabase.from("health_insights").upsert({
      user_id: user.id,
      updated_at: new Date().toISOString(),
      context_summary: parts.join(". "),
      flags,
      doctor_prep_items: [],
    }, { onConflict: "user_id" });
  } catch (e) {
    console.warn("Health context refresh failed:", e.message);
  }

  return res.status(200).json({ success: true });
}
