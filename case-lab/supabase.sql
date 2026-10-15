-- ReadSigil Case Lab · run in your own Supabase project SQL editor
-- Email/password authentication is provided by Supabase Auth.
-- Client-side scores are practice results, not invigilated/certified assessment.
create table if not exists public.case_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null check (case_id in ('growth','fraud','factory','public')),
  attempt_id uuid not null,
  submitted_at timestamptz not null default now(),
  score int not null check (score between 0 and 100),
  breakdown jsonb not null,
  answers jsonb not null,
  constraint own_attempt unique (user_id,attempt_id)
);
create index if not exists case_attempt_user_idx on public.case_attempts (user_id,submitted_at desc);
alter table public.case_attempts enable row level security;
drop policy if exists "Read own case attempts" on public.case_attempts;
create policy "Read own case attempts" on public.case_attempts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Write own case attempts" on public.case_attempts;
create policy "Write own case attempts" on public.case_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own case attempts" on public.case_attempts;
create policy "Delete own case attempts" on public.case_attempts for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on table public.case_attempts from anon;
grant select,insert,delete on table public.case_attempts to authenticated;
-- Note: schema does NOT certify score integrity. Client results are user-controlled.
