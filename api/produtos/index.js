// api/produtos/index.js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { search, limit = 20 } = req.query;
      let q = supaAdmin.from('produtos').select('*').eq('ativo', true).limit(+limit);

      if (search) {
        // busca por código ou descrição (ilike)
        q = q.or(`codigo.ilike.%${search}%,descricao.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { codigo, descricao, preco_venda, unidade = 'UN', ativo = true } = req.body || {};
      if (!codigo || !descricao) return res.status(400).json({ error: 'codigo e descricao são obrigatórios' });

      const { data, error } = await supaAdmin
        .from('produtos')
        .insert([{ codigo, descricao, preco_venda: +preco_venda || 0, unidade, ativo }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    res.setHeader('Allow', 'GET,POST');
    return res.status(405).json({ error: 'Método não permitido' });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
