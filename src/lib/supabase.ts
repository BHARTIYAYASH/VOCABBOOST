import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isCloudConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || "http://placeholder.supabase.co", anonKey || "public-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * IMPORTANT: The Google OAuth Client Secret must NEVER live in this frontend.
 * It is configured once in the Supabase Dashboard:
 *   Authentication → Providers → Google → paste Client ID + Secret.
 * The browser only ever talks to Supabase's auth endpoint.
 */
