const DOSAGE_RE = /\b\d+(\.\d+)?\s*(mg|mcg|ml|g|iu|units|mmol|meq)\b/gi;

const FORM_WORDS = new Set([
  "tablet", "tab", "tabs", "cap", "caps", "capsule", "capsules",
  "syrup", "drops", "drop", "injection", "inj", "suspension",
  "forte", "plus", "sr", "xr", "er", "cr", "od", "bd", "tds", "qid",
  "oral", "topical", "sachet",
]);

export function normalizeMedicineName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(DOSAGE_RE, "")
    .split(/[\s\/\-]+/)
    .filter(t => t && !FORM_WORDS.has(t))
    .join(" ")
    .trim();
}

export function medicineNamesMatch(a, b) {
  if (!a || !b) return false;
  const na = normalizeMedicineName(a);
  const nb = normalizeMedicineName(b);
  return na.length > 0 && na === nb;
}
