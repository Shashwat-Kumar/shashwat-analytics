-- The Envelope: rolling 24-hour call caps for the live agent proxy.
-- Idempotent: safe to run more than once.

create table if not exists public.envelope_calls (
  id bigserial primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists envelope_calls_ip_time on public.envelope_calls (ip_hash, created_at);
create index if not exists envelope_calls_time on public.envelope_calls (created_at);

-- No policies: only the service role (used by the edge function) can touch this table.
alter table public.envelope_calls enable row level security;

-- Takes one call slot. Returns 'ok', 'ip' (this network's cap reached) or 'global' (site cap reached).
create or replace function public.envelope_take(p_ip text, p_per_ip int, p_global int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n_all int;
  n_ip int;
begin
  perform pg_advisory_xact_lock(hashtext('envelope_take'));
  select count(*) into n_all from envelope_calls where created_at > now() - interval '24 hours';
  if n_all >= p_global then return 'global'; end if;
  select count(*) into n_ip from envelope_calls where ip_hash = p_ip and created_at > now() - interval '24 hours';
  if n_ip >= p_per_ip then return 'ip'; end if;
  insert into envelope_calls (ip_hash) values (p_ip);
  if random() < 0.02 then
    delete from envelope_calls where created_at < now() - interval '3 days';
  end if;
  return 'ok';
end;
$$;

revoke all on function public.envelope_take(text, int, int) from public, anon, authenticated;
grant execute on function public.envelope_take(text, int, int) to service_role;
