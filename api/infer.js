import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Name aliases for core lab tests — extras matching any of these are duplicates and should be skipped
const CORE_ALIASES = {
  hemoglobin:           ["hemoglobin","haemoglobin","hb","hgb","hb level","haemoglobin level"],
  tsh:                  ["tsh","thyroid stimulating hormone","thyroid","t3","t4","thyroid profile"],
  blood_sugar_fasting:  ["blood sugar fasting","blood sugar (f)","blood glucose fasting","fbs","fasting blood sugar",
                         "fasting blood glucose","blood glucose fasting (fbs)","fasting sugar","fasting glucose","fbg",
                         "blood sugar f","glucose fasting"],
  blood_sugar_pp:       ["blood sugar pp","blood sugar (pp)","postprandial blood sugar","pp blood sugar",
                         "post prandial","ppbs","blood sugar post prandial","2hr pp","2 hr pp","post-prandial glucose",
                         "blood glucose pp"],
};

function isCoreAlias(extraName) {
  const n = (extraName || "").toLowerCase().trim();
  return Object.values(CORE_ALIASES).some(aliases => aliases.some(a => n.includes(a) || a.includes(n)));
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── PROMPTS (server-side, never exposed to client) ───────────────────────────

const PROMPTS = {
  prescription: `You are a medical data extractor for a pregnancy app. Your job is to carefully extract ALL information from this prescription — whether handwritten or printed.

IMPORTANT INSTRUCTIONS:
- Inspect the prescription multiple times before responding
- Look for each category separately and exhaustively
- Handwriting is expected and common — include your best interpretation even if unclear
- Never omit something because you are uncertain — include it with low_confidence: true instead
- Indian prescription conventions: medicines often written as generic names, frequency as 1-0-1 notation, tests abbreviated

Extract EVERY piece of information across these 7 categories:

Return ONLY a JSON object with these exact fields:
{
  "doctor_name": "string or null",
  "clinic_name": "string or null",
  "prescribed_date": "YYYY-MM-DD or null",
  "follow_up_date": "YYYY-MM-DD or null",

  "medicines": [
    {
      "name": "medicine name — use full name if possible",
      "dosage": "e.g. 500mg, 75mcg",
      "frequency": "e.g. 1-0-1, twice daily after meals, OD",
      "duration": "e.g. 30 days, ongoing, till next visit",
      "notes": "special instructions e.g. empty stomach, with milk, avoid sun",
      "low_confidence": false
    }
  ],

  "tests_ordered": [
    {
      "name": "test name e.g. TSH, HB, CBC, urine routine, blood sugar",
      "due_date": "YYYY-MM-DD or null",
      "notes": "e.g. fasting, repeat after 4 weeks",
      "low_confidence": false
    }
  ],

  "scans_advised": [
    {
      "type": "e.g. NT scan, dating scan, anomaly scan, growth scan, TVS",
      "date": "YYYY-MM-DD or null",
      "week": "e.g. week 12 or null",
      "notes": "any notes",
      "low_confidence": false
    }
  ],

  "diet_instructions": [
    "e.g. avoid spicy food", "eat small meals every 2 hours", "increase iron-rich foods", "avoid raw papaya"
  ],

  "monitoring_instructions": [
    "e.g. check BP weekly", "repeat HB after 4 weeks", "track fetal movements from week 28", "weigh yourself daily"
  ],

  "doctor_advice": [
    "e.g. rest for 2 days", "avoid intercourse", "come immediately if bleeding", "take folic acid daily"
  ],

  "summary": "2-3 warm plain-language sentences summarising this prescription for a pregnant woman. Focus on what she needs to do. Mention the most important medicine and any tests or scans due. Do not use medical jargon."
}

No markdown, pure JSON only. If a category has no entries, return an empty array [].`,

  lab_report: `You are a medical data extractor for a pregnancy app. Extract ALL lab values from this report.

Return ONLY a JSON object:
{
  "report_date": "YYYY-MM-DD or today if not found",
  "hemoglobin": number or null,
  "tsh": number or null,
  "blood_sugar_fasting": number or null,
  "blood_sugar_pp": number or null,
  "blood_group": "e.g. A+ or null",
  "rh_factor": "positive or negative or null",
  "extras": [
    {"name": "test name", "value": number, "unit": "unit string"}
  ],
  "summary": "2-3 sentences in warm plain language. Do not use words like 'low', 'high', 'abnormal', 'normal'. Instead say things like 'based on typical pregnancy ranges, your haemoglobin is slightly below where most doctors like to see it — worth a conversation at your next visit'. Never give a verdict. Always end with 'refer to your doctor for exact guidance'."
}

No markdown, pure JSON only.`,

  scan: `You are a medical data extractor for a pregnancy app. Extract findings from this scan report or image.

Return ONLY a JSON object:
{
  "scan_date": "YYYY-MM-DD or null",
  "scan_type": "dating|nt|anomaly|growth|doppler|other",
  "week_number": number or null,
  "findings": {
    "heartbeat_bpm": number or null,
    "weight_grams": number or null,
    "crl_mm": number or null,
    "position": "cephalic|breech|transverse or null",
    "placenta_position": "string or null",
    "fluid_level": "normal|low|high or null",
    "nt_measurement": number or null,
    "notes": "any findings in plain language"
  },
  "summary": "2-3 warm sentences about the scan findings. Never use alarming language. If something needs attention, say 'worth discussing with your doctor'. End with a warm note about the baby."
}

No markdown, pure JSON only.`
};

// ── AUTH HELPER ──────────────────────────────────────────────────────────────
async function getUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ── UPLOAD FILE TO SUPABASE STORAGE ─────────────────────────────────────────
async function uploadFile(userId, type, fileBase64, mimeType, fileName) {
  const bucket = type === "prescription" ? "prescriptions"
    : type === "lab_report" ? "lab-reports"
    : "scans";

  const ext = mimeType === "application/pdf" ? "pdf"
    : mimeType.includes("png") ? "png" : "jpg";

  const path = `${userId}/${Date.now()}_${fileName || `upload.${ext}`}`;
  const buffer = Buffer.from(fileBase64, "base64");

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { type, fileBase64, mimeType, fileName, week } = req.body;

  if (!type || !fileBase64 || !mimeType) {
    return res.status(400).json({ error: "Missing required fields: type, fileBase64, mimeType" });
  }

  if (!PROMPTS[type]) {
    return res.status(400).json({ error: `Unknown type: ${type}` });
  }

  try {
    // 1. Upload file to Supabase Storage
    let fileUrl = null;
    try {
      fileUrl = await uploadFile(user.id, type, fileBase64, mimeType, fileName);
    } catch (e) {
      console.warn("Storage upload failed, continuing without file URL:", e.message);
    }

    // 2. Record upload in DB
    const { data: upload } = await supabase
      .from("uploads")
      .insert({
        user_id: user.id,
        type,
        file_url: fileUrl,
        file_name: fileName,
        week_number: week || null,
        processed: false,
      })
      .select()
      .single();

    // 3. Call AI to infer from document
    const isImage = mimeType.startsWith("image/");
    const content = isImage ? [
      { type: "image", source: { type: "base64", media_type: mimeType, data: fileBase64 } },
      { type: "text", text: PROMPTS[type] }
    ] : [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } },
      { type: "text", text: PROMPTS[type] }
    ];

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content }],
    });

    const rawText = aiResponse.content?.[0]?.text || "{}";
    const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());

    // 4. Mark upload as processed
    if (upload?.id) {
      await supabase.from("uploads")
        .update({ processed: true, raw_ai_response: rawText })
        .eq("id", upload.id);
    }

    // 5. Fan out based on type
    const debugInfo = {};
    if (type === "prescription") {
      // Normalise: support both old field names and new
      const medicines     = parsed.medicines     || [];
      const testsOrdered  = parsed.tests_ordered || [];
      const scansAdvised  = parsed.scans_advised  || parsed.scan_dates || [];
      const dietInstructions      = parsed.diet_instructions      || [];
      const monitoringInstructions = parsed.monitoring_instructions || [];
      const doctorAdvice  = parsed.doctor_advice  || (parsed.instructions ? [parsed.instructions] : []);

      // Save prescription record
      const { data: rx } = await supabase.from("prescriptions").insert({
        user_id: user.id,
        upload_id: upload?.id,
        file_url: fileUrl,
        doctor_name: parsed.doctor_name,
        clinic_name: parsed.clinic_name,
        prescribed_date: parsed.prescribed_date,
        follow_up_date: parsed.follow_up_date,
        week_number: week,
        medicines,
        scan_dates: scansAdvised,
        tests_ordered: testsOrdered,
        diet_instructions: dietInstructions,
        monitoring_instructions: monitoringInstructions,
        doctor_advice: doctorAdvice,
        summary: parsed.summary,
      }).select().single();

      // Fetch existing records to deduplicate against (each query is isolated — a table error won't abort the whole upload)
      const [medsRes, testsRes, scansRes] = await Promise.all([
        supabase.from("medicines").select("id, name").eq("user_id", user.id),
        supabase.from("test_orders").select("id, test_name").eq("user_id", user.id).eq("status", "ordered"),
        supabase.from("scans").select("id, scan_type, scan_date").eq("user_id", user.id),
      ]);
      if (medsRes.error)   console.warn("medicines dedup fetch:", medsRes.error.message);
      if (testsRes.error)  console.warn("test_orders dedup fetch:", testsRes.error.message);
      if (scansRes.error)  console.warn("scans dedup fetch:", scansRes.error.message);
      const existingMedRows  = medsRes.data  || [];
      const existingTestRows = testsRes.data || [];
      const existingScanRows = scansRes.data || [];

      const existingMedMap = new Map(
        (existingMedRows || []).map(m => [m.name?.toLowerCase().trim() || "", m.id])
      );
      const existingTestNames = new Set(
        (existingTestRows || []).map(t => t.test_name?.toLowerCase().trim() || "")
      );

      // Split medicines into new inserts vs updates on existing rows
      const medsToInsert = [];
      const medsToUpdate = [];
      const seenMedNames = new Set();

      for (const m of medicines) {
        const key = m.name?.toLowerCase().trim() || "";
        if (!key || seenMedNames.has(key)) continue;
        seenMedNames.add(key);
        const existingId = existingMedMap.get(key);
        if (existingId) {
          medsToUpdate.push({ id: existingId, m });
        } else {
          medsToInsert.push(m);
        }
      }

      if (medsToInsert.length && rx?.id) {
        await supabase.from("medicines").insert(
          medsToInsert.map(m => ({
            user_id: user.id,
            prescription_id: rx.id,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            notes: m.notes,
            active: true,
            low_confidence: m.low_confidence || false,
            start_date: parsed.prescribed_date || null,
          }))
        );
      }

      // Update existing medicine rows with latest prescription data (re-activates paused ones too)
      for (const { id, m } of medsToUpdate) {
        await supabase.from("medicines").update({
          prescription_id: rx?.id,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          notes: m.notes,
          active: true,
          low_confidence: m.low_confidence || false,
          start_date: parsed.prescribed_date || null,
        }).eq("id", id);
      }

      // Insert only test orders that aren't already pending
      const newTests = testsOrdered.filter(
        t => !existingTestNames.has(t.name?.toLowerCase().trim() || "")
      );
      console.log(`[infer] prescription: AI extracted ${testsOrdered.length} tests, ${existingTestNames.size} already exist, inserting ${newTests.length}`);
      if (testsOrdered.length === 0) {
        console.log("[infer] AI returned no tests_ordered — raw parsed keys:", Object.keys(parsed));
      }
      debugInfo.tests_extracted = testsOrdered.length;
      debugInfo.tests_names     = testsOrdered.map(t => t.name);
      if (newTests.length && rx?.id) {
        const { error: testInsertErr } = await supabase.from("test_orders").insert(
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
        if (testInsertErr) {
          console.error("[infer] test_orders insert failed:", testInsertErr.message, testInsertErr.details);
        } else {
          debugInfo.tests_inserted = newTests.length;
          console.log(`[infer] inserted ${newTests.length} test_orders rows`);
        }
      }

      // Insert only scans that don't already exist (matched by type + date)
      const normScanType = s => s.type?.toLowerCase().includes("nt") ? "nt"
        : s.type?.toLowerCase().includes("anomaly") ? "anomaly"
        : s.type?.toLowerCase().includes("dating") ? "dating"
        : s.type?.toLowerCase().includes("growth") ? "growth"
        : s.type?.toLowerCase().includes("tvs") ? "dating" : "other";

      const newScans = scansAdvised.filter(s => {
        const t = normScanType(s);
        const d = s.date || null;
        return !(existingScanRows || []).some(e => e.scan_type === t && e.scan_date === d);
      });
      if (newScans.length && rx?.id) {
        await supabase.from("scans").insert(
          newScans.map(s => ({
            user_id: user.id,
            scan_date: s.date || null,
            scan_type: normScanType(s),
            week_number: week,
            findings: { notes: s.notes },
            ai_summary: s.notes,
          }))
        );
      }

      // Update profile prescriptions list AND medications jsonb
      const { data: profile } = await supabase
        .from("profiles").select("prescriptions, medications").eq("id", user.id).single();

      const existingRxList = profile?.prescriptions || [];
      const newRxEntry = {
        id: rx?.id,
        date: parsed.prescribed_date,
        follow_up_date: parsed.follow_up_date,
        doctor: parsed.doctor_name,
        clinic: parsed.clinic_name,
        file_url: fileUrl,
        summary: parsed.summary,
        medicine_count: medicines.length,
        test_count: testsOrdered.length,
        scan_count: scansAdvised.length,
      };

      // Merge medicines into profile.medications — update existing entries, add new ones
      const existingProfileMeds = profile?.medications || [];
      const profileMedIndexMap = new Map(
        existingProfileMeds.map((m, i) => [
          (typeof m === "object" ? m.name : m)?.toLowerCase?.().trim() || "", i
        ])
      );
      const updatedMedications = [...existingProfileMeds];

      for (const m of medicines) {
        const key = m.name?.toLowerCase().trim() || "";
        if (!key) continue;
        const idx = profileMedIndexMap.get(key);
        if (idx !== undefined) {
          // Update existing entry with latest dosage/frequency from this prescription
          updatedMedications[idx] = {
            ...updatedMedications[idx],
            dosage: m.dosage || updatedMedications[idx]?.dosage || "",
            frequency: m.frequency || updatedMedications[idx]?.frequency || "",
            duration: m.duration || updatedMedications[idx]?.duration || "",
            notes: m.notes || updatedMedications[idx]?.notes || "",
            prescription_id: rx?.id ?? updatedMedications[idx]?.prescription_id,
            active: true,
          };
        } else {
          updatedMedications.push({
            name: m.name,
            dosage: m.dosage || "",
            frequency: m.frequency || "",
            duration: m.duration || "",
            notes: m.notes || "",
            active: true,
            paused: false,
            pause_reason: null,
            prescription_id: rx?.id || null,
            low_confidence: m.low_confidence || false,
          });
          profileMedIndexMap.set(key, updatedMedications.length - 1);
        }
      }

      await supabase.from("profiles")
        .update({
          prescriptions: [...existingRxList, newRxEntry],
          medications: updatedMedications,
        })
        .eq("id", user.id);

    } else if (type === "lab_report") {
      // Merge into lab_data timeline
      const { data: profile } = await supabase
        .from("profiles")
        .select("lab_data, lab_extras_v2, blood_group")
        .eq("id", user.id).single();

      const rDate = parsed.report_date || new Date().toISOString().split("T")[0];
      const ld = profile?.lab_data || {};
      const CORE = ["hemoglobin", "tsh", "blood_sugar_fasting", "blood_sugar_pp"];
      const updates = {};

      CORE.forEach(k => {
        if (parsed[k] != null) {
          const arr = ld[k] || [];
          if (!arr.some(e => e.date === rDate)) {
            updates[k] = [...arr, { value: parsed[k], date: rDate }]
              .sort((a, b) => a.date.localeCompare(b.date));
          }
        }
      });

      const newExtras = { ...(profile?.lab_extras_v2 || {}) };
      (parsed.extras || []).forEach(ex => {
        if (isCoreAlias(ex.name)) return; // skip — already captured as a core test
        const arr = newExtras[ex.name]?.entries || [];
        if (!arr.some(e => e.date === rDate)) {
          newExtras[ex.name] = {
            unit: ex.unit || newExtras[ex.name]?.unit || "",
            entries: [...arr, { value: ex.value, date: rDate }]
              .sort((a, b) => a.date.localeCompare(b.date)),
          };
        }
      });

      await supabase.from("profiles").update({
        lab_data: { ...ld, ...updates },
        lab_extras_v2: newExtras,
        ...(parsed.blood_group && !profile?.blood_group ? { blood_group: parsed.blood_group } : {}),
      }).eq("id", user.id);

      // If uploaded against a specific test order, mark it completed and store report data
      const { test_order_id } = req.body;
      if (test_order_id) {
        // First mark status=completed (works even before migration)
        const { error: statusErr } = await supabase.from("test_orders")
          .update({ status: "completed" })
          .eq("id", test_order_id)
          .eq("user_id", user.id);
        if (statusErr) console.error("test_order status update failed:", statusErr.message);

        // Then try to store report data (requires migration — fails gracefully if columns absent)
        const { error: reportErr } = await supabase.from("test_orders")
          .update({
            file_url: fileUrl,
            report_summary: parsed.summary || null,
            extracted_values: {
              hemoglobin:          parsed.hemoglobin          ?? null,
              tsh:                 parsed.tsh                 ?? null,
              blood_sugar_fasting: parsed.blood_sugar_fasting ?? null,
              blood_sugar_pp:      parsed.blood_sugar_pp      ?? null,
              blood_group:         parsed.blood_group         ?? null,
              extras:              parsed.extras              || [],
              report_date:         parsed.report_date         || rDate,
            },
          })
          .eq("id", test_order_id)
          .eq("user_id", user.id);
        if (reportErr) console.warn("test_order report fields update failed (run supabase-migrations.sql):", reportErr.message);
      }

    } else if (type === "scan") {
      await supabase.from("scans").insert({
        user_id: user.id,
        upload_id: upload?.id,
        scan_date: parsed.scan_date,
        scan_type: parsed.scan_type || "other",
        week_number: parsed.week_number || week,
        findings: parsed.findings,
        image_url: fileUrl,
        ai_summary: parsed.summary,
      });
    }

    // 6. Trigger health context refresh
    await refreshHealthContext(user.id);

    return res.status(200).json({
      success: true,
      type,
      parsed,
      upload_id: upload?.id,
      prescription_id: type === "prescription" ? (await supabase.from("prescriptions").select("id").eq("upload_id", upload?.id).single())?.data?.id : null,
      _debug: Object.keys(debugInfo).length ? debugInfo : undefined,
    });

  } catch (err) {
    console.error("Infer error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ── HEALTH CONTEXT REFRESH ───────────────────────────────────────────────────
async function refreshHealthContext(userId) {
  try {
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", userId).single();
    const { data: medicines } = await supabase
      .from("medicines").select("*").eq("user_id", userId).eq("active", true);
    const { data: testOrders } = await supabase
      .from("test_orders").select("*").eq("user_id", userId).eq("status", "ordered");
    const { data: scans } = await supabase
      .from("scans").select("*").eq("user_id", userId).order("scan_date", { ascending: false }).limit(5);

    const p = profile || {};
    const ld = p.lab_data || {};
    const latest = arr => arr?.slice(-1)[0];

    const hb = latest(ld.hemoglobin);
    const tsh = latest(ld.tsh);
    const sugar = latest(ld.blood_sugar_fasting);

    // Build flags
    const flags = [];
    if (hb?.value < 11) flags.push("low_hb");
    if (tsh?.value > 4 || tsh?.value < 0.1) flags.push("thyroid_flag");
    if ((p.conditions || []).includes("thyroid")) flags.push("thyroid");
    if ((p.conditions || []).includes("diabetes")) flags.push("diabetes");
    if ((p.conditions || []).includes("hypertension")) flags.push("hypertension");
    if (p.is_first_pregnancy) flags.push("first_pregnancy");
    if ((p.prior_losses || 0) > 0) flags.push("prior_loss");

    // Build context summary
    const week = p.due_date
      ? Math.round(40 - (new Date(p.due_date) - new Date()) / (7 * 24 * 60 * 60 * 1000))
      : null;

    const parts = [
      week ? `Week ${week} pregnancy` : null,
      p.is_first_pregnancy ? "first pregnancy" : p.is_first_pregnancy === false ? "not first pregnancy" : null,
      p.diet_type ? `${p.diet_type} diet` : null,
      (p.conditions || []).length ? `conditions: ${p.conditions.join(", ")}` : null,
      (medicines || []).length ? `active medicines: ${medicines.map(m => `${m.name}${m.dosage ? " " + m.dosage : ""}`).join(", ")}` : null,
      hb ? `HB ${hb.value} g/dL${hb.value < 11 ? " (below typical range)" : ""}` : null,
      tsh ? `TSH ${tsh.value} mIU/L` : null,
      sugar ? `blood sugar fasting ${sugar.value} mg/dL` : null,
      p.blood_group ? `blood group ${p.blood_group}` : null,
      p.prior_losses > 0 ? `${p.prior_losses} prior pregnancy loss` : null,
      p.doctor_name ? `doctor: ${p.doctor_name}` : null,
      p.next_appointment_date
        ? `next appointment: ${new Date(p.next_appointment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
        : null,
      (testOrders || []).length ? `tests ordered but not done: ${testOrders.map(t => t.test_name).join(", ")}` : null,
    ].filter(Boolean);

    const summary = parts.join(". ");

    // Build doctor prep items
    const doctorPrep = [];
    if (hb?.value < 11) doctorPrep.push({ text: "HB below typical range — discuss iron levels", priority: "high" });
    if (tsh?.value > 4) doctorPrep.push({ text: "TSH slightly elevated — discuss thyroid levels", priority: "high" });
    if ((testOrders || []).length) {
      testOrders.slice(0, 3).forEach(t =>
        doctorPrep.push({ text: `${t.test_name} ordered — check if done`, priority: "medium" })
      );
    }
    if (p.next_appointment_date) {
      const daysLeft = Math.ceil((new Date(p.next_appointment_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft >= 0) {
        doctorPrep.push({ text: `Appointment in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — review this list`, priority: "high" });
      }
    }

    // Upsert health insights
    await supabase.from("health_insights").upsert({
      user_id: userId,
      updated_at: new Date().toISOString(),
      context_summary: summary,
      flags,
      doctor_prep_items: doctorPrep,
      raw_health_snapshot: { profile: p, medicines, testOrders, scans },
    }, { onConflict: "user_id" });

  } catch (e) {
    console.warn("Health context refresh failed:", e.message);
  }
}
