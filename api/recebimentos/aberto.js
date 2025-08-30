// api/recebimentos/abertos.js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow','GET'); return res.status(405).json({ error: 'Método não permitido' });
  }
  const { cliente_id } = req.query;
  if (!cliente_id) return res.status(400).json({ error: 'cliente_id é obrigatório' });

  try {
    const { data, error } = await supaAdmin
      .from('contas_receber')
      .select('id, venda_id, emissao, valor_total, valor_pago, saldo, status')
      .eq('cliente_id', cliente_id)
      .eq('status','ABERTO')
      .order('emissao', { ascending: true });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
