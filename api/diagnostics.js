// api/diagnostics.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;

export default async function handler(req, res) {
  try {
    if (!url || !key) {
      return res.status(500).json({ ok:false, msg:'ENV faltando na Vercel (URL/Service Role)' });
    }
    const supa = createClient(url, key, { auth: { persistSession: false } });

    const { count, error } = await supa
      .from('produtos')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return res.status(200).json({ ok:true, env:true, db:{ ok:false, msg:error.message } });
    }
    return res.status(200).json({ ok:true, env:true, db:{ ok:true, produtos_count: count } });
  } catch (e) {
    return res.status(500).json({ ok:false, msg:e.message });
  }
}
