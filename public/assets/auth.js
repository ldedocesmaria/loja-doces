import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env.js";

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, detectSessionInUrl: true },
});

console.log('Supabase Client:', supabase);

export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const back = encodeURIComponent(location.pathname + location.search);
    location.href = `/login.html?next=${back}`;
    throw new Error("redirecting");
  }
  return session;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user || null;
}