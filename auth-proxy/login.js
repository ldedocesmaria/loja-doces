// api/auth-proxy/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;            // ex: https://wwlibjouapbjcgxmsagg.supabase.co
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;  // sua anon public key

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await r.text(); // pode ser json ou erro simples
    // repasse status e corpo do Supabase pro cliente
    res.status(r.status).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', detail: String(err) });
  }
}
