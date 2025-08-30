// api/produtos/[id].js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    if (req.method === 'GET') {
      const { data, error } = await supaAdmin.from('produtos').select('*, estoque_saldo(*)')
        .eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Produto não encontrado' });
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const payload = req.body || {};
      // previne alteração de campos chave sem querer
      delete payload.id; delete payload.created_at;

      const { data, error } = await supaAdmin.from('produtos').update(payload)
        .eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.setHeader('Allow', 'GET,PUT');
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
