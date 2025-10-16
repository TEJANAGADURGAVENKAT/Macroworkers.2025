-- Update transaction-proofs bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'transaction-proofs';

-- Verify the bucket is now public
SELECT id, name, public FROM storage.buckets WHERE id = 'transaction-proofs';

