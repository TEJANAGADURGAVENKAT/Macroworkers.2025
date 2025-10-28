-- Add country field to profiles table for real statistics
-- This will enable tracking of users by country for the statistics dashboard

BEGIN;

-- Add country column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.profiles.country IS 'Country of residence for user profiles';

-- Create index for better performance on country queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

-- Update existing profiles with some sample countries (you can modify these)
-- This is just for demonstration - in a real app, you'd collect this during registration
UPDATE public.profiles 
SET country = CASE 
  WHEN RANDOM() < 0.3 THEN 'India'
  WHEN RANDOM() < 0.5 THEN 'United States'
  WHEN RANDOM() < 0.7 THEN 'United Kingdom'
  WHEN RANDOM() < 0.8 THEN 'Canada'
  WHEN RANDOM() < 0.9 THEN 'Australia'
  ELSE 'Other'
END
WHERE country IS NULL;

COMMIT;

-- Verify the changes
SELECT 
  country,
  COUNT(*) as user_count
FROM public.profiles 
WHERE country IS NOT NULL
GROUP BY country
ORDER BY user_count DESC;


