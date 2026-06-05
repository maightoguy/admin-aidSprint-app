import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getSupabaseEnv();
  if (!env) {
    return null;
  }

  cachedClient = createClient(env.url, env.anonKey);
  return cachedClient;
}

export const supabase = getSupabaseClient();
