import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
console.log('[authFetch] API_BASE =', API_BASE || '(empty — relative URLs)');

export async function authFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const fullUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;
  console.log('[authFetch] calling:', fullUrl, 'token:', token ? 'yes' : 'NO TOKEN');
  try {
    const resp = await fetch(fullUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    console.log('[authFetch] response:', fullUrl, 'status:', resp.status);
    // Clone to peek at body without consuming it for the caller
    resp.clone().text().then(t => console.log('[authFetch] body preview:', t.substring(0, 300)));
    return resp;
  } catch (e) {
    console.error('[authFetch] fetch error:', fullUrl, e?.message || e);
    throw e;
  }
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
