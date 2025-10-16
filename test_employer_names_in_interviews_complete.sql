-- Test query to verify employer names are being fetched correctly
-- Run this to see current interview data with employer information

SELECT 
    'INTERVIEW DATA WITH EMPLOYER NAMES' as info,
    wi.id as interview_id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    w.full_name as worker_name,
    e.full_name as employer_name,
    wi.created_at,
    wi.updated_at
FROM worker_interviews wi
LEFT JOIN profiles w ON wi.worker_id = w.user_id
LEFT JOIN profiles e ON wi.employer_id = e.user_id
ORDER BY wi.created_at DESC
LIMIT 10;

-- Check for any interviews with missing employer names
SELECT 
    'INTERVIEWS WITH MISSING EMPLOYER NAMES' as info,
    COUNT(*) as count
FROM worker_interviews wi
LEFT JOIN profiles e ON wi.employer_id = e.user_id
WHERE e.full_name IS NULL;

-- Show all unique employers who have conducted interviews
SELECT 
    'UNIQUE EMPLOYERS WHO CONDUCTED INTERVIEWS' as info,
    e.full_name as employer_name,
    COUNT(wi.id) as interviews_conducted
FROM worker_interviews wi
LEFT JOIN profiles e ON wi.employer_id = e.user_id
WHERE e.full_name IS NOT NULL
GROUP BY e.full_name
ORDER BY interviews_conducted DESC;

