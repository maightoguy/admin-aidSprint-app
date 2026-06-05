export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (typeof url !== "string" || url.trim() === "") {
    return null;
  }

  if (typeof anonKey !== "string" || anonKey.trim() === "") {
    return null;
  }

  return { url, anonKey };
}
