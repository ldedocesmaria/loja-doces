-- clientes
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  telefone text,
  email text,
  created_at timestamptz default now(),
  unique (documento)
);

-- pix_chaves
create table if not exists pix_chaves (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  tipo text not null check (tipo in ('chave_aleatoria','cpf','cnpj','email','telefone')),
  valor text not null,
  ativa boolean default true,
  created_at timestamptz default now()
);

-- produtos
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  descricao text not null,
  unidade text not null default 'UN',
  preco_venda numeric(12,2) not null default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- estoque_saldo (espelho)
create table if not exists estoque_saldo (
  produto_id uuid primary key references produtos(id) on delete cascade,
  qtd numeric(14,3) not null default 0,
  custo_medio numeric(12,4) not null default 0,
  data_ultima_compra date
);

-- estoque_mov (log)
create table if not exists estoque_mov (
  id bigserial primary key,
  produto_id uuid not null references produtos(id),
  tipo text not null check (tipo in ('PURCHASE_IN','SALE_OUT','ADJUST_IN','ADJUST_OUT','RETURN_IN')),
  qtd numeric(14,3) not null check (qtd > 0),
  valor_unit numeric(12,4),
  motivo text,
  origem text,
  created_at timestamptz default now()
);

-- compras
create table if not exists compras (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  obs text,
  created_at timestamptz default now()
);

-- compras_itens
create table if not exists compras_itens (
  id bigserial primary key,
  compra_id uuid references compras(id) on delete cascade,
  produto_id uuid references produtos(id),
  qtd numeric(14,3) not null check (qtd > 0),
  valor_unit numeric(12,4) not null check (valor_unit >= 0)
);

-- vendas
create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  data timestamptz not null default now(),
  total numeric(12,2) not null default 0,
  status text not null default 'ABERTA' check (status in ('ABERTA','FATURADA','CANCELADA')),
  created_at timestamptz default now()
);

-- vendas_itens
create table if not exists vendas_itens (
  id bigserial primary key,
  venda_id uuid references vendas(id) on delete cascade,
  produto_id uuid references produtos(id),
  qtd numeric(14,3) not null check (qtd > 0),
  preco_venda numeric(12,4) not null check (preco_venda >= 0)
);

-- contas_receber
create table if not exists contas_receber (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references vendas(id) on delete cascade,
  cliente_id uuid references clientes(id),
  emissao date not null default current_date,
  valor_total numeric(12,2) not null,
  valor_pago numeric(12,2) not null default 0,
  saldo numeric(12,2) generated always as (valor_total - valor_pago) stored,
  status text not null default 'ABERTO' check (status in ('ABERTO','QUITADO','CANCELADO')),
  created_at timestamptz default now()
);

-- pagamentos
create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid references contas_receber(id) on delete cascade,
  cliente_id uuid references clientes(id),
  venda_id uuid references vendas(id),
  data_hora timestamptz not null default now(),
  forma text not null check (forma in ('DINHEIRO','PIX')),
  valor numeric(12,2) not null check (valor > 0),
  pix_chave_id uuid references pix_chaves(id),
  pix_copia_cola text,
  created_at timestamptz default now()
);

-- índices úteis
create index if not exists idx_produtos_desc on produtos using gin (to_tsvector('simple', descricao));
create index if not exists idx_clientes_nome on clientes using gin (to_tsvector('simple', nome));
create index if not exists idx_vendas_cli_data on vendas (cliente_id, data);
create index if not exists idx_estoque_mov_prod on estoque_mov (produto_id, created_at);
create index if not exists idx_cr_cli_status on contas_receber (cliente_id, status);
