// Extras whose names are variants of a core lab test should not be saved as separate rows
export const CORE_LAB_ALIASES = [
  ["hemoglobin","haemoglobin","hb","hgb","hb level"],
  ["tsh","thyroid stimulating hormone","thyroid"],
  ["blood sugar fasting","blood sugar (f)","blood glucose fasting","fbs","fasting blood sugar",
   "fasting blood glucose","blood glucose fasting (fbs)","fasting sugar","fasting glucose","fbg","blood sugar f","glucose fasting"],
  ["blood sugar pp","blood sugar (pp)","postprandial blood sugar","pp blood sugar","post prandial",
   "ppbs","blood sugar post prandial","2hr pp","2 hr pp","post-prandial glucose","blood glucose pp"],
];
export function isCoreLabAlias(name) {
  const n = (name || "").toLowerCase().trim();
  return CORE_LAB_ALIASES.some(group => group.some(a => n.includes(a) || a.includes(n)));
}

// Safely parse a medicine entry regardless of whether it's a string or object
export function parseMed(m) {
  if (!m) return { name: "Unknown", dosage: "", frequency: "", duration: "", notes: "", active: true, paused: false, pause_reason: null };
  if (typeof m === "string") {
    try { return parseMed(JSON.parse(m)); } catch {}
    return { name: m, dosage: "", frequency: "", duration: "", notes: "", active: true, paused: false, pause_reason: null };
  }
  return {
    name:         m.name         || m.medicine || m.drug || "Unknown",
    dosage:       m.dosage       || m.dose     || "",
    frequency:    m.frequency    || m.freq     || "",
    duration:     m.duration     || m.days     || "",
    notes:        m.notes        || m.instruction || "",
    active:       m.active !== false,
    paused:       m.paused === true,
    pause_reason: m.pause_reason || null,
  };
}

// Convert pharmacy notation to human schedule
// "1-0-0" → "Once daily · Morning"
// "1-1-1" → "Three times daily · Morning, Afternoon & Night"
// "1-0-1" → "Twice daily · Morning & Night"
// "0-0-1" → "Once daily · Night"
export function humanSchedule(frequency) {
  if (!frequency) return null;

  // Parse X-X-X pattern
  const match = frequency.match(/(\d+)-(\d+)-(\d+)/);
  if (match) {
    const [, m, a, n] = match.map(Number);
    const slots = [];
    if (m) slots.push("Morning");
    if (a) slots.push("Afternoon");
    if (n) slots.push("Night");
    const total = m + a + n;
    const timesLabel = total === 1 ? "Once daily" : total === 2 ? "Twice daily" : total === 3 ? "Three times daily" : `${total}x daily`;
    const when = slots.length === 1 ? slots[0] : slots.slice(0, -1).join(", ") + " & " + slots[slots.length - 1];
    return { times: timesLabel, when };
  }

  // Already human readable — just clean it up
  const lower = frequency.toLowerCase();
  if (lower.includes("once") || lower.includes("od") || lower.includes("1-0-0") || lower.includes("0-0-1"))
    return { times: "Once daily", when: lower.includes("night") || lower.includes("0-0-1") ? "Night" : "Morning" };
  if (lower.includes("twice") || lower.includes("bd") || lower.includes("bid"))
    return { times: "Twice daily", when: "Morning & Night" };
  if (lower.includes("three") || lower.includes("tds") || lower.includes("tid"))
    return { times: "Three times daily", when: "Morning, Afternoon & Night" };
  if (lower.includes("four") || lower.includes("qid"))
    return { times: "Four times daily", when: "Every 6 hours" };

  // Return as-is if we can't parse
  return { times: frequency, when: null };
}

// Meal timing extraction
export function mealTiming(med) {
  const text = `${med.frequency || ""} ${med.notes || ""}`.toLowerCase();
  if (text.includes("before food") || text.includes("empty stomach")) return "Before meals";
  if (text.includes("after food") || text.includes("with food")) return "After meals";
  if (text.includes("with milk")) return "With milk";
  return null;
}
