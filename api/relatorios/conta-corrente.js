// api/relatorios/conta-corrente.js
import { supaAdmin } from '../_lib/supa.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow','GET'); return res.status(405).json({ error: 'Método não permitido' });
  }
  const { cliente_id, ini, fim } = req.query;
  if (!cliente_id || !ini || !fim) return res.status(400).json({ error: 'cliente_id, ini, fim obrigatórios' });

  try {
    // débitos (vendas/contas_receber)
    const { data: debitos, error: e1 } = await supaAdmin.rpc('exec_sql', {
      q: `
      select v.id as venda_id, v.data::date as data, cr.valor_total as valor, 'DEBITO' as tipo
      from vendas v
      join contas_receber cr on cr.venda_id = v.id
      where v.cliente_id = $1 and v.data::date between $2 and $3
      order by v.data
      `,
      params: [cliente_id, ini, fim]
    });

    // créditos (pagamentos)
    const { data: creditos, error: e2 } = await supaAdmin.rpc('exec_sql', {
      q: `
      select p.venda_id, p.data_hora::date as data, p.valor as valor, 'CREDITO' as tipo
      from pagamentos p
      where p.cliente_id = $1 and p.data_hora::date between $2 and $3
      order by p.data_hora
      `,
      params: [cliente_id, ini, fim]
    });

    if (e1) throw e1;
    if (e2) throw e2;

    const mov = [...(debitos||[]), ...(creditos||[])]
      .sort((a,b)=> (a.data > b.data ? 1 : a.data < b.data ? -1 : (a.tipo > b.tipo ? 1 : -1)));

    // saldo acumulado
    let saldo = 0;
    const out = mov.map(m => {
      saldo += (m.tipo === 'DEBITO' ? +m.valor : -m.valor);
      return { ...m, saldo_acumulado: +saldo.toFixed(2) };
    });

    return res.status(200).json(out);

  } catch (e) {
    // OBS: a RPC exec_sql acima pressupõe uma função utilitária; se preferir, refaço em consultas separadas sem RPC.
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
