-- Fix function search_path security warnings by recreating functions with proper search_path

-- Fix process_batch_job function
CREATE OR REPLACE FUNCTION public.process_batch_job(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix set_timestamp function
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create triggers for updated_at on all tables that need it
DROP TRIGGER IF EXISTS set_timestamp_projects ON public.projects;
CREATE TRIGGER set_timestamp_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_templates ON public.templates;
CREATE TRIGGER set_timestamp_templates
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_uploads ON public.uploads;
CREATE TRIGGER set_timestamp_uploads
  BEFORE UPDATE ON public.uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_mappings ON public.mappings;
CREATE TRIGGER set_timestamp_mappings
  BEFORE UPDATE ON public.mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_batch_jobs ON public.batch_jobs;
CREATE TRIGGER set_timestamp_batch_jobs
  BEFORE UPDATE ON public.batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamp();