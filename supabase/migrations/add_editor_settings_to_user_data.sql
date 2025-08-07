/*
  # Add editor_settings to user_data

  This migration adds a new column to the `user_data` table to store user-specific
  editor appearance settings.

  1. Changes
    - Modified `user_data` table:
      - Added `editor_settings` (jsonb): Stores the JSON object for editor settings.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_data' AND column_name = 'editor_settings'
  ) THEN
    ALTER TABLE public.user_data ADD COLUMN editor_settings jsonb;
  END IF;
END $$;