-- Simple migration to add missing email and phone columns
-- This fixes the immediate error you're seeing

BEGIN;

-- Add email column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add phone column if it doesn't exist  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMIT;

