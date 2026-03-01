-- Fix: Enable Supabase Realtime on all EventConnect tables
-- Run this in the Supabase SQL Editor

-- Add tables to the supabase_realtime publication so that
-- postgres_changes events are emitted for these tables.
-- Without this, the useParticipants hook never fires.

ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;
