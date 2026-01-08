/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '@/integrations/supabase/api';
import { supabase } from '@/integrations/supabase/client';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('supabase api helpers', () => {
  it('createProject calls supabase.insert', async () => {
    const mock = vi.spyOn(supabase, 'from').mockReturnValue({ insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'p1' }, error: null }) } as any);
    const { data, error } = await api.createProject({ name: 'Test' });
    expect(data).toBeDefined();
    expect(error).toBeNull();
    mock.mockRestore();
  });

  it('createTemplate calls supabase.insert', async () => {
    const mock = vi.spyOn(supabase, 'from').mockReturnValue({ insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 't1' }, error: null }) } as any);
    const { data, error } = await api.createTemplate({ name: 'T' });
    expect(data).toBeDefined();
    expect(error).toBeNull();
    mock.mockRestore();
  });

  it('updateProject calls supabase.update', async () => {
    const mock = vi.spyOn(supabase, 'from').mockReturnValue({ update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'p1', name: 'Updated' }, error: null }) } as any);
    const { data, error } = await api.updateProject('p1', { name: 'Updated' });
    expect(data).toBeDefined();
    expect(data?.id).toBe('p1');
    expect(error).toBeNull();
    mock.mockRestore();
  });
});