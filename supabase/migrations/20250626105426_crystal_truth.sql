/*
  # Complete Polling Application Schema

  1. New Tables
    - `polls`
      - `id` (uuid, primary key)
      - `question` (text, poll question)
      - `options` (jsonb, array of poll options)
      - `settings` (jsonb, poll configuration)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `ends_at` (timestamp, optional end date)
      - `is_active` (boolean, poll status)
    
    - `votes`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, foreign key to polls)
      - `user_id` (uuid, optional foreign key to auth.users)
      - `ip_hash` (text, for anonymous voting)
      - `selected_options` (jsonb, array of selected option indices)
      - `created_at` (timestamp)
    
    - `profiles`
      - `id` (uuid, primary key, foreign key to auth.users)
      - `email` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for reading polls (public)
    - Add policies for creating polls (authenticated users only)
    - Add policies for voting (public with duplicate prevention)
    - Add policies for user profiles

  3. Indexes
    - Add indexes for performance on commonly queried columns
*/

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{
    "allow_multiple_selections": false,
    "show_results_before_voting": false,
    "allow_vote_changes": false
  }'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  is_active boolean DEFAULT true
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text,
  selected_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT votes_user_or_ip_check CHECK (user_id IS NOT NULL OR ip_hash IS NOT NULL)
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS polls_created_by_idx ON polls(created_by);
CREATE INDEX IF NOT EXISTS polls_created_at_idx ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS polls_ends_at_idx ON polls(ends_at);
CREATE INDEX IF NOT EXISTS votes_poll_id_idx ON votes(poll_id);
CREATE INDEX IF NOT EXISTS votes_user_id_idx ON votes(user_id);
CREATE INDEX IF NOT EXISTS votes_ip_hash_idx ON votes(ip_hash);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Anyone can read polls"
  ON polls
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create polls"
  ON polls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Poll creators can update their polls"
  ON polls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Poll creators can delete their polls"
  ON polls
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Votes policies
CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create votes"
  ON votes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own votes"
  ON votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to get poll results with vote counts
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  poll_options jsonb;
  results jsonb := '[]'::jsonb;
  option_text text;
  option_index int;
  vote_count int;
  total_votes int;
BEGIN
  -- Get poll options
  SELECT options INTO poll_options FROM polls WHERE id = poll_uuid;
  
  -- Get total vote count
  SELECT COUNT(*) INTO total_votes FROM votes WHERE poll_id = poll_uuid;
  
  -- Build results for each option
  FOR option_index IN 0..(jsonb_array_length(poll_options) - 1)
  LOOP
    SELECT poll_options->>option_index INTO option_text;
    
    -- Count votes for this option
    SELECT COUNT(*) INTO vote_count
    FROM votes
    WHERE poll_id = poll_uuid
    AND selected_options ? option_index::text;
    
    -- Add to results
    results := results || jsonb_build_object(
      'option_index', option_index,
      'option_text', option_text,
      'vote_count', vote_count,
      'percentage', CASE WHEN total_votes > 0 THEN ROUND((vote_count::numeric / total_votes::numeric) * 100, 1) ELSE 0 END
    );
  END LOOP;
  
  RETURN results;
END;
$$ LANGUAGE plpgsql;