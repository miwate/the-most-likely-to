import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env"
  );
}

export const supabase = createClient(url, key);

/**
 * Get public URL for a photo in the 'photos' bucket
 */
export function photoUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data?.publicUrl ?? null;
}
