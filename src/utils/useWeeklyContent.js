import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

// Module-level cache — persists across component remounts within the session.
// Keys are week numbers, values are the fetched weekly_content rows.
const contentCache = {};

/**
 * Fetches and caches the weekly_content row for `week`.
 * Returns null while loading or if the week has no content yet.
 * Falls back gracefully — callers should always have a static-constant fallback.
 */
export function useWeeklyContent(week) {
  const [content, setContent] = useState(() => contentCache[week] ?? null);
  const prevWeek = useRef(week);

  useEffect(() => {
    if (!week) return;

    // Already cached
    if (contentCache[week]) {
      if (prevWeek.current !== week) setContent(contentCache[week]);
      prevWeek.current = week;
      return;
    }

    prevWeek.current = week;
    let cancelled = false;

    supabase
      .from("weekly_content")
      .select("*")
      .eq("week", week)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        contentCache[week] = data;
        setContent(data);
      });

    return () => { cancelled = true; };
  }, [week]);

  return content;
}

/**
 * Given a weeklyContent row and the static COMMON_SYMPTOMS object,
 * returns a merged copy where week-specific `means` and `context` fields
 * from Supabase override the static defaults.
 */
export function mergeSymptomContexts(COMMON_SYMPTOMS, weeklyContent) {
  if (!weeklyContent?.symptom_contexts) return COMMON_SYMPTOMS;
  const overrides = weeklyContent.symptom_contexts;
  return Object.fromEntries(
    Object.entries(COMMON_SYMPTOMS).map(([key, val]) => [
      key,
      overrides[key] ? { ...val, ...overrides[key] } : val,
    ])
  );
}
