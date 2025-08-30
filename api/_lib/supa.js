import { createClient } from '@supabase/supabase-js';

export function serverClient(){
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if(!url || !key) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE são obrigatórios');
  const supa = createClient(url, key, { auth: { persistSession: false } });
  return supa;
}

export async function findProdutoByLoose(supa, loose){
  // aceita código exato ou parte da descrição
  if(!loose) return null;
  // tenta código exato
  const byCode = await supa.from('produtos').select('*').eq('codigo', loose).maybeSingle();
  if(byCode.data) return byCode.data;
  // tenta like por descrição
  const like = await supa.from('produtos').select('*').ilike('descricao', `%${loose}%`).limit(1);
  return like.data?.[0] || null;
}

// Gera código único de 6 chars
export async function genCode6(supa, table){
  let tries=0;
  while(tries++<10){
    const code = Math.random().toString(36).slice(2,8).toUpperCase().replace(/[^A-Z0-9]/g,'');
    const exists = await supa.from(table).select('codigo').eq('codigo', code).maybeSingle();
    if(!exists.data) return code;
  }
  throw new Error('Falha ao gerar código');
}
