-- Quick fix: Drop and recreate triggers to avoid "already exists" error
-- Run this if you get trigger already exists error

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_payment_on_transaction_proof ON transaction_proofs;
DROP TRIGGER IF EXISTS trigger_update_payment_on_bank_details_update ON worker_bank_details;

-- Recreate the triggers
CREATE TRIGGER trigger_update_payment_on_transaction_proof
    AFTER INSERT ON transaction_proofs
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status_on_details_completion();

CREATE TRIGGER trigger_update_payment_on_bank_details_update
    AFTER UPDATE ON worker_bank_details
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_status_on_details_completion();

-- Verify triggers were created
SELECT 
    'TRIGGERS_CREATED' as status,
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname IN (
    'trigger_update_payment_on_transaction_proof',
    'trigger_update_payment_on_bank_details_update'
);


