import { serverClient, genCode6 } from './_lib/supa.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try{
    const supa = serverClient();
    const { search, limit } = Object.fromEntries(new URL(req.url).searchParams);
    if(req.method === 'GET'){
      let q = supa.from('produtos').select('*').order('descricao', { ascending: true });
      if(search) q = q.or(`codigo.ilike.%${search}%,descricao.ilike.%${search}%`);
      if(limit) q = q.limit(parseInt(limit));
      const { data, error } = await q;
      if(error) throw error;
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type':'application/json' }});
    }
    if(req.method === 'POST'){
      const body = await req.json();
      const codigo = await genCode6(supa, 'produtos');
      const row = { codigo, descricao: body.descricao, unidade: body.unidade||'UN', preco_venda: body.preco_venda||0 };
      const { data, error } = await supa.from('produtos').insert(row).select().single();
      if(error) throw error;
      return new Response(JSON.stringify({ ok:true, codigo: data.codigo }), { status: 200, headers: { 'Content-Type':'application/json' }});
    }
    return new Response('Method Not Allowed', { status: 405 });
  }catch(err){
    return new Response(String(err), { status: 500 });
  }
}
