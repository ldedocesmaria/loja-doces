import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(process.env.SUPABASE_URL || "https://wwlibjouapbjcgxmsagg.supabase.co", process.env.SUPABASE_ANON_KEY || "yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bGliam91YXBiamNneG1zYWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjM2NDYsImV4cCI6MjA3MjEzOTY0Nn0.ZCuJkgIn_NlxmAWwyWo8LmtCOdsNtB1CLs1bU3w2gwQ", {
  auth: { persistSession: true, detectSessionInUrl: true },
});

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