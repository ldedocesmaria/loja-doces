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
    const vcompra = Number(body.valor_compra||0);
    if(qtd<=0 || vcompra<=0) return new Response('Quantidade e valor de compra são obrigatórios', { status: 400 });

    // registra compra básica
    const compra = { data: body.data || new Date().toISOString().slice(0,10), cliente_id: null, total: qtd * vcompra };
    const insCompra = await supa.from('compras').insert(compra).select().single();
    if(insCompra.error) throw insCompra.error;

    const item = { compra_id: insCompra.data.id, produto_id: prod.id || null, produto_codigo: prod.codigo, quantidade: qtd, valor_compra: vcompra, preco_venda: body.preco_venda||null };
    // aceita schema com produto_id OU produto_codigo
    let insItem = await supa.from('compras_itens').insert(item).select().single();
    if(insItem.error){
      // fallback sem produto_id
      insItem = await supa.from('compras_itens').insert({ ...item, produto_id: null }).select().single();
      if(insItem.error) throw insItem.error;
    }

    // movimento de estoque (COMPRA)
    const mov = { produto_codigo: prod.codigo, tipo:'COMPRA', quantidade:qtd, valor: vcompra, motivo: null };
    let insMov = await supa.from('estoque_mov').insert(mov);
    if(insMov.error) throw insMov.error;

    // atualiza saldo e custo médio
    // tenta carregar saldo atual
    let { data: saldoRow } = await supa.from('estoque_saldo').select('*').eq('produto_codigo', prod.codigo).maybeSingle();
    const estoqueAtual = saldoRow?.estoque || 0;
    const custoAtual = saldoRow?.custo_medio || 0;

    const novoEstoque = estoqueAtual + qtd;
    const novoCusto = novoEstoque>0 ? ((estoqueAtual*custoAtual) + (qtd*vcompra)) / novoEstoque : vcompra;

    // upsert
    const up = await supa.from('estoque_saldo').upsert({ produto_codigo: prod.codigo, estoque: novoEstoque, custo_medio: novoCusto }, { onConflict: 'produto_codigo' }).select().single();
    if(up.error) throw up.error;

    // atualiza produto (unidade/preco_venda) se enviado
    const patch = {};
    if(body.unidade) patch.unidade = body.unidade;
    if(body.preco_venda!=null) patch.preco_venda = body.preco_venda;
    if(Object.keys(patch).length){
      const upd = await supa.from('produtos').update(patch).eq('codigo', prod.codigo);
      if(upd.error) throw upd.error;
    }

    return new Response(JSON.stringify({ ok:true }), { status: 200, headers: { 'Content-Type':'application/json' }});
  }catch(err){
    return new Response(String(err), { status: 500 });
  }
}
