-- SIMPLIFIED COMPREHENSIVE FIX FOR INCOMPLETE PAYMENTS
-- This script will fix all issues with the payment system

-- Step 1: Check current state
SELECT 
    'BEFORE FIX - CURRENT STATE' as info,
    payment_status,
    COUNT(*) as count
FROM task_payment_records
GROUP BY payment_status
ORDER BY payment_status;

-- Step 2: Create a simpler fix function
CREATE OR REPLACE FUNCTION fix_incomplete_payments()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Fix completed payments that have incomplete bank details
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
    
    -- Also fix completed payments that don't have transaction proofs
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
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'message', 'Incomplete payments have been moved to pending_details status'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to fix incomplete payments'
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION fix_incomplete_payments() TO authenticated;

-- Step 4: Run the fix
SELECT fix_incomplete_payments() as fix_result;

-- Step 5: Check state after fix
SELECT 
    'AFTER FIX - UPDATED STATE' as info,
    payment_status,
    COUNT(*) as count
FROM task_payment_records
GROUP BY payment_status
ORDER BY payment_status;

-- Step 6: Show detailed breakdown
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

-- Step 7: Verify helper functions are working
SELECT 
    'HELPER FUNCTION VERIFICATION' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_bank_details_complete(worker_id) THEN 1 END) as complete_bank_details,
    COUNT(CASE WHEN NOT is_bank_details_complete(worker_id) THEN 1 END) as incomplete_bank_details
FROM task_payment_records;

-- Step 8: Final summary
SELECT 
    'FINAL SUMMARY' as info,
    'Total Payment Records' as description,
    COUNT(*) as total_payment_records,
    COUNT(CASE WHEN payment_status = 'pending_details' THEN 1 END) as pending_details_count,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_count
FROM task_payment_records;


