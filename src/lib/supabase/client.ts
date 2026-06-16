import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}

export function isSupabaseFeatureEnabled() {
  return !(import.meta.env.MODE === "test" || import.meta.env.VITEST) && isSupabaseConfigured();
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getSupabaseEnv();
  if (!env) {
    return null;
  }

  cachedClient = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return cachedClient;
}

export const supabase = getSupabaseClient();
