import { serverClient } from '../_lib/supa.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try{
    const supa = serverClient();
    const { search } = Object.fromEntries(new URL(req.url).searchParams);
    // join saldo com produtos
    let q = supa.rpc('estoque_saldos_view'); // tentar uma view/rpc se existir
    // caso não exista a rpc/view, cair para join manual (produtos + estoque_saldo)
    let data;
    try{
      const r = await q;
      if(r.error) throw r.error;
      data = r.data;
    }catch(_){
      const { data: prods, error } = await supa.from('produtos').select('codigo,descricao,unidade,preco_venda, estoque_saldo(estoque,custo_medio)').order('descricao', { ascending:true });
      if(error) throw error;
      data = (prods||[]).map(p=>({ 
        codigo: p.codigo, descricao: p.descricao, unidade: p.unidade,
        estoque: p.estoque_saldo?.[0]?.estoque||0, custo_medio: p.estoque_saldo?.[0]?.custo_medio||0,
        preco_venda: p.preco_venda||0
      }));
    }
    if(search){
      const s = search.toLowerCase();
      data = data.filter(r => (r.codigo||'').toLowerCase().includes(s) || (r.descricao||'').toLowerCase().includes(s));
    }
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type':'application/json' }});
  }catch(err){
    return new Response(String(err), { status: 500 });
  }
}
