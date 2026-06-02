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
      if (resp.ok) {
        const data = await resp.json();
        setHealthContext(data);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { healthContext, refreshContext: refresh };
}
