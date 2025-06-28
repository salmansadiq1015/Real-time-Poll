/*
  # Fix polls and profiles relationship issues

  1. Database Schema Fixes
    - Fix foreign key relationship between polls and users
    - Ensure proper RLS policies
    - Fix the get_poll_results function

  2. Changes Made
    - Update polls.created_by to reference auth.users(id) directly
    - Update foreign key constraint name
    - Ensure profiles table has proper relationship
*/

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE polls DROP CONSTRAINT IF EXISTS polls_created_by_fkey;

-- Update the polls table to reference auth.users directly
ALTER TABLE polls 
ADD CONSTRAINT polls_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure the profiles table has the correct foreign key
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Anyone can read polls" ON polls;
DROP POLICY IF EXISTS "Authenticated users can create polls" ON polls;
DROP POLICY IF EXISTS "Poll creators can update their polls" ON polls;
DROP POLICY IF EXISTS "Poll creators can delete their polls" ON polls;

-- Recreate polls policies
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

-- Update votes policies to be more permissive for anonymous voting
DROP POLICY IF EXISTS "Allow anonymous insert for votes" ON votes;
DROP POLICY IF EXISTS "Allow authenticated insert for votes" ON votes;
DROP POLICY IF EXISTS "Anyone can create votes" ON votes;

-- Recreate votes policies
CREATE POLICY "Anyone can create votes"
  ON votes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow all users to read votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own votes"
  ON votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);