-- Simple query to get pending details payments without using a view
-- This can be used in the frontend instead of the view

SELECT 
    tpr.id,
    tpr.task_id,
    tpr.worker_id,
    tpr.employer_id,
    tpr.amount,
    tpr.payment_status,
    tpr.created_at,
    t.title as task_title,
    p_worker.full_name as worker_name,
    p_employer.full_name as employer_name,
    CASE 
        WHEN NOT is_bank_details_complete(tpr.worker_id) THEN 'Incomplete Bank Details'
        WHEN NOT has_transaction_proof(tpr.id) THEN 'Missing Transaction Proof'
        ELSE 'Both Missing'
    END as pending_reason,
    CASE 
        WHEN NOT is_bank_details_complete(tpr.worker_id) THEN 'worker'
        WHEN NOT has_transaction_proof(tpr.id) THEN 'employer'
        ELSE 'both'
    END as responsible_party
FROM task_payment_records tpr
JOIN tasks t ON tpr.task_id = t.id
JOIN profiles p_worker ON tpr.worker_id = p_worker.user_id
JOIN profiles p_employer ON tpr.employer_id = p_employer.user_id
WHERE tpr.payment_status = 'pending_details'
ORDER BY tpr.created_at DESC;


