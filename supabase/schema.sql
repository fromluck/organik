create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null,
  amount numeric(12, 2) not null,
  start_month int not null,
  start_year int not null,
  installments_left int,
  paid_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  credit_limit numeric(12, 2) not null,
  used_amount numeric(12, 2) not null,
  available_amount numeric(12, 2) not null,
  current_invoice numeric(12, 2) not null default 0,
  open_invoice numeric(12, 2) not null default 0,
  future_invoices numeric(12, 2) not null default 0,
  last_charge_month text,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.bills enable row level security;
alter table public.credit_cards enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own bills"
  on public.bills for select
  using (auth.uid() = profile_id);

create policy "Users can insert own bills"
  on public.bills for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own bills"
  on public.bills for update
  using (auth.uid() = profile_id);

create policy "Users can delete own bills"
  on public.bills for delete
  using (auth.uid() = profile_id);

create policy "Users can read own cards"
  on public.credit_cards for select
  using (auth.uid() = profile_id);

create policy "Users can insert own cards"
  on public.credit_cards for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own cards"
  on public.credit_cards for update
  using (auth.uid() = profile_id);

create policy "Users can delete own cards"
  on public.credit_cards for delete
  using (auth.uid() = profile_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = excluded.name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
