-- Storage quota enforcement.
--
-- Each user is limited to STORAGE_LIMIT_BYTES of uploaded file storage.
-- The limit is checked client-side before upload (fast UX) and server-side
-- via RLS policy (cannot be bypassed).
--
-- Current limit: 250 MB per user (262,144,000 bytes).
-- To raise the limit in future: update the constant in this function and
-- re-run it, or change the value in src/lib/storage.ts on the client side.

-- Function: returns total bytes used by a user
CREATE OR REPLACE FUNCTION get_user_storage_used(p_user_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(file_size), 0)::BIGINT
  FROM uploads
  WHERE user_id = p_user_id;
$$;

-- RLS policy: block INSERT on uploads if user is over quota.
-- This enforces the limit server-side so it cannot be bypassed by the client.
-- Drop existing policy if it exists, then recreate.
DROP POLICY IF EXISTS "enforce_storage_quota" ON uploads;

CREATE POLICY "enforce_storage_quota" ON uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_storage_used(auth.uid()) + file_size <= 262144000  -- 250 MB
  );
