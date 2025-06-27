/*
  # Fix Missing Database Tables and Relationships

  This migration ensures all required tables, relationships, and functions exist.
  
  1. Tables
    - Ensure `profiles` table exists with proper relationship to auth.users
    - Ensure `polls` table exists with foreign key to profiles
    - Ensure `votes` table exists with proper relationships
  
  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for all operations
  
  3. Functions
    - Create get_poll_results function for vote aggregation
    - Create profile creation trigger
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create polls table if it doesn't exist
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{
    "allow_multiple_selections": false,
    "show_results_before_voting": false,
    "allow_vote_changes": false
  }'::jsonb,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  is_active boolean DEFAULT true
);

-- Create votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text,
  selected_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT votes_user_or_ip_check CHECK (user_id IS NOT NULL OR ip_hash IS NOT NULL)
);

-- Add foreign key constraint name for polls -> profiles relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'polls_created_by_fkey' 
    AND table_name = 'polls'
  ) THEN
    ALTER TABLE polls 
    ADD CONSTRAINT polls_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

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

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read polls" ON polls;
DROP POLICY IF EXISTS "Authenticated users can create polls" ON polls;
DROP POLICY IF EXISTS "Poll creators can update their polls" ON polls;
DROP POLICY IF EXISTS "Poll creators can delete their polls" ON polls;
DROP POLICY IF EXISTS "Anyone can read votes" ON votes;
DROP POLICY IF EXISTS "Anyone can create votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

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
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
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
  
  IF poll_options IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  
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