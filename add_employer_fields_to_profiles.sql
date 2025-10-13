-- Add company_name and cin_number fields to profiles table for employers
-- This allows employers to provide their company details during registration

BEGIN;

-- Add company_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add cin_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cin_number TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN public.profiles.company_name IS 'Company name for employer accounts';
COMMENT ON COLUMN public.profiles.cin_number IS 'Corporate Identification Number (CIN) for employer accounts';

-- Create index for better performance on company searches
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON public.profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_cin_number ON public.profiles(cin_number);

COMMIT;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN ('company_name', 'cin_number')
ORDER BY column_name;


