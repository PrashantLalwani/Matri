import { createClient } from "@supabase/supabase-js";

// Uses service role key — server-side only, never exposed to client
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

  const { prescription_id } = req.body;
  if (!prescription_id) return res.status(400).json({ error: "Missing prescription_id" });

  try {
    // 1. Verify the prescription belongs to this user (fetch full row including medicines)
    const { data: rx_full, error: rxErr } = await supabase
      .from("prescriptions")
      .select("id, user_id, file_url, medicines")
      .eq("id", prescription_id)
      .eq("user_id", user.id)
      .single();

    if (rxErr || !rx_full) {
      return res.status(404).json({ error: "Prescription not found or not yours" });
    }
    const rx = rx_full; // alias for file_url access below

    // 2. Delete from medicines table (prescription_id FK)
    await supabase.from("medicines")
      .delete()
      .eq("prescription_id", prescription_id)
      .eq("user_id", user.id);

    // 3. Delete from test_orders table
    await supabase.from("test_orders")
      .delete()
      .eq("prescription_id", prescription_id)
      .eq("user_id", user.id);

    // 4. Delete from scans table (where prescription created them)
    // scans don't have prescription_id FK in schema, so we skip if not present
    // (only delete scans with a prescription_id if your schema has it)
    try {
      await supabase.from("scans")
        .delete()
        .eq("prescription_id", prescription_id)
        .eq("user_id", user.id);
    } catch { /* column may not exist — safe to skip */ }

    // 5. Delete the prescription row itself
    await supabase.from("prescriptions")
      .delete()
      .eq("id", prescription_id)
      .eq("user_id", user.id);

    // 6. Remove from profile.prescriptions jsonb AND profile.medications jsonb
    const { data: profile } = await supabase
      .from("profiles")
      .select("prescriptions, medications")
      .eq("id", user.id)
      .single();

    const updatedRxList = (profile?.prescriptions || [])
      .filter(entry => entry.id !== prescription_id);

    // Get medicine names from the prescription row itself (fallback for when prescription_id wasn't stored)
    const rxMedicineNames = (rx_full?.medicines || [])
      .map(m => m.name?.toLowerCase?.()?.trim())
      .filter(Boolean);

    // Remove medicines that either:
    // (a) have a matching prescription_id, OR
    // (b) have prescription_id null AND name matches one from this prescription (old entries)
    const updatedMedications = (profile?.medications || []).filter(m => {
      // Handle stringified JSON meds
      let med = m;
    
      try {
        if (typeof med === "string") {
          med = JSON.parse(med);
        }
      } catch {
        med = {};
      }
    
      const medName =
        med?.name?.toLowerCase?.().trim() || "";
    
      // Primary delete path
      if (
        med?.prescription_id &&
        String(med.prescription_id) === String(prescription_id)
      ) {
        return false;
      }
    
      // Backward compatibility for older meds
      if (
        !med?.prescription_id &&
        rxMedicineNames.some(
          rxName =>
            rxName?.toLowerCase?.().trim() === medName
        )
      ) {
        return false;
      }
    
      return true;
    });

    await supabase.from("profiles")
      .update({
        prescriptions: updatedRxList,
        medications: updatedMedications,
      })
      .eq("id", user.id);

    // 7. Delete the file from storage if we have a URL
    if (rx.file_url) {
      try {
        // Extract bucket + path from the public URL
        const urlParts = rx.file_url.split("/storage/v1/object/public/");
        if (urlParts[1]) {
          const [bucket, ...pathParts] = urlParts[1].split("/");
          const filePath = pathParts.join("/");
          await supabase.storage.from(bucket).remove([filePath]);
        }
      } catch { /* Storage deletion best-effort */ }
    }

    // 8. Invalidate health_insights cache so it gets rebuilt fresh next time
    await supabase.from("health_insights")
      .update({ updated_at: new Date(0).toISOString() }) // set to epoch = stale
      .eq("user_id", user.id);

    // 9. Trigger fresh health context rebuild
    await refreshHealthContext(user.id);

    return res.status(200).json({ success: true, deleted_id: prescription_id });

  } catch (err) {
    console.error("Prescription delete error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// Inline health context refresh (same logic as infer.js)
async function refreshHealthContext(userId) {
  try {
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", userId).single();
    const { data: medicines } = await supabase
      .from("medicines").select("*").eq("user_id", userId).eq("active", true);
    const { data: testOrders } = await supabase
      .from("test_orders").select("*").eq("user_id", userId).eq("status", "ordered");

    const p = profile || {};
    const ld = p.lab_data || {};
    const latest = arr => arr?.slice(-1)[0];
    const hb = latest(ld.hemoglobin);
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
      hb ? `HB ${hb.value} g/dL` : null,
      tsh ? `TSH ${tsh.value} mIU/L` : null,
      sugar ? `blood sugar fasting ${sugar.value} mg/dL` : null,
      p.blood_group ? `blood group ${p.blood_group}` : null,
    ].filter(Boolean);

    await supabase.from("health_insights").upsert({
      user_id: userId,
      updated_at: new Date().toISOString(),
      context_summary: parts.join(". "),
      flags,
      doctor_prep_items: [],
    }, { onConflict: "user_id" });

  } catch (e) {
    console.warn("Health context refresh failed:", e.message);
  }
}
