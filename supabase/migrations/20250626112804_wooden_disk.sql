/*
  # Fix database schema issues

  1. New Tables
    - `votes` table for storing poll votes
      - `id` (uuid, primary key)
      - `poll_id` (uuid, foreign key to polls)
      - `user_id` (uuid, foreign key to auth.users, nullable for anonymous votes)
      - `ip_hash` (text, for anonymous vote tracking)
      - `selected_options` (integer array, stores selected option indices)
      - `created_at` (timestamp)

  2. Foreign Key Fixes
    - Add missing foreign key constraint `polls_created_by_fkey` between polls.created_by and auth.users.id

  3. Security
    - Enable RLS on votes table
    - Add policies for anonymous and authenticated voting
    - Add policy for reading votes
*/

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_hash text,
    selected_options integer[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on votes table
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for votes
CREATE POLICY "Allow anonymous insert for votes" ON public.votes
FOR INSERT WITH CHECK (auth.uid() IS NULL AND ip_hash IS NOT NULL);

CREATE POLICY "Allow authenticated insert for votes" ON public.votes
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Allow all users to read votes" ON public.votes
FOR SELECT USING (true);

-- Fix missing foreign key constraint on polls table
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'polls_created_by_fkey' 
    AND table_name = 'polls'
  ) THEN
    ALTER TABLE public.polls
    ADD CONSTRAINT polls_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance on votes queries
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_ip_hash ON public.votes(ip_hash);