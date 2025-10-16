-- Check current payment status and identify problematic records
-- Run this first to see what needs to be fixed

-- 1. Check overall payment status distribution
SELECT 
    'CURRENT STATUS' as info,
    payment_status,
    COUNT(*) as count
FROM task_payment_records
GROUP BY payment_status
ORDER BY payment_status;

-- 2. Check completed payments with incomplete bank details
SELECT 
    'PROBLEMATIC COMPLETED PAYMENTS' as info,
    tpr.id as payment_id,
    tpr.payment_status,
    tpr.amount,
    pw.full_name as worker_name,
    t.title as task_title,
    wbd.account_holder_name,
    wbd.bank_name,
    wbd.account_number,
    wbd.ifsc_code,
    CASE 
        WHEN wbd.account_holder_name IS NULL OR wbd.account_holder_name = 'Not provided' THEN 'Missing Account Holder'
        WHEN wbd.bank_name IS NULL OR wbd.bank_name = 'Not provided' THEN 'Missing Bank Name'
        WHEN wbd.account_number IS NULL OR wbd.account_number = 'Not provided' THEN 'Missing Account Number'
        WHEN wbd.ifsc_code IS NULL OR wbd.ifsc_code = 'Not provided' THEN 'Missing IFSC Code'
        ELSE 'Complete'
    END as bank_details_issue
FROM task_payment_records tpr
LEFT JOIN tasks t ON tpr.task_id = t.id
LEFT JOIN profiles pw ON tpr.worker_id = pw.user_id
LEFT JOIN worker_bank_details wbd ON tpr.worker_id = wbd.worker_id
WHERE tpr.payment_status = 'completed'
    AND (
        wbd.account_holder_name IS NULL 
        OR wbd.account_holder_name = 'Not provided'
        OR wbd.bank_name IS NULL 
        OR wbd.bank_name = 'Not provided'
        OR wbd.account_number IS NULL 
        OR wbd.account_number = 'Not provided'
        OR wbd.ifsc_code IS NULL 
        OR wbd.ifsc_code = 'Not provided'
    );

-- 3. Check completed payments without transaction proofs
SELECT 
    'COMPLETED WITHOUT PROOF' as info,
    tpr.id as payment_id,
    tpr.payment_status,
    tpr.amount,
    pw.full_name as worker_name,
    t.title as task_title,
    CASE 
        WHEN tp.id IS NULL THEN 'No Transaction Proof'
        ELSE 'Has Transaction Proof'
    END as proof_status
FROM task_payment_records tpr
LEFT JOIN tasks t ON tpr.task_id = t.id
LEFT JOIN profiles pw ON tpr.worker_id = pw.user_id
LEFT JOIN transaction_proofs tp ON tpr.id = tp.payment_record_id
WHERE tpr.payment_status = 'completed'
    AND tp.id IS NULL;

-- 4. Test helper functions
SELECT 
    'HELPER FUNCTION TEST' as info,
    worker_id,
    is_bank_details_complete(worker_id) as bank_details_complete,
    has_transaction_proof(id) as has_transaction_proof,
    payment_status
FROM task_payment_records
WHERE payment_status = 'completed'
LIMIT 10;


