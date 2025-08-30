// api/vendas/index.js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST'); return res.status(405).json({ error: 'Método não permitido' });
  }

  const { cliente_id, itens = [] } = req.body || {};
  if (!cliente_id || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'cliente_id e itens são obrigatórios' });
  }

  // total
  const total = itens.reduce((acc, it) => acc + (+it.qtd * +it.preco_venda), 0);

  try {
    // 1) cria venda
    const { data: venda, error: e1 } = await supaAdmin.from('vendas')
      .insert([{ cliente_id, total, status: 'ABERTA' }])
      .select().single();
    if (e1) throw e1;

    // 2) itens
    const rowsItens = itens.map(it => ({
      venda_id: venda.id, produto_id: it.produto_id,
      qtd: +it.qtd, preco_venda: +it.preco_venda
    }));
    const { error: e2 } = await supaAdmin.from('vendas_itens').insert(rowsItens);
    if (e2) throw e2;

    // 3) baixa estoque (SALE_OUT)
    const rowsMov = itens.map(it => ({
      produto_id: it.produto_id, tipo: 'SALE_OUT', qtd: +it.qtd, origem: `venda:${venda.id}`
    }));
    const { error: e3 } = await supaAdmin.from('estoque_mov').insert(rowsMov);
    if (e3) throw e3;

    // 4) título a receber
    const { error: e4 } = await supaAdmin.from('contas_receber')
      .insert([{ venda_id: venda.id, cliente_id, valor_total: total }]);
    if (e4) throw e4;

    return res.status(201).json({ venda_id: venda.id, total });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
