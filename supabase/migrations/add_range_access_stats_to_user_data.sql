/*
  # Add range_access_stats to user_data

  This migration adds a new column to the `user_data` table to store
  statistics on how many times each range has been accessed/viewed.

  1. Changes
    - Modified `user_data` table:
      - Added `range_access_stats` (jsonb): Stores a JSON object where keys are
        range IDs and values are their access counts.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_data' AND column_name = 'range_access_stats'
  ) THEN
    ALTER TABLE public.user_data ADD COLUMN range_access_stats jsonb;
  END IF;
END $$;
