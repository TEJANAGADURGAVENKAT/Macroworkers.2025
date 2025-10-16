-- Fix existing transaction proof URLs that have duplicate bucket names
-- This will update any existing transaction_proofs records with incorrect file URLs

UPDATE transaction_proofs 
SET file_url = REPLACE(file_url, '/transaction-proofs/transaction-proofs/', '/transaction-proofs/')
WHERE file_url LIKE '%/transaction-proofs/transaction-proofs/%';

-- Check if there are any records that need fixing
SELECT id, file_url, file_name 
FROM transaction_proofs 
WHERE file_url LIKE '%transaction-proofs%';

-- Also check for any files that might be in the wrong bucket
SELECT id, file_url, file_name 
FROM transaction_proofs 
WHERE file_url LIKE '%employer-documents%';

