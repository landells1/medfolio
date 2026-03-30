import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let client: BrowserSupabaseClient | null = null;

export function createClient(): BrowserSupabaseClient {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        // Disable Web Locks API — this is the root cause of all hangs
        lock: (_name: string, _opts: unknown, fn: () => Promise<unknown>) => fn(),
      },
    }
  );

  return client;
}
