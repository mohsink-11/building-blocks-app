import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://sqevpljhffbpqpdhxxgp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZXZwbGpoZmZicHFwZGh4eGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODIzOTMsImV4cCI6MjA4MjY1ODM5M30.M2p9Uv8JeHlqnT1VN8aAU8EPyllj46Xt-u56W9BnftU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});