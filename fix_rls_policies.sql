-- Quick fix for RLS policies - run this in Supabase SQL editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Employers can upload transaction proofs" ON storage.objects;
DROP POLICY IF EXISTS "Employers can view their own transaction proofs" ON storage.objects;
DROP POLICY IF EXISTS "Workers can view proofs for their payments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all transaction proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload transaction proofs" ON storage.objects;

DROP POLICY IF EXISTS "Employers can view their own transaction proofs" ON transaction_proofs;
DROP POLICY IF EXISTS "Employers can insert transaction proofs" ON transaction_proofs;
DROP POLICY IF EXISTS "Employers can update their own transaction proofs" ON transaction_proofs;
DROP POLICY IF EXISTS "Workers can view proofs for their payments" ON transaction_proofs;
DROP POLICY IF EXISTS "Admins can view all transaction proofs" ON transaction_proofs;
DROP POLICY IF EXISTS "Admins can update all transaction proofs" ON transaction_proofs;
DROP POLICY IF EXISTS "Authenticated users can insert transaction proofs" ON transaction_proofs;

-- Create new permissive policies for storage
CREATE POLICY "Allow authenticated uploads to transaction-proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'transaction-proofs' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated access to transaction-proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'transaction-proofs' AND
        auth.role() = 'authenticated'
    );

-- Create new permissive policies for transaction_proofs table
CREATE POLICY "Allow authenticated inserts to transaction_proofs" ON transaction_proofs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated selects from transaction_proofs" ON transaction_proofs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated updates to transaction_proofs" ON transaction_proofs
    FOR UPDATE USING (auth.role() = 'authenticated');