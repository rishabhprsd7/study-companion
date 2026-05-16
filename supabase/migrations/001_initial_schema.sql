-- Enable pgvector
create extension if not exists vector;

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  learner_type text check (learner_type in ('school','university','language','professional','certification')),
  default_mode text default 'simple' check (default_mode in ('beginner','simple','exam','advanced')),
  created_at timestamptz default now()
);

-- Study sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text,
  subject text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  recap jsonb
);

-- Uploaded files
create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  kind text not null check (kind in ('screenshot','pdf','text')),
  storage_path text,
  ocr_text text,
  detected_topic text,
  language text,
  created_at timestamptz default now()
);

-- Topics tracked per user
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  subject text,
  mastery_score numeric default 0.5 check (mastery_score between 0 and 1),
  last_seen_at timestamptz default now(),
  unique (user_id, name)
);

-- AI-generated notes
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references uploads(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete set null,
  markdown text not null,
  summary text,
  concept_cards jsonb default '[]',
  created_at timestamptz default now()
);

-- Chat messages per session
create table if not exists messages (
  id bigserial primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  mode text check (mode in ('beginner','simple','exam','advanced')),
  tokens_in int,
  tokens_out int,
  created_at timestamptz default now()
);

-- Practice items
create table if not exists practice_items (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade not null,
  kind text not null check (kind in ('mcq','fill','flashcard','correction','short')),
  payload jsonb not null,
  difficulty int default 1 check (difficulty between 1 and 5),
  created_at timestamptz default now()
);

-- Practice attempts (for mastery tracking)
create table if not exists practice_attempts (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  item_id uuid references practice_items(id) on delete cascade not null,
  correct boolean not null,
  response jsonb,
  created_at timestamptz default now()
);

-- Confusion signals
create table if not exists confusions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete set null,
  signal text not null,
  details jsonb,
  weight numeric default 1.0,
  created_at timestamptz default now()
);

-- Concept graph edges (replaces Neo4j for MVP)
create table if not exists concept_edges (
  from_concept_id uuid references topics(id) on delete cascade,
  to_concept_id uuid references topics(id) on delete cascade,
  kind text not null default 'related',
  weight numeric default 0.5,
  primary key (from_concept_id, to_concept_id, kind)
);

-- Embeddings for RAG
create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  source_type text not null,
  source_id uuid,
  chunk text not null,
  embedding vector(768),
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists embeddings_vector_idx on embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- =========================================
-- Row Level Security
-- =========================================
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table uploads enable row level security;
alter table topics enable row level security;
alter table notes enable row level security;
alter table messages enable row level security;
alter table practice_items enable row level security;
alter table practice_attempts enable row level security;
alter table confusions enable row level security;
alter table concept_edges enable row level security;
alter table embeddings enable row level security;

-- Profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Sessions
create policy "Users can CRUD own sessions" on sessions for all using (auth.uid() = user_id);

-- Uploads
create policy "Users can CRUD own uploads" on uploads for all using (auth.uid() = user_id);

-- Topics
create policy "Users can CRUD own topics" on topics for all using (auth.uid() = user_id);

-- Notes (via uploads)
create policy "Users can view own notes" on notes for select
  using (exists (select 1 from uploads where uploads.id = notes.upload_id and uploads.user_id = auth.uid()));
create policy "Users can insert own notes" on notes for insert
  with check (exists (select 1 from uploads where uploads.id = notes.upload_id and uploads.user_id = auth.uid()));

-- Messages
create policy "Users can CRUD own messages" on messages for all
  using (exists (select 1 from sessions where sessions.id = messages.session_id and sessions.user_id = auth.uid()));

-- Practice items (via topics)
create policy "Users can view own practice items" on practice_items for select
  using (exists (select 1 from topics where topics.id = practice_items.topic_id and topics.user_id = auth.uid()));
create policy "Users can insert own practice items" on practice_items for insert
  with check (exists (select 1 from topics where topics.id = practice_items.topic_id and topics.user_id = auth.uid()));

-- Practice attempts
create policy "Users can CRUD own attempts" on practice_attempts for all using (auth.uid() = user_id);

-- Confusions
create policy "Users can CRUD own confusions" on confusions for all using (auth.uid() = user_id);

-- Embeddings
create policy "Users can CRUD own embeddings" on embeddings for all using (auth.uid() = user_id);

-- Concept edges (via topics)
create policy "Users can view own concept edges" on concept_edges for select
  using (exists (select 1 from topics where topics.id = concept_edges.from_concept_id and topics.user_id = auth.uid()));

-- =========================================
-- Trigger: auto-create profile on signup
-- =========================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
