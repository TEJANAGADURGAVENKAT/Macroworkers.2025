-- Create a function to automatically fix incomplete payments
-- This function will be called by the frontend to ensure data consistency

CREATE OR REPLACE FUNCTION fix_incomplete_payments()
RETURNS JSON AS $$
DECLARE
    fixed_count INTEGER := 0;
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
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
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
    
    GET DIAGNOSTICS fixed_count = fixed_count + ROW_COUNT;
    
    -- Return result
    result := json_build_object(
        'success', true,
        'fixed_count', fixed_count,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION fix_incomplete_payments() TO authenticated;

-- Test the function
SELECT fix_incomplete_payments();


