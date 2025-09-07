-- Force refresh ratings by updating the last_rating_update timestamp
-- This will trigger the UI to refresh the rating data

UPDATE public.profiles 
SET last_rating_update = now(),
    updated_at = now()
WHERE role = 'worker';

-- Verify the update
SELECT 
    'Updated timestamps for all workers' as status,
    COUNT(*) as workers_updated
FROM public.profiles 
WHERE role = 'worker' 
  AND last_rating_update > now() - interval '1 minute';


