-- =========================================
-- Extensions
-- =========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================
-- Profiles
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  account_type text,
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- =========================================
-- Projects
-- =========================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select"
ON public.projects
FOR SELECT
USING (auth.uid() = owner);

CREATE POLICY "projects_insert"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = owner);

CREATE POLICY "projects_update"
ON public.projects
FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "projects_delete"
ON public.projects
FOR DELETE
USING (auth.uid() = owner);

-- =========================================
-- Templates
-- =========================================
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  category text,
  config jsonb DEFAULT '{}'::jsonb,
  usage_count int DEFAULT 0,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Public OR owner can read
CREATE POLICY "templates_select"
ON public.templates
FOR SELECT
USING (is_public OR auth.uid() = owner);

-- Owner only write
CREATE POLICY "templates_insert"
ON public.templates
FOR INSERT
WITH CHECK (auth.uid() = owner);

CREATE POLICY "templates_update"
ON public.templates
FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "templates_delete"
ON public.templates
FOR DELETE
USING (auth.uid() = owner);

-- =========================================
-- Uploads
-- =========================================
CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  owner uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  size bigint,
  status text DEFAULT 'uploaded',
  columns jsonb,
  row_count int,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uploads_select"
ON public.uploads
FOR SELECT
USING (auth.uid() = owner);

CREATE POLICY "uploads_insert"
ON public.uploads
FOR INSERT
WITH CHECK (auth.uid() = owner);

CREATE POLICY "uploads_update"
ON public.uploads
FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "uploads_delete"
ON public.uploads
FOR DELETE
USING (auth.uid() = owner);

-- =========================================
-- Mappings
-- =========================================
CREATE TABLE IF NOT EXISTS public.mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  mapping jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mappings_select"
ON public.mappings
FOR SELECT
USING (
  auth.uid() = (SELECT owner FROM public.projects WHERE id = project_id)
);

CREATE POLICY "mappings_insert"
ON public.mappings
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT owner FROM public.projects WHERE id = project_id)
);

CREATE POLICY "mappings_update"
ON public.mappings
FOR UPDATE
USING (
  auth.uid() = (SELECT owner FROM public.projects WHERE id = project_id)
)
WITH CHECK (
  auth.uid() = (SELECT owner FROM public.projects WHERE id = project_id)
);

CREATE POLICY "mappings_delete"
ON public.mappings
FOR DELETE
USING (
  auth.uid() = (SELECT owner FROM public.projects WHERE id = project_id)
);

-- =========================================
-- Batch Jobs
-- =========================================
CREATE TABLE IF NOT EXISTS public.batch_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'queued',
  progress int DEFAULT 0,
  args jsonb DEFAULT '{}'::jsonb,
  result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batch_jobs_select"
ON public.batch_jobs
FOR SELECT
USING (auth.uid() = owner);

CREATE POLICY "batch_jobs_insert"
ON public.batch_jobs
FOR INSERT
WITH CHECK (auth.uid() = owner);

CREATE POLICY "batch_jobs_update"
ON public.batch_jobs
FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "batch_jobs_delete"
ON public.batch_jobs
FOR DELETE
USING (auth.uid() = owner);

-- =========================================
-- RPC: process_batch_job
-- =========================================
CREATE OR REPLACE FUNCTION public.process_batch_job(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.batch_jobs
  SET status = 'running', updated_at = now()
  WHERE id = job_id;

  PERFORM pg_sleep(0.01);

  UPDATE public.batch_jobs
  SET
    status = 'succeeded',
    progress = 100,
    result = jsonb_build_object('message', 'done'),
    updated_at = now()
  WHERE id = job_id;
END;
$$;

-- =========================================
-- Timestamp trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

CREATE TRIGGER set_timestamp_projects
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

CREATE TRIGGER set_timestamp_templates
BEFORE UPDATE ON public.templates
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

CREATE TRIGGER set_timestamp_uploads
BEFORE UPDATE ON public.uploads
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

CREATE TRIGGER set_timestamp_mappings
BEFORE UPDATE ON public.mappings
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

CREATE TRIGGER set_timestamp_batch_jobs
BEFORE UPDATE ON public.batch_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
