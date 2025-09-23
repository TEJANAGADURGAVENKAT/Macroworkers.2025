-- Add category column to profiles table for worker categories
-- This migration adds the category field to store worker specialization

BEGIN;

-- Add category column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add constraint to ensure category is one of the valid options
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_category_check 
CHECK (category IS NULL OR category IN ('IT', 'Digital Marketing', 'Blockchain/AI'));

-- Create index for better performance on category filtering
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);

-- Update existing worker profiles with a default category if they don't have one
UPDATE public.profiles 
SET category = 'IT'
WHERE role = 'worker' AND category IS NULL;

-- Update rating default to 1.00 for new workers (remove any existing 3.00 defaults)
UPDATE public.profiles 
SET rating = 1.00
WHERE role = 'worker' AND rating = 3.00;

COMMIT;
cd C:\Users\saiis\Downloads
git clone https://github.com/TEJANAGADURGAVENKAT/Macroworkers.2025.git
