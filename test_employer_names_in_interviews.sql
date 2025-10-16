-- Test query to check if employer names are being fetched correctly
-- Run this to see current interview data with employer information

SELECT 
    wi.id as interview_id,
    wi.worker_id,
    wi.employer_id,
    wi.result,
    wi.status,
    w.full_name as worker_name,
    e.full_name as employer_name,
    wi.created_at
FROM worker_interviews wi
LEFT JOIN profiles w ON wi.worker_id = w.user_id
LEFT JOIN profiles e ON wi.employer_id = e.user_id
WHERE wi.result = 'selected'
ORDER BY wi.created_at DESC
LIMIT 10;

