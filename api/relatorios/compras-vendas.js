// api/relatorios/compras-vendas.js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow','GET'); return res.status(405).json({ error: 'Método não permitido' });
  }
  const { ini, fim } = req.query;
  if (!ini || !fim) return res.status(400).json({ error: 'ini e fim são obrigatórios' });

  try {
    // vendas no período
    const { data: itens, error: e1 } = await supaAdmin
      .from('vendas_itens')
      .select('produto_id, qtd, preco_venda, vendas!inner(data)')
      .gte('vendas.data', `${ini}T00:00:00Z`)
      .lte('vendas.data', `${fim}T23:59:59Z`);

    if (e1) throw e1;

    // agrega vendas por produto
    const agg = {};
    for (const it of itens || []) {
      const pid = it.produto_id;
      if (!agg[pid]) agg[pid] = { qtd_vendida: 0, receita: 0 };
      agg[pid].qtd_vendida += +it.qtd;
      agg[pid].receita += (+it.qtd * +it.preco_venda);
    }

    const produtoIds = Object.keys(agg);
    if (produtoIds.length === 0) return res.status(200).json([]);

    const { data: produtos, error: e2 } = await supaAdmin
      .from('produtos')
      .select('id, codigo, descricao');

    if (e2) throw e2;

    const { data: saldos, error: e3 } = await supaAdmin
      .from('estoque_saldo')
      .select('produto_id, custo_medio');
    if (e3) throw e3;

    const custoById = Object.fromEntries((saldos||[]).map(s => [s.produto_id, +s.custo_medio || 0]));
    const produtoById = Object.fromEntries((produtos||[]).map(p => [p.id, p]));

    const rows = produtoIds.map(pid => {
      const p = produtoById[pid];
      const { qtd_vendida, receita } = agg[pid];
      const cmp = custoById[pid] || 0;
      const custo_aprox = +(qtd_vendida * cmp).toFixed(2);
      const margem = +(receita - custo_aprox).toFixed(2);
      const margem_pct = receita > 0 ? +(margem / receita * 100).toFixed(2) : 0;
      return {
        produto_id: pid,
        codigo: p?.codigo,
        descricao: p?.descricao,
        qtd_vendida: +qtd_vendida.toFixed(3),
        receita: +receita.toFixed(2),
        custo_medio: cmp,
        custo_aprox,
        margem,
        margem_pct
      };
    }).sort((a,b)=> b.margem - a.margem);

    return res.status(200).json(rows);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
