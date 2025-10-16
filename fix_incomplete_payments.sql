-- Fix incomplete payments that are marked as completed
-- This script will move payments with incomplete bank details to pending_details status

-- First, let's see what we're working with
SELECT 
    'BEFORE FIX' as status,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
    COUNT(CASE WHEN payment_status = 'pending_details' THEN 1 END) as pending_details_payments
FROM task_payment_records;

-- Update completed payments that have incomplete bank details to pending_details
UPDATE task_payment_records 
SET 
    payment_status = 'pending_details',
    updated_at = NOW()
WHERE 
    payment_status = 'completed'
    AND worker_id IN (
        SELECT worker_id 
        FROM worker_bank_details 
        WHERE 
            account_holder_name IS NULL 
            OR account_holder_name = 'Not provided'
            OR bank_name IS NULL 
            OR bank_name = 'Not provided'
            OR account_number IS NULL 
            OR account_number = 'Not provided'
            OR ifsc_code IS NULL 
            OR ifsc_code = 'Not provided'
    );

-- Also update completed payments that don't have transaction proofs
UPDATE task_payment_records 
SET 
    payment_status = 'pending_details',
    updated_at = NOW()
WHERE 
    payment_status = 'completed'
    AND id NOT IN (
        SELECT payment_record_id 
        FROM transaction_proofs 
        WHERE payment_record_id IS NOT NULL
    );

-- Show the results after the fix
SELECT 
    'AFTER FIX' as status,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
    COUNT(CASE WHEN payment_status = 'pending_details' THEN 1 END) as pending_details_payments,
    COUNT(CASE WHEN payment_status = 'processing' THEN 1 END) as processing_payments,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments
FROM task_payment_records;

-- Show detailed breakdown of what was fixed
SELECT 
    'DETAILED BREAKDOWN' as info,
    payment_status,
    COUNT(*) as count,
    STRING_AGG(DISTINCT 
        CASE 
            WHEN payment_status = 'pending_details' THEN 
                'Worker: ' || COALESCE(pw.full_name, 'Unknown') || 
                ' | Task: ' || COALESCE(t.title, 'Unknown') ||
                ' | Amount: ₹' || COALESCE(amount::text, '0')
            ELSE NULL
        END, 
        '; '
    ) as details
FROM task_payment_records tpr
LEFT JOIN tasks t ON tpr.task_id = t.id
LEFT JOIN profiles pw ON tpr.worker_id = pw.user_id
GROUP BY payment_status
ORDER BY payment_status;

-- Verify that our helper functions are working
SELECT 
    'HELPER FUNCTION TEST' as test_type,
    worker_id,
    is_bank_details_complete(worker_id) as has_complete_bank_details,
    CASE 
        WHEN is_bank_details_complete(worker_id) THEN 'Complete'
        ELSE 'Incomplete'
    END as bank_details_status
FROM task_payment_records tpr
WHERE payment_status = 'pending_details'
LIMIT 5;


