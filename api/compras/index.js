// api/compras/index.js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método não permitido' });
  }

  const { itens = [], obs } = req.body || {};
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Informe itens [{produto_id, qtd, valor_unit}]' });
  }

  try {
    // cria compra
    const { data: compra, error: e1 } = await supaAdmin.from('compras')
      .insert([{ obs }]).select().single();
    if (e1) throw e1;

    // itens
    const rows = itens.map(i => ({
      compra_id: compra.id,
      produto_id: i.produto_id,
      qtd: +i.qtd,
      valor_unit: +i.valor_unit
    }));

    const { error: e2 } = await supaAdmin.from('compras_itens').insert(rows);
    if (e2) throw e2;

    // trigger tg_mov_compra vai inserir estoque_mov PURCHASE_IN e atualizar estoque_saldo
    return res.status(201).json({ compra_id: compra.id });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
