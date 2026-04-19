-- =============================================
-- BlogForge — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. BLOGS TABLE
create table if not exists public.blogs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  slug text unique not null,
  logo_url text,
  is_public boolean default true,
  created_at timestamp with time zone default now()
);

-- 2. POSTS TABLE
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  blog_id uuid references public.blogs(id) on delete cascade not null,
  title text not null,
  slug text not null,
  content text,
  excerpt text,
  cover_image text,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  views integer default 0,
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(blog_id, slug)
);

-- 3. TAGS TABLE
create table if not exists public.tags (
  id uuid default gen_random_uuid() primary key,
  blog_id uuid references public.blogs(id) on delete cascade not null,
  name text not null,
  slug text not null,
  unique(blog_id, slug)
);

-- 4. POST_TAGS JUNCTION TABLE
create table if not exists public.post_tags (
  post_id uuid references public.posts(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.blogs enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;

-- BLOGS: owner can do everything, public can read public blogs
create policy "Users manage own blogs"
  on public.blogs for all
  using (user_id = auth.uid());

create policy "Public can read public blogs"
  on public.blogs for select
  using (is_public = true);

-- POSTS: owner can manage, public can read published posts
create policy "Users manage own posts"
  on public.posts for all
  using (
    blog_id in (
      select id from public.blogs where user_id = auth.uid()
    )
  );

create policy "Public can read published posts"
  on public.posts for select
  using (
    status = 'published' and
    blog_id in (select id from public.blogs where is_public = true)
  );

-- TAGS: same pattern
create policy "Users manage own tags"
  on public.tags for all
  using (
    blog_id in (
      select id from public.blogs where user_id = auth.uid()
    )
  );

create policy "Public can read tags"
  on public.tags for select
  using (
    blog_id in (select id from public.blogs where is_public = true)
  );

-- POST_TAGS: owner can manage
create policy "Users manage own post tags"
  on public.post_tags for all
  using (
    post_id in (
      select p.id from public.posts p
      join public.blogs b on p.blog_id = b.id
      where b.user_id = auth.uid()
    )
  );

-- =============================================
-- AUTO UPDATE updated_at
-- =============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_posts_updated_at
  before update on public.posts
  for each row execute function public.update_updated_at();

-- =============================================
-- INCREMENT VIEWS (safe, no auth needed)
-- =============================================
create or replace function public.increment_post_views(post_id uuid)
returns void as $$
begin
  update public.posts set views = views + 1 where id = post_id;
end;
$$ language plpgsql security definer;
