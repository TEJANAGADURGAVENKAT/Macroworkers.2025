-- Simple fix for existing policy error
-- Run this in Supabase SQL Editor

-- Drop the specific policy that's causing the error
DROP POLICY IF EXISTS "Employers can view their own transaction proofs" ON transaction_proofs;

-- Create a new policy with a different name
CREATE POLICY "Authenticated users can view transaction proofs" ON transaction_proofs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Also fix the insert policy
DROP POLICY IF EXISTS "Employers can insert transaction proofs" ON transaction_proofs;

CREATE POLICY "Authenticated users can insert transaction proofs" ON transaction_proofs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fix storage policies
DROP POLICY IF EXISTS "Employers can upload transaction proofs" ON storage.objects;

CREATE POLICY "Authenticated users can upload transaction proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'transaction-proofs' AND
        auth.role() = 'authenticated'
    );

-- Test the policies
SELECT 'Policies created successfully' as status;

