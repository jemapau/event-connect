-- EventConnect Initial Schema
-- Migration: 001_initial.sql

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin VARCHAR(6) NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'lobby',
  -- states: 'lobby' | 'active' | 'question' | 'voting' | 'results' | 'matching' | 'closed'
  current_activity_id UUID,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 4,
  matching_mode TEXT DEFAULT 'interests',
  -- matching modes: 'random' | 'interests' | 'rounds'
  current_icebreaker TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '4 hours')
);

-- Participants (anonymous auth)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '😊',
  profession TEXT DEFAULT 'otro',
  -- professions: 'diseno_ux' | 'diseno_ui' | 'product_design' | 'otro'
  profession_custom TEXT,
  interests TEXT[] DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  -- contact_info: { linkedin?: string, email?: string, twitter?: string }
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(session_id, display_name)
);

-- Activities (icebreakers, quizzes, polls, matching)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  -- types: 'icebreaker' | 'quiz' | 'poll' | 'wordcloud' | 'matching' | 'open_question'
  title TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  state TEXT DEFAULT 'pending',
  -- activity states: 'pending' | 'active' | 'completed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participant responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  score_earned INTEGER DEFAULT 0,
  responded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(activity_id, participant_id)
);

-- Networking matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_a UUID NOT NULL REFERENCES participants(id),
  participant_b UUID NOT NULL REFERENCES participants(id),
  match_score FLOAT,
  round INTEGER DEFAULT 1,
  contact_exchanged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sessions_pin ON sessions(pin) WHERE state != 'closed';
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_responses_activity ON responses(activity_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_matches_session_round ON matches(session_id, round);

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Hosts can manage their own sessions
CREATE POLICY "hosts_manage_sessions" ON sessions
  FOR ALL USING (auth.uid() = host_id);

-- Anyone can read active sessions (to join)
CREATE POLICY "anyone_reads_active_sessions" ON sessions
  FOR SELECT USING (state != 'closed');

-- Participants can insert themselves
CREATE POLICY "join_session" ON participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Participants can read others in their session
CREATE POLICY "read_session_participants" ON participants
  FOR SELECT USING (
    session_id IN (SELECT session_id FROM participants WHERE user_id = auth.uid())
  );

-- Anyone can read activities (needed to display quiz questions to players)
CREATE POLICY "read_activities" ON activities
  FOR SELECT USING (true);

-- Hosts can manage activities
CREATE POLICY "hosts_manage_activities" ON activities
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE host_id = auth.uid())
  );

-- Participants can insert their own responses
CREATE POLICY "insert_response" ON responses
  FOR INSERT WITH CHECK (
    participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
  );

-- Anyone can read responses (for result displays)
CREATE POLICY "read_responses" ON responses
  FOR SELECT USING (true);

-- Anyone can read matches in their session
CREATE POLICY "read_matches" ON matches
  FOR SELECT USING (true);

-- Hosts can manage matches
CREATE POLICY "hosts_manage_matches" ON matches
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE host_id = auth.uid())
  );

-- Cleanup expired sessions (run with pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE sessions SET state = 'closed' WHERE expires_at < now() AND state != 'closed';
END;
$$ LANGUAGE plpgsql;
