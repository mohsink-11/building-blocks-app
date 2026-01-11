// Insert a new file record for a project
export async function addProjectFile({ project_id, name, rows, processed_at }: { project_id: string, name: string, rows?: number, processed_at?: string }) {
  const sb = supabase as any;
  const { data, error } = await sb.from('project_files').insert([
    { project_id, name, rows, processed_at }
  ]).select('*').single();
  return { data, error };
}

// Insert a new export record for a project
export async function addProjectExport({ project_id, name, size, created_at }: { project_id: string, name: string, size?: string, created_at?: string }) {
  const sb = supabase as any;
  const { data, error } = await sb.from('project_exports').insert([
    { project_id, name, size, created_at }
  ]).select('*').single();
  return { data, error };
}

// Insert a new activity record for a project
export async function addProjectActivity({ project_id, type, description, created_at }: { project_id: string, type: string, description?: string, created_at?: string }) {
  const sb = supabase as any;
  const { data, error } = await sb.from('project_activity').insert([
    { project_id, type, description, created_at }
  ]).select('*').single();
  return { data, error };
}
import { supabase } from './client';

export interface ProjectInsert {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
  // Optional owner id to satisfy RLS policies that require auth.uid() = owner
  owner?: string;
}

export interface TemplateInsert {
  name: string;
  description?: string;
  category?: string;
  config?: Record<string, unknown>;
  is_public?: boolean;
}

const sb = supabase as any;

export async function createProject(data: ProjectInsert) {
  const { data: res, error } = await sb.from('projects').insert([{ ...data }]).select('*').single();
  return { data: res, error };
}

export async function listProjects() {
  const { data, error } = await sb.from('projects').select('*').order('created_at', { ascending: false });
  return { data, error };
}

export async function createTemplate(data: TemplateInsert) {
  const { data: res, error } = await sb.from('templates').insert([{ ...data }]).select('*').single();
  return { data: res, error };
}

export async function listTemplates() {
  const { data, error } = await sb.from('templates').select('*').order('created_at', { ascending: false });
  return { data, error };
}

export async function createBatchJob(args: Record<string, unknown>) {
  const { data, error } = await sb.from('batch_jobs').insert([{ args }]).select('*').single();
  return { data, error };
}

export async function getBatchJob(id: string) {
  const { data, error } = await sb.from('batch_jobs').select('*').eq('id', id).single();
  return { data, error };
}

export async function updateProject(id: string, data: Partial<ProjectInsert> & { stats?: Record<string, unknown> }) {
  const { data: res, error } = await sb.from('projects').update({ ...data }).eq('id', id).select('*').single();
  return { data: res, error };
}

export async function processBatchJob(jobId: string) {
  const { data, error } = await sb.rpc('process_batch_job', { job_id: jobId });
  return { data, error };
}

export async function getMappingSuggestions(columns: string[], project?: Record<string, unknown>) {
  try {
    const payload = { columns, project };
    const res = await supabase.functions.invoke('ai-suggest-mappings', { body: JSON.stringify(payload) });
    // Debug: log raw function response for diagnostics
    // eslint-disable-next-line no-console
    console.log('[api] functions.invoke response', { res });
    if (!res || !res.data) {
      return { data: null, error: new Error('No response from function') };
    }

    // If function returned JSON string, try to parse
    let parsed: unknown;
    try {
      parsed = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    } catch (e) {
      parsed = { suggestions: [] } as { suggestions: Array<Record<string, unknown>> };
    }

    type MappingFunctionResponse = { suggestions?: Array<Record<string, unknown>> };
    const parsedResp = parsed as MappingFunctionResponse;

    return { data: parsedResp.suggestions ?? parsed, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  return { error };
}

export async function getProjectDetail(id: string) {
  const sb = supabase as any;
  // Fetch project
  const { data: project, error: projectError } = await sb
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  // Fetch related files
  const { data: files, error: filesError } = await sb
    .from('project_files')
    .select('*')
    .eq('project_id', id);

  // Fetch related exports
  const { data: exports, error: exportsError } = await sb
    .from('project_exports')
    .select('*')
    .eq('project_id', id);

  // Fetch related activity
  const { data: activity, error: activityError } = await sb
    .from('project_activity')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  // Combine errors if any
  const error = projectError || filesError || exportsError || activityError;

  // Return combined data
  return {
    data: {
      ...project,
      files: files ?? [],
      exports: exports ?? [],
      activity: activity ?? [],
    },
    error,
  };
}
