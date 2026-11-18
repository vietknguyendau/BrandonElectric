-- Brandon Electric bid tracker
-- Run in the Supabase SQL editor (or `supabase db push`).
--
-- Access model:
--   * Public bid requests are inserted by the Next.js server with the service role key.
--   * Staff sign in with Supabase Auth. A signed-in user can see/edit bids ONLY if
--     they have an active row in public.staff.
--   * The anon role has no access to any table.

create type public.bid_status as enum ('new', 'reviewing', 'estimating', 'sent', 'won', 'lost', 'passed');
create type public.bid_source as enum ('website', 'email', 'phone', 'other');

-- Staff allowlist ----------------------------------------------------------
create table public.staff (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  email        text not null unique,
  display_name text not null,
  role         text not null default 'estimator' check (role in ('admin', 'estimator')),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s where s.user_id = auth.uid() and s.active
  );
$$;

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- Bids -----------------------------------------------------------------------
create table public.bids (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  source                public.bid_source not null,
  status                public.bid_status not null default 'new',
  owner_id              uuid references public.staff (user_id) on delete set null,

  contact_name          text not null default '' check (char_length(contact_name) <= 120),
  company               text not null check (char_length(company) between 1 and 160),
  email                 text check (email is null or char_length(email) <= 254),
  phone                 text check (phone is null or char_length(phone) <= 40),

  project_name          text not null check (char_length(project_name) between 1 and 200),
  project_location      text not null default '' check (char_length(project_location) <= 200),
  scope                 text not null default '' check (char_length(scope) <= 4000),
  plans_url             text check (plans_url is null or plans_url ~* '^https?://'),

  due_date              date,
  due_date_tbd          boolean not null default false,
  send_by_date          date,
  sent_date             date,

  notes                 text check (notes is null or char_length(notes) <= 4000),
  is_sample             boolean not null default false,

  estimator_notified_at timestamptz,
  receipt_sent_at       timestamptz,
  notification_error    text,

  constraint sent_needs_date check (status <> 'sent' or sent_date is not null),
  constraint website_needs_email check (source <> 'website' or email is not null)
);

create index bids_open_deadline_idx on public.bids (status, due_date nulls last);
create index bids_owner_idx on public.bids (owner_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bids_touch before update on public.bids
for each row execute function public.touch_updated_at();

-- Outbound email log (and preview outbox) -----------------------------------
create table public.email_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  bid_id      uuid references public.bids (id) on delete set null,
  kind        text not null check (kind in ('estimator_notification', 'requester_receipt')),
  to_address  text not null,
  subject     text not null,
  body_text   text not null,
  status      text not null check (status in ('disabled', 'sent', 'failed')),
  provider_id text,
  error       text
);

-- Row Level Security ---------------------------------------------------------
alter table public.staff     enable row level security;
alter table public.bids      enable row level security;
alter table public.email_log enable row level security;

revoke all on public.staff, public.bids, public.email_log from anon;

create policy "staff can read staff list" on public.staff
  for select to authenticated using (public.is_staff());

create policy "staff can read bids" on public.bids
  for select to authenticated using (public.is_staff());

create policy "staff can add bids" on public.bids
  for insert to authenticated with check (public.is_staff());

create policy "staff can update bids" on public.bids
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- No delete policy: close a bid by marking it Passed or Lost.

create policy "staff can read email log" on public.email_log
  for select to authenticated using (public.is_staff());

-- Service role (server only) bypasses RLS for public submissions + email log writes.
