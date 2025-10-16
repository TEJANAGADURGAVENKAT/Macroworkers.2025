-- Quick test for veni malakala's data
-- This will help us understand what the frontend should receive

-- Get veni malakala's user_id
SELECT 
    'VENI MALAKALA USER ID' as info,
    user_id,
    full_name,
    worker_status,
    status
FROM profiles 
WHERE full_name = 'veni malakala';

-- Get interview data for veni malakala
SELECT 
    'VENI MALAKALA INTERVIEW' as info,
    wi.id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    wi.created_at
FROM worker_interviews wi
JOIN profiles w ON wi.worker_id = w.user_id
WHERE w.full_name = 'veni malakala'
ORDER BY wi.created_at DESC;

-- Get employer name for veni malakala's interview
SELECT 
    'EMPLOYER FOR VENI MALAKALA' as info,
    p.full_name as employer_name,
    p.user_id as employer_id
FROM profiles p
WHERE p.user_id = 'bb1f7d2b-1d96-433b-a596-830d905f6188';

