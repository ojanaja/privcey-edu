-- Add streak tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Create a function to update streak automatically on login (optional, but handled in frontend for now)
-- We will handle logic in the application layer for simplicity in this iteration.
