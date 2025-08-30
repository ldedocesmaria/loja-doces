// api/test-supabase.js
import { supaAdmin } from './_lib/supa.js';

export default async function handler(req, res) {
  try {
    // Busca só 1 produto de exemplo
    const { data, error } = await supaAdmin
      .from('produtos')
      .select('id, codigo, descricao, preco_venda')
      .limit(1);

    if (error) throw error;

    res.status(200).json({
      ok: true,
      message: 'Conexão com Supabase funcionando ✅',
      exemploProduto: data
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      message: 'Erro ao conectar no Supabase ❌',
      error: e.message
    });
  }
}
