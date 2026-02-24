-- Disable email confirmation requirement by updating auth settings
-- This is a development/MVP setting - enable email confirmation for production

-- Update existing unconfirmed users to be confirmed
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Note: For Supabase projects, you need to:
-- 1. Go to Project Settings > Authentication
-- 2. Enable "Disable email confirmation" under Email Auth settings
-- This script auto-confirms any pending users for development purposes
