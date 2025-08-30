alter table clientes enable row level security;
alter table pix_chaves enable row level security;
alter table produtos enable row level security;
alter table estoque_saldo enable row level security;
alter table estoque_mov enable row level security;
alter table compras enable row level security;
alter table compras_itens enable row level security;
alter table vendas enable row level security;
alter table vendas_itens enable row level security;
alter table contas_receber enable row level security;
alter table pagamentos enable row level security;

-- leitura para usuários autenticados (ajuste conforme necessidade)
create policy "select_auth" on clientes for select using (auth.role() = 'authenticated');
create policy "select_auth" on produtos for select using (auth.role() = 'authenticated');
create policy "select_auth" on estoque_saldo for select using (auth.role() = 'authenticated');
create policy "select_auth" on estoque_mov for select using (auth.role() = 'authenticated');
create policy "select_auth" on compras for select using (auth.role() = 'authenticated');
create policy "select_auth" on compras_itens for select using (auth.role() = 'authenticated');
create policy "select_auth" on vendas for select using (auth.role() = 'authenticated');
create policy "select_auth" on vendas_itens for select using (auth.role() = 'authenticated');
create policy "select_auth" on contas_receber for select using (auth.role() = 'authenticated');
create policy "select_auth" on pagamentos for select using (auth.role() = 'authenticated');

-- escrita somente via service role (pelas APIs do servidor)
-- dica: não crie políticas de insert/update para o público;
-- use a SERVICE_ROLE nas rotas serverless para executar as mutações.
