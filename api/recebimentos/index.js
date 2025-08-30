// api/recebimentos/index.js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST'); return res.status(405).json({ error: 'Método não permitido' });
  }

  const { conta_id, valor, forma, pix_chave_id } = req.body || {};
  if (!conta_id || !valor || !forma) return res.status(400).json({ error: 'conta_id, valor, forma obrigatórios' });

  try {
    // carrega conta
    const { data: conta, error: e1 } = await supaAdmin
      .from('contas_receber').select('*').eq('id', conta_id).single();
    if (e1) throw e1;

    if (conta.status !== 'ABERTO') return res.status(400).json({ error: 'Conta não está em aberto' });

    // (opcional) gerar Pix copia e cola aqui
    let pixPayload = null;
    if (forma === 'PIX' && pix_chave_id) {
      // por ora apenas salva referência; depois integramos BR Code (EMV)
      pixPayload = `PIX:${pix_chave_id}:${valor}`;
    }

    // 1) inserir pagamento
    const { error: e2 } = await supaAdmin.from('pagamentos').insert([{
      conta_id, cliente_id: conta.cliente_id, venda_id: conta.venda_id,
      forma, valor: +valor, pix_chave_id: pix_chave_id || null, pix_copia_cola: pixPayload
    }]);
    if (e2) throw e2;

    // 2) update valor_pago e status
    const novoPago = +conta.valor_pago + (+valor);
    const status = (novoPago >= +conta.valor_total) ? 'QUITADO' : 'ABERTO';

    const { error: e3 } = await supaAdmin.from('contas_receber')
      .update({ valor_pago: novoPago, status }).eq('id', conta_id);
    if (e3) throw e3;

    return res.status(201).json({ ok: true, status });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
