-- ============================================================================
-- MathSpeak Studio V4 - Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Huong dan: Mo Supabase Dashboard -> SQL Editor -> New query -> Dan toan bo -> Run
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Bang luu kho kich ban giang day Toan THPT tieng Anh cua tung giao vien
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grade text not null default 'Lớp 12',
  duration text not null default '45 phút',
  title_en text not null,
  title_vi text not null default '',
  source text not null default 'Gemini AI',
  stages jsonb not null default '[]'::jsonb,
  vocab jsonb not null default '[]'::jsonb,
  mastered_line_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lessons_user_updated
  on public.lessons (user_id, updated_at desc);

-- 2. Bang luu lich su cham phat am AI de giao vien theo doi tien bo
create table if not exists public.pronunciation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  line_id text not null,
  target_text text not null,
  heard_text text not null default '',
  score integer not null check (score >= 0 and score <= 100),
  verdict text not null default '',
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_pronunciation_user_lesson
  on public.pronunciation_logs (user_id, lesson_id, created_at desc);

-- 3. Trigger tu dong cap nhat updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lessons_updated_at on public.lessons;
create trigger trg_lessons_updated_at
  before update on public.lessons
  for each row execute function public.handle_updated_at();

-- 4. Bat Row Level Security (Moi giao vien chi thay & sua du lieu cua chinh minh)
alter table public.lessons enable row level security;
alter table public.pronunciation_logs enable row level security;

drop policy if exists "Users read own lessons" on public.lessons;
create policy "Users read own lessons"
  on public.lessons for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own lessons" on public.lessons;
create policy "Users insert own lessons"
  on public.lessons for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own lessons" on public.lessons;
create policy "Users update own lessons"
  on public.lessons for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own lessons" on public.lessons;
create policy "Users delete own lessons"
  on public.lessons for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read own pronunciation logs" on public.pronunciation_logs;
create policy "Users read own pronunciation logs"
  on public.pronunciation_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own pronunciation logs" on public.pronunciation_logs;
create policy "Users insert own pronunciation logs"
  on public.pronunciation_logs for insert
  with check (auth.uid() = user_id);
