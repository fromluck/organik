create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
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
  profile_id uuid references public.profiles(id) on delete cascade,
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
