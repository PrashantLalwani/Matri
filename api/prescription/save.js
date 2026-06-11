import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function doctorNamesMatch(a, b) {
  if (!a || !b) return false;
  const tokenize = s => s
    .replace(/^(dr\.?|doctor)\s*/i, '')
    .toLowerCase()
    .split(/[\s,]+/)
    .map(t => t.replace(/\.$/, ''))
    .filter(Boolean);
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (!ta.length || !tb.length) return false;
  const isInitialOf = (t1, t2) => t1.length === 1 && t2.startsWith(t1);
  const tokenMatches = (t1, t2) => t1 === t2 || isInitialOf(t1, t2) || isInitialOf(t2, t1);
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return shorter.every(t => longer.some(lt => tokenMatches(t, lt)));
}

const normScanType = s => s.type?.toLowerCase().includes("nt") ? "nt"
  : s.type?.toLowerCase().includes("anomaly") ? "anomaly"
  : s.type?.toLowerCase().includes("dating") ? "dating"
  : s.type?.toLowerCase().includes("growth") ? "growth"
  : s.type?.toLowerCase().includes("tvs") ? "dating" : "other";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { parsed, fileUrl, uploadId, week, useExtractedDoctor } = req.body;
  if (!parsed) return res.status(400).json({ error: 'Missing parsed data' });

  try {
    const medicines              = parsed.medicines              || [];
    const testsOrdered           = parsed.tests_ordered          || [];
    const scansAdvised           = parsed.scans_advised          || parsed.scan_dates || [];
    const dietInstructions       = parsed.diet_instructions      || [];
    const monitoringInstructions = parsed.monitoring_instructions || [];
    const doctorAdvice           = parsed.doctor_advice          || (parsed.instructions ? [parsed.instructions] : []);

    // Save prescription record
    const { data: rx } = await supabase.from("prescriptions").insert({
      user_id:                 user.id,
      upload_id:               uploadId || null,
      file_url:                fileUrl  || null,
      doctor_name:             parsed.doctor_name,
      clinic_name:             parsed.clinic_name,
      prescribed_date:         parsed.prescribed_date,
      follow_up_date:          parsed.follow_up_date,
      week_number:             week,
      medicines,
      scan_dates:              scansAdvised,
      tests_ordered:           testsOrdered,
      diet_instructions:       dietInstructions,
      monitoring_instructions: monitoringInstructions,
      doctor_advice:           doctorAdvice,
      summary:                 parsed.summary,
      medicine_count:          medicines.length,
      test_count:              testsOrdered.length,
      scan_count:              scansAdvised.length,
    }).select().single();

    // Fetch existing records for deduplication
    const [medsRes, testsRes, scansRes] = await Promise.all([
      supabase.from("medicines").select("id, name").eq("user_id", user.id),
      supabase.from("test_orders").select("id, test_name").eq("user_id", user.id).eq("status", "ordered"),
      supabase.from("scans").select("id, scan_type, scan_date").eq("user_id", user.id),
    ]);
    const existingMedRows  = medsRes.data  || [];
    const existingTestRows = testsRes.data || [];
    const existingScanRows = scansRes.data || [];

    const existingMedMap   = new Map(existingMedRows.map(m => [m.name?.toLowerCase().trim() || "", m.id]));
    const existingTestNames = new Set(existingTestRows.map(t => t.test_name?.toLowerCase().trim() || ""));

    // Medicines: insert new, update existing
    const medsToInsert = [];
    const medsToUpdate = [];
    const seenMedNames = new Set();
    for (const m of medicines) {
      const key = m.name?.toLowerCase().trim() || "";
      if (!key || seenMedNames.has(key)) continue;
      seenMedNames.add(key);
      const existingId = existingMedMap.get(key);
      if (existingId) medsToUpdate.push({ id: existingId, m });
      else medsToInsert.push(m);
    }
    if (medsToInsert.length && rx?.id) {
      await supabase.from("medicines").insert(
        medsToInsert.map(m => ({
          user_id:         user.id,
          prescription_id: rx.id,
          name:            m.name,
          dosage:          m.dosage,
          frequency:       m.frequency,
          duration:        m.duration,
          notes:           m.notes,
          active:          true,
          low_confidence:  m.low_confidence || false,
          start_date:      parsed.prescribed_date || null,
        }))
      );
    }
    for (const { id, m } of medsToUpdate) {
      await supabase.from("medicines").update({
        prescription_id: rx?.id,
        dosage:         m.dosage,
        frequency:      m.frequency,
        duration:       m.duration,
        notes:          m.notes,
        active:         true,
        low_confidence: m.low_confidence || false,
        start_date:     parsed.prescribed_date || null,
      }).eq("id", id);
    }

    // Test orders: insert only new ones
    const newTests = testsOrdered.filter(t => !existingTestNames.has(t.name?.toLowerCase().trim() || ""));
    if (newTests.length && rx?.id) {
      await supabase.from("test_orders").insert(
        newTests.map(t => ({
          user_id:         user.id,
          prescription_id: rx.id,
          test_name:       t.name,
          due_date:        t.due_date || null,
          week_number:     week,
          status:          "ordered",
          notes:           t.notes,
        }))
      );
    }

    // Scans: insert only new ones (dedup by type + date)
    const newScans = scansAdvised.filter(s => {
      const t = normScanType(s);
      const d = s.date || null;
      return !existingScanRows.some(e => e.scan_type === t && e.scan_date === d);
    });
    if (newScans.length && rx?.id) {
      await supabase.from("scans").insert(
        newScans.map(s => ({
          user_id:         user.id,
          prescription_id: rx.id,
          scan_name:       s.type || null,
          scan_date:       s.date || null,
          scan_type:       normScanType(s),
          week_number:     week,
          findings:        { notes: s.notes },
          ai_summary:      s.notes,
          status:          "scheduled",
        }))
      );
    }

    // Update profile: prescriptions list + medications jsonb + optional doctor update
    const { data: profile } = await supabase
      .from("profiles").select("prescriptions, medications, doctor_name, clinic_name").eq("id", user.id).single();

    const existingRxList = profile?.prescriptions || [];
    const newRxEntry = {
      id:             rx?.id,
      date:           parsed.prescribed_date,
      follow_up_date: parsed.follow_up_date,
      doctor:         parsed.doctor_name,
      clinic:         parsed.clinic_name,
      file_url:       fileUrl,
      summary:        parsed.summary,
      medicine_count: medicines.length,
      test_count:     testsOrdered.length,
      scan_count:     scansAdvised.length,
    };

    const existingProfileMeds = profile?.medications || [];
    const profileMedIndexMap  = new Map(
      existingProfileMeds.map((m, i) => [(typeof m === "object" ? m.name : m)?.toLowerCase?.().trim() || "", i])
    );
    const updatedMedications = [...existingProfileMeds];
    for (const m of medicines) {
      const key = m.name?.toLowerCase().trim() || "";
      if (!key) continue;
      const idx = profileMedIndexMap.get(key);
      if (idx !== undefined) {
        updatedMedications[idx] = {
          ...updatedMedications[idx],
          dosage:          m.dosage          || updatedMedications[idx]?.dosage          || "",
          frequency:       m.frequency       || updatedMedications[idx]?.frequency       || "",
          duration:        m.duration        || updatedMedications[idx]?.duration        || "",
          notes:           m.notes           || updatedMedications[idx]?.notes           || "",
          prescription_id: rx?.id            ?? updatedMedications[idx]?.prescription_id,
          active:          true,
        };
      } else {
        updatedMedications.push({
          name: m.name, dosage: m.dosage || "", frequency: m.frequency || "",
          duration: m.duration || "", notes: m.notes || "", active: true,
          paused: false, pause_reason: null,
          prescription_id: rx?.id || null, low_confidence: m.low_confidence || false,
        });
        profileMedIndexMap.set(key, updatedMedications.length - 1);
      }
    }

    const currentDoctor   = profile?.doctor_name?.trim();
    const extractedDoctor = parsed.doctor_name?.trim();
    const mismatch        = currentDoctor && extractedDoctor && !doctorNamesMatch(currentDoctor, extractedDoctor);
    const shouldUpdateDoctor = !mismatch || useExtractedDoctor;

    await supabase.from("profiles").update({
      prescriptions: [...existingRxList, newRxEntry],
      medications:   updatedMedications,
      ...(shouldUpdateDoctor && extractedDoctor  ? { doctor_name: extractedDoctor }    : {}),
      ...(shouldUpdateDoctor && parsed.clinic_name ? { clinic_name: parsed.clinic_name } : {}),
    }).eq("id", user.id);

    return res.status(200).json({ success: true, prescription_id: rx?.id });
  } catch (err) {
    console.error("prescription/save error:", err);
    return res.status(500).json({ error: err.message });
  }
}
