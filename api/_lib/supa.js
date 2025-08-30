// api/_lib/supa.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !service) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE são obrigatórios no server');
}

// client com SERVICE ROLE (apenas no server)
export const supaAdmin = createClient(url, service, {
  auth: { persistSession: false },
});
