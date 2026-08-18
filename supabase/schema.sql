create extension if not exists pgcrypto;

create table if not exists public.bar_bottles (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 ingredient text not null,
 brand text,
 bottle_size_ml numeric not null check (bottle_size_ml > 0),
 remaining_ml numeric not null check (remaining_ml >= 0 and remaining_ml <= bottle_size_ml),
 low_at_ml numeric not null default 150 check (low_at_ml >= 0),
 created_at timestamptz not null default now()
);
create table if not exists public.bar_cocktails (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null,
 description text,
 created_at timestamptz not null default now()
);
create table if not exists public.bar_recipe_ingredients (
 id uuid primary key default gen_random_uuid(),
 cocktail_id uuid not null references public.bar_cocktails(id) on delete cascade,
 ingredient text not null,
 amount_ml numeric not null check(amount_ml > 0)
);
create table if not exists public.bar_pours (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 cocktail_id uuid references public.bar_cocktails(id) on delete set null,
 cocktail_name text not null,
 made_at timestamptz not null default now()
);
create table if not exists public.bar_inventory_transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 bottle_id uuid not null references public.bar_bottles(id) on delete cascade,
 pour_id uuid references public.bar_pours(id) on delete set null,
 change_ml numeric not null,
 reason text not null,
 created_at timestamptz not null default now()
);

alter table public.bar_bottles enable row level security;
alter table public.bar_cocktails enable row level security;
alter table public.bar_recipe_ingredients enable row level security;
alter table public.bar_pours enable row level security;
alter table public.bar_inventory_transactions enable row level security;

create policy "own bottles" on public.bar_bottles for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own cocktails" on public.bar_cocktails for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own recipe ingredients" on public.bar_recipe_ingredients for all to authenticated using (exists(select 1 from public.bar_cocktails c where c.id=cocktail_id and c.user_id=(select auth.uid()))) with check (exists(select 1 from public.bar_cocktails c where c.id=cocktail_id and c.user_id=(select auth.uid())));
create policy "own pours" on public.bar_pours for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "own transactions" on public.bar_inventory_transactions for select to authenticated using ((select auth.uid())=user_id);

grant select,insert,update,delete on public.bar_bottles,public.bar_cocktails,public.bar_recipe_ingredients,public.bar_pours to authenticated;
grant select on public.bar_inventory_transactions to authenticated;

create or replace function public.make_cocktail(p_cocktail_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare r record; b record; need numeric; take numeric; v_pour uuid; v_name text;
begin
 select name into v_name from public.bar_cocktails where id=p_cocktail_id and user_id=(select auth.uid());
 if v_name is null then raise exception 'Cocktail not found'; end if;
 for r in select ingredient,amount_ml from public.bar_recipe_ingredients where cocktail_id=p_cocktail_id loop
   if coalesce((select sum(remaining_ml) from public.bar_bottles where user_id=(select auth.uid()) and lower(ingredient)=lower(r.ingredient)),0) < r.amount_ml then raise exception 'Not enough %',r.ingredient; end if;
 end loop;
 insert into public.bar_pours(user_id,cocktail_id,cocktail_name) values((select auth.uid()),p_cocktail_id,v_name) returning id into v_pour;
 for r in select ingredient,amount_ml from public.bar_recipe_ingredients where cocktail_id=p_cocktail_id loop
   need:=r.amount_ml;
   for b in select id,remaining_ml from public.bar_bottles where user_id=(select auth.uid()) and lower(ingredient)=lower(r.ingredient) and remaining_ml>0 order by remaining_ml asc for update loop
     take:=least(need,b.remaining_ml);
     update public.bar_bottles set remaining_ml=remaining_ml-take where id=b.id;
     insert into public.bar_inventory_transactions(user_id,bottle_id,pour_id,change_ml,reason) values((select auth.uid()),b.id,v_pour,-take,'cocktail');
     need:=need-take; exit when need<=0;
   end loop;
 end loop;
 return v_pour;
end $$;
grant execute on function public.make_cocktail(uuid) to authenticated;
