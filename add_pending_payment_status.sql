-- Add new payment status for incomplete bank details and transaction proofs
-- This script adds 'pending_details' status to handle cases where:
-- 1. Worker hasn't provided complete bank details
-- 2. Employer hasn't uploaded transaction proof

-- Step 1: Add new payment status to the constraint
ALTER TABLE task_payment_records 
DROP CONSTRAINT IF EXISTS task_payment_records_payment_status_check;

ALTER TABLE task_payment_records 
ADD CONSTRAINT task_payment_records_payment_status_check 
CHECK (payment_status IN ('pending', 'pending_details', 'processing', 'completed', 'failed', 'cancelled'));

-- Step 2: Update existing records that should be in pending_details status
-- This will identify payments where:
-- - Worker has incomplete bank details (any field is 'Not provided' or NULL)
-- - Employer hasn't uploaded transaction proof

-- First, let's create a function to check if bank details are complete
CREATE OR REPLACE FUNCTION is_bank_details_complete(worker_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    bank_detail RECORD;
BEGIN
    -- Get bank details for the worker
    SELECT * INTO bank_detail 
    FROM worker_bank_details 
    WHERE worker_id = worker_id_param;
    
    -- If no bank details found, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all required fields are provided and not empty
    RETURN (
        bank_detail.account_holder_name IS NOT NULL 
        AND bank_detail.account_holder_name != '' 
        AND bank_detail.account_holder_name != 'Not provided'
        AND bank_detail.bank_name IS NOT NULL 
        AND bank_detail.bank_name != '' 
        AND bank_detail.bank_name != 'Not provided'
        AND bank_detail.account_number IS NOT NULL 
        AND bank_detail.account_number != '' 
        AND bank_detail.account_number != 'Not provided'
        AND bank_detail.ifsc_code IS NOT NULL 
        AND bank_detail.ifsc_code != '' 
        AND bank_detail.ifsc_code != 'Not provided'
    );
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a function to check if transaction proof exists
CREATE OR REPLACE FUNCTION has_transaction_proof(payment_record_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    proof_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO proof_count
    FROM transaction_proofs 
    WHERE payment_record_id = payment_record_id_param;
    
    RETURN proof_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update payment records to pending_details status where appropriate
UPDATE task_payment_records 
SET payment_status = 'pending_details',
    updated_at = NOW()
WHERE payment_status = 'pending'
  AND (
    -- Worker doesn't have complete bank details
    NOT is_bank_details_complete(worker_id)
    OR
    -- No transaction proof uploaded
    NOT has_transaction_proof(id)
  );

-- Step 5: Add comments to explain the new status
COMMENT ON COLUMN task_payment_records.payment_status IS 'Payment status: pending (initial), pending_details (incomplete bank details or transaction proof), processing (payment in progress), completed (payment done), failed (payment failed), cancelled (payment cancelled)';

-- Step 6: Create a view to easily identify pending details payments
CREATE OR REPLACE VIEW pending_details_payments AS
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
WHERE tpr.payment_status = 'pending_details';

-- Step 7: Note: Views inherit RLS policies from their underlying tables
-- No need to create separate RLS policies for views
-- The view will use the RLS policies from task_payment_records, tasks, and profiles tables

-- Step 8: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_payment_records_pending_details 
ON task_payment_records(payment_status) 
WHERE payment_status = 'pending_details';

-- Step 9: Create a function to automatically update payment status when details are completed
CREATE OR REPLACE FUNCTION update_payment_status_on_details_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a transaction proof insertion, check if we can move to processing
    IF TG_TABLE_NAME = 'transaction_proofs' AND TG_OP = 'INSERT' THEN
        -- Check if the payment record exists and is in pending_details
        IF EXISTS (
            SELECT 1 FROM task_payment_records 
            WHERE id = NEW.payment_record_id 
            AND payment_status = 'pending_details'
            AND is_bank_details_complete(worker_id)
        ) THEN
            -- Update to processing status
            UPDATE task_payment_records 
            SET payment_status = 'processing',
                updated_at = NOW()
            WHERE id = NEW.payment_record_id;
        END IF;
    END IF;
    
    -- If this is a bank details update, check if we can move to processing
    IF TG_TABLE_NAME = 'worker_bank_details' AND TG_OP = 'UPDATE' THEN
        -- Check if there are any pending_details payments for this worker
        UPDATE task_payment_records 
        SET payment_status = 'processing',
            updated_at = NOW()
        WHERE worker_id = NEW.worker_id 
        AND payment_status = 'pending_details'
        AND is_bank_details_complete(NEW.worker_id)
        AND has_transaction_proof(id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create triggers to automatically update status
CREATE TRIGGER trigger_update_payment_on_transaction_proof
    AFTER INSERT ON transaction_proofs
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status_on_details_completion();

CREATE TRIGGER trigger_update_payment_on_bank_details_update
    AFTER UPDATE ON worker_bank_details
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status_on_details_completion();

-- Step 11: Add helpful comments
COMMENT ON FUNCTION is_bank_details_complete(UUID) IS 'Checks if worker has provided complete bank details';
COMMENT ON FUNCTION has_transaction_proof(UUID) IS 'Checks if transaction proof has been uploaded for a payment';
COMMENT ON VIEW pending_details_payments IS 'Shows all payments waiting for bank details or transaction proof completion';

-- Step 12: Show summary of changes
SELECT 
    'SUMMARY' as info,
    'Added pending_details payment status for incomplete bank details and transaction proofs' as description,
    COUNT(*) as total_payment_records,
    COUNT(CASE WHEN payment_status = 'pending_details' THEN 1 END) as pending_details_count,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_count
FROM task_payment_records;
