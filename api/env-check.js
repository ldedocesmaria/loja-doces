// api/env-check.js
export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    env: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE
    }
  });
}
