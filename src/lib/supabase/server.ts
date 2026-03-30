export function createServerSupabaseClient() {
  throw new Error(
    'Server-side Supabase client creation is disabled in this app. Use the singleton browser client on the callback page.'
  );
}
