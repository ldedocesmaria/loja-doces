import { serverClient, findProdutoByLoose } from '../_lib/supa.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try{
    const supa = serverClient();
    if(req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const body = await req.json();
    const prod = await findProdutoByLoose(supa, body.produto);
    if(!prod) return new Response('Produto não encontrado', { status: 400 });

    const qtd = Number(body.quantidade||0);
    if(!qtd) return new Response('Quantidade é obrigatória', { status: 400 });

    // movimento AJUSTE
    const mov = { produto_codigo: prod.codigo, tipo:'AJUSTE', quantidade:qtd, valor: 0, motivo: body.motivo||null };
    const ins = await supa.from('estoque_mov').insert(mov);
    if(ins.error) throw ins.error;

    // atualiza saldo
    let { data: saldoRow } = await supa.from('estoque_saldo').select('*').eq('produto_codigo', prod.codigo).maybeSingle();
    const estoqueAtual = saldoRow?.estoque || 0;
    const novoEstoque = estoqueAtual + qtd;
    const up = await supa.from('estoque_saldo').upsert({ produto_codigo: prod.codigo, estoque: novoEstoque, custo_medio: saldoRow?.custo_medio||0 }, { onConflict: 'produto_codigo' }).select().single();
    if(up.error) throw up.error;

    return new Response(JSON.stringify({ ok:true }), { status: 200, headers: { 'Content-Type':'application/json' }});
  }catch(err){
    return new Response(String(err), { status: 500 });
  }
}
