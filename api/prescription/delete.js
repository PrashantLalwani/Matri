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
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS,DELETE');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');if(req.method==='OPTIONS'){res.status(200).end();return;}
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { prescription_id } = req.body;
  if (!prescription_id) return res.status(400).json({ error: "Missing prescription_id" });

  try {
    // 1. Verify the prescription belongs to this user (fetch full row including medicines + scan_dates)
    const { data: rx_full, error: rxErr } = await supabase
      .from("prescriptions")
      .select("id, user_id, file_url, medicines, scan_dates, follow_up_date")
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

    // 4. Delete from scans table — FK path for new rows, type+date fallback for pre-migration rows
    await supabase.from("scans")
      .delete()
      .eq("prescription_id", prescription_id)
      .eq("user_id", user.id);

    const normScanType = s => {
      const l = (s.type || "").toLowerCase();
      return l.includes("nt") || l.includes("nuchal") ? "nt"
        : l.includes("anomaly") || l.includes("anatomy") ? "anomaly"
        : l.includes("dating") ? "dating"
        : l.includes("growth") ? "growth"
        : l.includes("tvs") ? "dating" : "other";
    };
    for (const s of (rx_full.scan_dates || [])) {
      const q = supabase.from("scans")
        .delete()
        .eq("user_id", user.id)
        .eq("scan_type", normScanType(s))
        .is("prescription_id", null);
      await (s.date ? q.eq("scan_date", s.date) : q.is("scan_date", null));
    }

    // 5. Delete the prescription row itself
    await supabase.from("prescriptions")
      .delete()
      .eq("id", prescription_id)
      .eq("user_id", user.id);

    // 6. Remove from profile.prescriptions jsonb AND profile.medications jsonb
    const { data: profile } = await supabase
      .from("profiles")
      .select("prescriptions, medications, next_appointment_date")
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

    // Re-derive doctor info + next_appointment_date from remaining prescriptions.
    // Always recalculate so deleted prescription data is never left orphaned on the profile.
    const { data: remainingRx } = await supabase
      .from("prescriptions")
      .select("follow_up_date, doctor_name, clinic_name, prescribed_date")
      .eq("user_id", user.id)
      .order("prescribed_date", { ascending: false });

    const nextApptDate = remainingRx?.find(r => r.follow_up_date)?.follow_up_date || null;
    const latestWithDoctor = remainingRx?.find(r => r.doctor_name) || null;

    await supabase.from("profiles")
      .update({
        prescriptions: updatedRxList,
        medications: updatedMedications,
        next_appointment_date: nextApptDate,
        doctor_name: latestWithDoctor?.doctor_name || null,
        clinic_name: latestWithDoctor?.clinic_name || null,
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

    // 8. Bust the health_insights cache — the next GET to /api/health-context
    //    will call buildFreshContext and read the already-updated profile.
    await supabase.from("health_insights")
      .update({ updated_at: new Date(0).toISOString() })
      .eq("user_id", user.id);

    return res.status(200).json({ success: true, deleted_id: prescription_id });

  } catch (err) {
    console.error("Prescription delete error:", err);
    return res.status(500).json({ error: err.message });
  }
}

