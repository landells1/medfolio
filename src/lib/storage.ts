import { createClient } from '@/lib/supabase/client';

/** Per-user storage quota in bytes (250 MB). Must match migration 004. */
export const STORAGE_LIMIT_BYTES = 250 * 1024 * 1024; // 262,144,000

/** Human-readable quota label */
export const STORAGE_LIMIT_LABEL = '250 MB';

/**
 * Returns the total bytes used by the current user across all uploads.
 * Uses the same get_user_storage_used() function as the RLS policy so
 * the client-side check always matches the server-side enforcement.
 */
export async function getUserStorageUsed(userId: string): Promise<number> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_user_storage_used', {
    p_user_id: userId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

/** Formats bytes as a human-readable string, e.g. "12.4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns 0–100 percentage of quota used */
export function storageUsedPercent(usedBytes: number): number {
  return Math.min(100, Math.round((usedBytes / STORAGE_LIMIT_BYTES) * 100));
}
