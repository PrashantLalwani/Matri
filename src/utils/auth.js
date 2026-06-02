import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export function useHealthContext() {
  const [healthContext, setHealthContext] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const resp = await authFetch("/api/health-context");
      if (resp.ok) setHealthContext(await resp.json());
    } catch {}
  }, []);

  // Force-rebuilds the health context on the server (bypasses 1-hour cache).
  // Call this after any client-side deletion that changes lab/scan data.
  const forceRefresh = useCallback(async () => {
    try {
      const resp = await authFetch("/api/health-context", { method: "POST" });
      if (resp.ok) setHealthContext(await resp.json());
    } catch {}
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { healthContext, refreshContext: refresh, forceRefresh };
}
