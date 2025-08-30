-- sincroniza estoque_saldo a partir de estoque_mov
create or replace function f_sync_estoque_saldo()
returns trigger language plpgsql as $$
begin
  insert into estoque_saldo (produto_id) values (new.produto_id)
  on conflict (produto_id) do nothing;

  if new.tipo in ('PURCHASE_IN','ADJUST_IN','RETURN_IN') then
    update estoque_saldo
       set qtd = qtd + new.qtd
     where produto_id = new.produto_id;

    if new.tipo = 'PURCHASE_IN' and new.valor_unit is not null then
      update estoque_saldo s
         set custo_medio = case
           when s.qtd = 0 then coalesce(new.valor_unit, s.custo_medio)
           else round(((s.qtd - new.qtd) * s.custo_medio + new.qtd * new.valor_unit) / nullif(s.qtd,0), 4)
         end,
             data_ultima_compra = current_date
       where s.produto_id = new.produto_id;
    end if;

  elsif new.tipo in ('SALE_OUT','ADJUST_OUT') then
    update estoque_saldo
       set qtd = qtd - new.qtd
     where produto_id = new.produto_id;
  end if;

  return new;
end $$;

drop trigger if exists tg_sync_estoque on estoque_mov;
create trigger tg_sync_estoque
after insert on estoque_mov
for each row execute function f_sync_estoque_saldo();


-- compra -> gera movimentos PURCHASE_IN
create or replace function f_mov_compra()
returns trigger language plpgsql as $$
begin
  insert into estoque_mov (produto_id, tipo, qtd, valor_unit, origem)
  select produto_id, 'PURCHASE_IN', qtd, valor_unit, ('compra:'||new.id)::text
    from compras_itens
   where compra_id = new.id;
  return new;
end $$;

drop trigger if exists tg_mov_compra on compras;
create trigger tg_mov_compra
after insert on compras
for each row execute function f_mov_compra();
