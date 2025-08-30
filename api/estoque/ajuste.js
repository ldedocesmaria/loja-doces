// api/estoque/ajuste.js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST'); return res.status(405).json({ error: 'Método não permitido' });
  }

  const { produto_id, tipo, qtd, motivo, valor_unit } = req.body || {};
  if (!produto_id || !tipo || !qtd) return res.status(400).json({ error: 'produto_id, tipo e qtd são obrigatórios' });

  const tiposOK = ['ADJUST_IN','ADJUST_OUT'];
  if (!tiposOK.includes(tipo)) return res.status(400).json({ error: 'tipo inválido' });

  try {
    const { error } = await supaAdmin.from('estoque_mov').insert([{
      produto_id, tipo, qtd: +qtd, motivo: motivo || null, valor_unit: valor_unit ? +valor_unit : null, origem: 'ajuste'
    }]);
    if (error) throw error;
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
