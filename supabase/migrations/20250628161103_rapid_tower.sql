/*
  # Fix vote results counting

  1. Updates
    - Fix get_poll_results function to properly count votes from jsonb array
    - Ensure the function correctly handles the selected_options jsonb structure
    - Add better error handling and debugging
*/

-- Drop and recreate the get_poll_results function with proper vote counting
DROP FUNCTION IF EXISTS get_poll_results(uuid);

CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid uuid)
RETURNS TABLE(
  option_index integer,
  option_text text,
  vote_count bigint,
  percentage numeric
) AS $$
DECLARE
  poll_options jsonb;
  total_votes bigint;
  current_option_index integer;
  current_option_text text;
  current_vote_count bigint;
BEGIN
  -- Get poll options
  SELECT p.options INTO poll_options 
  FROM polls p 
  WHERE p.id = poll_uuid;
  
  IF poll_options IS NULL THEN
    RETURN;
  END IF;
  
  -- Get total vote count for this poll
  SELECT COUNT(*) INTO total_votes 
  FROM votes v 
  WHERE v.poll_id = poll_uuid;
  
  -- Loop through each option and count votes
  FOR current_option_index IN 0..(jsonb_array_length(poll_options) - 1)
  LOOP
    -- Get option text
    SELECT poll_options->>current_option_index INTO current_option_text;
    
    -- Count votes for this option by checking if the option index exists in selected_options array
    SELECT COUNT(*) INTO current_vote_count
    FROM votes v
    WHERE v.poll_id = poll_uuid
    AND v.selected_options @> jsonb_build_array(current_option_index);
    
    -- Return the result for this option
    RETURN QUERY SELECT 
      current_option_index,
      current_option_text,
      current_vote_count,
      CASE 
        WHEN total_votes > 0 THEN ROUND((current_vote_count::numeric / total_votes::numeric) * 100, 1)
        ELSE 0::numeric
      END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;