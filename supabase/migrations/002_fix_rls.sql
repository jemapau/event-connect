-- Fix: infinite recursion in participants RLS policy
-- The original "read_session_participants" policy caused infinite recursion
-- because it queried the same "participants" table from within a participants policy.
--
-- Run this in the Supabase SQL Editor AFTER running 001_initial.sql

-- Drop the recursive policy
DROP POLICY IF EXISTS "read_session_participants" ON participants;

-- Drop the original insert policy (we'll replace it too)
DROP POLICY IF EXISTS "join_session" ON participants;

-- NEW: Anyone can read participants (needed for join flow and realtime)
-- Security is handled at the session level (sessions are only active for valid PINs)
CREATE POLICY "anyone_reads_participants" ON participants
  FOR SELECT USING (true);

-- NEW: Anyone can insert a participant (the API route validates the PIN and session)
-- The API route uses the service role key for actual inserts, so this covers anon inserts
CREATE POLICY "anyone_inserts_participants" ON participants
  FOR INSERT WITH CHECK (true);

-- Hosts can update participants in their sessions (e.g., scores)
CREATE POLICY "hosts_update_participants" ON participants
  FOR UPDATE USING (
    session_id IN (SELECT id FROM sessions WHERE host_id = auth.uid())
  );

-- Hosts can delete participants in their sessions
CREATE POLICY "hosts_delete_participants" ON participants
  FOR DELETE USING (
    session_id IN (SELECT id FROM sessions WHERE host_id = auth.uid())
  );

-- Also fix responses insert policy which had the same pattern
DROP POLICY IF EXISTS "insert_response" ON responses;

CREATE POLICY "anyone_inserts_responses" ON responses
  FOR INSERT WITH CHECK (true);
