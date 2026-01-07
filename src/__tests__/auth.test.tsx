// Converted to TSX so we can mount a React component in tests
import { render, act, waitFor } from '@testing-library/react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

function HookTester({ onReady }: { onReady: (api: ReturnType<typeof useAuth>) => void }) {
  const api = useAuth();
  React.useEffect(() => {
    onReady(api);
  }, [api, onReady]);
  return null;
}

describe('useAuth hook', () => {
  it('calls signInWithPassword on signIn', async () => {
    const spy = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({ data: null, error: null } as any);

    render(
      <HookTester
        onReady={(api) => {
          api.signIn('a@b.com', 'pw');
        }}
      />
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
      spy.mockRestore();
    });
  });

  it('calls signUp on signUp with metadata', async () => {
    const spy = vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({ data: null, error: null } as any);

    render(
      <HookTester
        onReady={(api) => {
          api.signUp('x@y.com', 'pw12345', { name: 'X' } as any);
        }}
      />
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});