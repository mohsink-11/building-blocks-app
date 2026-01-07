import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type AuthUser = User;

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // Temporary debug log for auth issues — remove when stable
    // eslint-disable-next-line no-console
    console.log('[auth] signIn result', { data, error });
    return { data, error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata, emailRedirectTo:`${window.location.origin}/auth/confirm` } });
    // Temporary debug log for auth issues — remove when stable
    // eslint-disable-next-line no-console
    console.log('[auth] signUp result', { data, error });
    return { data, error };
  }, []);

  const signInWithProvider = useCallback(async (provider: 'google' | 'github' | 'azure') => {
    const redirectTo = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    // Debug log for provider sign-in
    // eslint-disable-next-line no-console
    console.log('[auth] signInWithProvider result', { provider, data, error });

    // If the provider returns a redirect URL, navigate immediately. Some provider
    // configurations may embed a `redirect_to` (or `redirectTo`) query parameter
    // that points to an unexpected origin (e.g., http://localhost:3000). To avoid
    // the browser going to a non-running port, rewrite that param to the current
    // origin and then navigate. This keeps the UX consistent in dev.
    if (data?.url) {
      try {
        const url = new URL(data.url);
        const paramName = url.searchParams.has('redirect_to') ? 'redirect_to' : 'redirectTo';
        const currentRedirect = url.searchParams.get(paramName);
        if (currentRedirect) {
          const parsed = new URL(currentRedirect);
          if (parsed.origin !== window.location.origin) {
            url.searchParams.set(paramName, `${window.location.origin}/dashboard`);
            const fixed = url.toString();
            // eslint-disable-next-line no-console
            console.log('[auth] signInWithProvider adjusted oauth url to current origin:', fixed);
            window.location.href = fixed;
            return { data, error };
          }
        }
      } catch (e) {
        // ignore parsing errors and fall through to default navigation
      }

      // Default: navigate to the returned URL
      window.location.href = data.url;
    }

    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    // eslint-disable-next-line no-console
    console.log('[auth] signOut result', { error });
    return { error };
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
  } as const;
}
