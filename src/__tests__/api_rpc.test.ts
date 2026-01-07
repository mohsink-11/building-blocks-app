/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import * as api from '@/integrations/supabase/api';
import { supabase } from '@/integrations/supabase/client';

it('processBatchJob calls rpc', async () => {
  const rpcMock = vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: null, error: null } as any);
  const res = await api.processBatchJob('job-123');
  expect(rpcMock).toHaveBeenCalledWith('process_batch_job', { job_id: 'job-123' });
  rpcMock.mockRestore();
});