#!/usr/bin/env bash
# Applies the Supabase migration to a throwaway local Postgres with a minimal
# stand-in for Supabase's auth schema/roles, then checks Row Level Security.
set -euo pipefail
PGBIN=$(ls -d /usr/lib/postgresql/*/bin | tail -1)
DIR=$(mktemp -d); chmod 777 "$DIR"; PORT=54329
su postgres -c "$PGBIN/initdb -D $DIR/data -A trust -U postgres" >/dev/null
chown -R postgres "$DIR" 2>/dev/null || true
su postgres -c "$PGBIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR' -l $DIR/log start -w" >/dev/null
trap 'su postgres -c "$PGBIN/pg_ctl -D $DIR/data stop -m fast" >/dev/null; rm -rf $DIR' EXIT
PSQL="psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"

$PSQL <<'SQL'
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
SQL
$PSQL -f supabase/migrations/0001_bid_tracker.sql

$PSQL <<'SQL'
insert into auth.users values ('11111111-1111-1111-1111-111111111111','staff@x.com'), ('22222222-2222-2222-2222-222222222222','rando@x.com');
insert into public.staff (user_id, email, display_name) values ('11111111-1111-1111-1111-111111111111','staff@x.com','Staff');
-- public request inserted with service role
set role service_role;
insert into public.bids (source, company, contact_name, email, project_name, due_date) values ('website','GC','Pat','p@x.com','Web req', current_date + 5);
reset role;

do $$
declare n int; ok boolean;
begin
  -- anon: no access at all
  set local role anon;
  begin perform count(*) from public.bids; raise exception 'anon could read bids'; exception when insufficient_privilege then null; end;
  reset role;

  -- signed-in but not staff: sees nothing, can't insert
  perform set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222', true);
  set local role authenticated;
  select count(*) into n from public.bids; if n <> 0 then raise exception 'non-staff saw % bids', n; end if;
  begin insert into public.bids (source, company, project_name) values ('email','X','Y'); raise exception 'non-staff inserted';
  exception when insufficient_privilege then null; end;
  reset role;

  -- staff: read, manual insert, assign, mark sent
  perform set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111', true);
  set local role authenticated;
  select count(*) into n from public.bids; if n <> 1 then raise exception 'staff saw % bids', n; end if;
  insert into public.bids (source, company, project_name, due_date) values ('email','Invite GC','Emailed invite', current_date + 1);
  update public.bids set owner_id = '11111111-1111-1111-1111-111111111111' where true;
  begin update public.bids set status = 'sent' where project_name = 'Emailed invite'; raise exception 'sent without date allowed';
  exception when check_violation then null; end;
  update public.bids set status = 'sent', sent_date = current_date where project_name = 'Emailed invite';
  begin delete from public.bids; exception when insufficient_privilege then null; end;
  select count(*) into n from public.bids; if n <> 2 then raise exception 'delete went through'; end if;
  begin insert into public.bids (source, company, project_name, plans_url) values ('email','X','Y','javascript:alert(1)'); raise exception 'bad url allowed';
  exception when check_violation then null; end;
  reset role;
  raise notice 'RLS checks passed';
end $$;
SQL
echo "migration + RLS OK"
