// Shared TypeScript types for EventConnect

export type SessionState =
  | 'lobby'      // Waiting for participants
  | 'active'     // Running, between activities
  | 'question'   // Quiz question active
  | 'voting'     // Poll/voting active
  | 'matching'   // Networking round active
  | 'results'    // Showing results
  | 'closed';    // Session ended

export type ActivityType =
  | 'quiz'
  | 'poll'
  | 'wordcloud'
  | 'icebreaker'
  | 'matching'
  | 'networking'
  | 'open_question';

export type MatchingMode = 'random' | 'interests' | 'rounds';

export type Profession = 'diseno_ux' | 'diseno_ui' | 'product_design' | 'otro';

export const PROFESSION_LABELS: Record<Profession, string> = {
  diseno_ux: 'UX Design',
  diseno_ui: 'UI Design',
  product_design: 'Product Design',
  otro: 'Otro',
};

export interface Session {
  id: string;
  pin: string;
  host_id: string;
  title: string;
  state: SessionState;
  current_activity_id?: string;
  current_round: number;
  total_rounds: number;
  matching_mode: MatchingMode;
  current_icebreaker?: string;
  config: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  user_id?: string;
  display_name: string;
  avatar_emoji: string;
  profession: Profession;
  profession_custom?: string;
  interests: string[];
  contact_info: {
    linkedin?: string;
    email?: string;
    twitter?: string;
  };
  score: number;
  joined_at: string;
  is_active: boolean;
}

export interface Activity {
  id: string;
  session_id: string;
  type: ActivityType;
  title: string;
  config: {
    // Quiz
    question?: string;
    options?: string[];
    correct_index?: number;
    time_limit_seconds?: number;
    // Poll
    // (uses question + options)
    // Wordcloud
    prompt?: string;
    max_words?: number;
    // Matching
    criteria?: string;
    rounds?: number;
    icebreaker_prompt?: string;
    // Networking
    duration_seconds?: number;
  };
  sort_order: number;
  state: 'pending' | 'active' | 'completed';
  created_at: string;
}

export interface Response {
  id: string;
  activity_id: string;
  participant_id: string;
  value: {
    selected_index?: number;
    text?: string;
    words?: string[];
  };
  score_earned: number;
  responded_at: string;
}

export interface Match {
  id: string;
  session_id: string;
  participant_a?: string;
  participant_b?: string;
  participant_ids: string[];
  match_score?: number;
  round: number;
  contact_exchanged: boolean;
  created_at: string;
}

export interface PlayerMatch {
  partnerId: string;
  partnerName: string;
  partnerProfession: string;
  partnerContact?: string;
  icebreaker: string;
  round: number;
  totalRounds: number;
  timeRemainingSeconds: number;
}

export interface LiveStats {
  connected: number;
  waiting: number;
  responding: number;
  avgTimeSeconds: number;
  topScore: number;
}
