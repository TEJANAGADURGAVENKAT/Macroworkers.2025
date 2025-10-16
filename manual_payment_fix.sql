-- MANUAL STEP-BY-STEP FIX FOR INCOMPLETE PAYMENTS
-- Run these commands one by one in your Supabase SQL editor

-- Step 1: Check current state
SELECT 
    'CURRENT STATE' as info,
    payment_status,
    COUNT(*) as count
FROM task_payment_records
GROUP BY payment_status
ORDER BY payment_status;

-- Step 2: See which completed payments have incomplete bank details
SELECT 
    'PROBLEMATIC COMPLETED PAYMENTS' as info,
    tpr.id as payment_id,
    pw.full_name as worker_name,
    t.title as task_title,
    tpr.amount,
    wbd.account_holder_name,
    wbd.bank_name,
    wbd.account_number,
    wbd.ifsc_code
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

-- Step 3: Fix completed payments with incomplete bank details
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

-- Step 4: Check state after first fix
SELECT 
    'AFTER BANK DETAILS FIX' as info,
    payment_status,
    COUNT(*) as count
FROM task_payment_records
GROUP BY payment_status
ORDER BY payment_status;

-- Step 5: Fix completed payments without transaction proofs
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

-- Step 6: Final state check
SELECT 
    'FINAL STATE' as info,
    payment_status,
    COUNT(*) as count
FROM task_payment_records
GROUP BY payment_status
ORDER BY payment_status;

-- Step 7: Show what's now in pending_details
SELECT 
    'PENDING DETAILS PAYMENTS' as info,
    pw.full_name as worker_name,
    t.title as task_title,
    tpr.amount,
    CASE 
        WHEN wbd.account_holder_name IS NULL OR wbd.account_holder_name = 'Not provided' THEN 'Missing Bank Details'
        WHEN tp.id IS NULL THEN 'Missing Transaction Proof'
        ELSE 'Both Missing'
    END as missing_item
FROM task_payment_records tpr
LEFT JOIN tasks t ON tpr.task_id = t.id
LEFT JOIN profiles pw ON tpr.worker_id = pw.user_id
LEFT JOIN worker_bank_details wbd ON tpr.worker_id = wbd.worker_id
LEFT JOIN transaction_proofs tp ON tpr.id = tp.payment_record_id
WHERE tpr.payment_status = 'pending_details';


