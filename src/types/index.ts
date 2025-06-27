export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  settings: PollSettings;
  created_by: string;
  created_at: string;
  ends_at?: string;
  creator_email?: string;
  vote_count?: number;
}

export interface PollSettings {
  allow_multiple_selections: boolean;
  show_results_before_voting: boolean;
  allow_vote_changes: boolean;
}

export interface Vote {
  id: string;
  poll_id: string;
  user_id?: string;
  ip_hash?: string;
  selected_options: number[];
  created_at: string;
}

export interface VoteResult {
  option_index: number;
  option_text: string;
  vote_count: number;
  percentage: number;
}

export interface CreatePollData {
  question: string;
  options: string[];
  settings: PollSettings;
  ends_at?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}