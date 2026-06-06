import {
  isPhotoCrop,
  isPhotoUrl,
} from "./albumUtils";

export const CHECKLIST_STORAGE_KEY = "matri-checklist-week-8";

export function loadChecked() {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveChecked(checked) {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checked));
  } catch { /* quota */ }
}

export const USER_CHECKLIST_KEY = "matri-user-checklist";

export function loadUserChecklist() {
  try {
    const raw = localStorage.getItem(USER_CHECKLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveUserChecklist(items) {
  try { localStorage.setItem(USER_CHECKLIST_KEY, JSON.stringify(items)); } catch {}
}

export const USER_STORIES_KEY = "matri-user-stories";

export function loadUserStories() {
  try {
    const raw = localStorage.getItem(USER_STORIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserStories(stories) {
  try {
    localStorage.setItem(USER_STORIES_KEY, JSON.stringify(stories));
  } catch { /* quota */ }
}

export const MOOD_LOG_KEY = "matri-mood-log";
export const NUTR_KEY     = "matri-nutrition-log";

export function loadMoodLog() {
  try {
    const raw = localStorage.getItem(MOOD_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveMoodLog(log) {
  try { localStorage.setItem(MOOD_LOG_KEY, JSON.stringify(log)); } catch {}
}

export const JOURNAL_STORAGE_KEY = "matri-journal-entries";
export const JOURNAL_IDS_KEY = "matri-journal-ids";
export const journalEntryKey = (id) => `matri-journal-entry-${id}`;

export function loadJournalEntries() {
  try {
    const idsRaw = localStorage.getItem(JOURNAL_IDS_KEY);
    if (idsRaw) {
      const ids = JSON.parse(idsRaw);
      if (Array.isArray(ids) && ids.length) {
        const entries = ids
          .map((id) => {
            const raw = localStorage.getItem(journalEntryKey(id));
            return raw ? JSON.parse(raw) : null;
          })
          .filter(Boolean);
        if (entries.length) return entries;
      }
    }
    const legacy = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length) {
        saveJournalEntries(parsed);
        localStorage.removeItem(JOURNAL_STORAGE_KEY);
        return parsed;
      }
    }
  } catch { /* fall through */ }
  return [];
}

export function saveJournalEntry(entry) {
  const slim = {
    ...entry,
    photos: entry.photos.map((p) => {
      if (isPhotoCrop(p)) {
        const slim = { ...p };
        if (slim.square?.length > 120000) slim.square = null;
        if (slim.album?.length > 120000) slim.album = null;
        return slim.square || slim.album ? slim : null;
      }
      return isPhotoUrl(p) && p.length > 120000 ? null : p;
    }).filter(Boolean),
  };
  try {
    localStorage.setItem(journalEntryKey(entry.id), JSON.stringify(entry));
    return true;
  } catch {
    try {
      localStorage.setItem(journalEntryKey(entry.id), JSON.stringify(slim));
      return true;
    } catch {
      return false;
    }
  }
}

export function saveJournalEntries(entries) {
  const ids = entries.map((e) => e.id);
  const savedIds = [];
  for (const entry of entries) {
    if (saveJournalEntry(entry)) savedIds.push(entry.id);
  }
  try {
    const prevRaw = localStorage.getItem(JOURNAL_IDS_KEY);
    const prevIds = prevRaw ? JSON.parse(prevRaw) : [];
    if (Array.isArray(prevIds)) {
      prevIds.forEach((id) => {
        if (!savedIds.includes(id)) localStorage.removeItem(journalEntryKey(id));
      });
    }
    localStorage.setItem(JOURNAL_IDS_KEY, JSON.stringify(savedIds));
  } catch { /* ids list failed */ }
  return savedIds.length;
}

export const MOMENT_STORAGE_KEY = "matri-moments";

export function loadMoments() {
  try { return JSON.parse(localStorage.getItem(MOMENT_STORAGE_KEY) || "{}"); } catch { return {}; }
}
export function saveMoment(week, text) {
  try {
    const all = loadMoments();
    all[week] = { text, date: new Date().toLocaleDateString("en-IN", { timeZone:"Asia/Kolkata", day:"numeric", month:"short", year:"numeric" }) };
    localStorage.setItem(MOMENT_STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export const COVER_PHOTO_KEY = "matri-cover-photo";
