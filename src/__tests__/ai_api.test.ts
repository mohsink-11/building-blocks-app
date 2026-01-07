/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMappingSuggestions } from '@/integrations/supabase/api';
import { supabase } from '@/integrations/supabase/client';

beforeEach(() => vi.restoreAllMocks());

describe('AI mapping suggestions', () => {
  it('calls supabase.functions.invoke and returns parsed suggestions', async () => {
    const fakeResp = { data: JSON.stringify({ suggestions: [{ id: 's1', text: 'Map Item Number -> part_no', mapping: { target: 'part_no' } }] }) } as { data: string };
    // Some versions of the Supabase client embed functions in an object; easiest is to replace invoke directly
    const invokeMock = vi.fn().mockResolvedValue(fakeResp);
    // Spy on the `functions` getter to return an object with `invoke` so tests work across client versions
    vi.spyOn(supabase as any, 'functions', 'get').mockReturnValue({ invoke: invokeMock });

    const { data, error } = await getMappingSuggestions(['Item Number', 'Description']);
    expect(invokeMock).toHaveBeenCalledWith('ai-suggest-mappings', { body: JSON.stringify({ columns: ['Item Number', 'Description'], project: undefined }) });
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data[0].mapping.target).toBe('part_no');

    if (invokeMock.mockRestore) invokeMock.mockRestore();
  });
});