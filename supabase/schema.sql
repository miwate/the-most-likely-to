-- =============================================
-- QUIZ PLATFORM SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. QUIZZES
create table public.quizzes (
  id text primary key,                          -- nanoid, used in URL
  admin_key text not null unique,               -- secret key for admin access
  title text not null default 'Qui est le plus… ?',
  created_at timestamptz not null default now()
);

-- 2. QUESTIONS
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null references public.quizzes(id) on delete cascade,
  text text not null,
  sort_order int not null default 0
);

-- 3. CHOICES
create table public.choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,                          -- display name
  photo_path text                               -- path in Supabase storage
);

-- 4. VOTES
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null references public.quizzes(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_id uuid not null references public.choices(id) on delete cascade,
  player_id text not null,                      -- anonymous cookie-based ID
  created_at timestamptz not null default now(),
  -- one vote per player per question
  unique(question_id, player_id)
);

-- =============================================
-- INDEXES
-- =============================================
create index idx_questions_quiz on public.questions(quiz_id);
create index idx_choices_question on public.choices(question_id);
create index idx_votes_quiz on public.votes(quiz_id);
create index idx_votes_question on public.votes(question_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.votes enable row level security;

-- Everyone can read quizzes (needed to play)
create policy "quizzes_read" on public.quizzes for select using (true);
-- Anyone can create a quiz (no auth required)
create policy "quizzes_insert" on public.quizzes for insert with check (true);

-- Questions: read all, insert allowed
create policy "questions_read" on public.questions for select using (true);
create policy "questions_insert" on public.questions for insert with check (true);

-- Choices: read all, insert allowed
create policy "choices_read" on public.choices for select using (true);
create policy "choices_insert" on public.choices for insert with check (true);

-- Votes: read all (for results), insert allowed
create policy "votes_read" on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert with check (true);

-- =============================================
-- STORAGE BUCKET FOR PHOTOS
-- =============================================
-- Run separately in Supabase dashboard or via:
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true);

-- Allow anyone to upload to photos bucket
create policy "photos_upload" on storage.objects
  for insert with check (bucket_id = 'photos');

-- Allow public read
create policy "photos_read" on storage.objects
  for select using (bucket_id = 'photos');
