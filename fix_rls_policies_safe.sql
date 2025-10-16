-- Fix RLS policies - handles existing policies properly
-- Run this in Supabase SQL Editor

-- Drop ALL existing policies first (ignore errors if they don't exist)
DO $$ 
BEGIN
    -- Drop storage policies
    BEGIN
        DROP POLICY IF EXISTS "Employers can upload transaction proofs" ON storage.objects;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Employers can view their own transaction proofs" ON storage.objects;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Workers can view proofs for their payments" ON storage.objects;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Admins can view all transaction proofs" ON storage.objects;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Authenticated users can upload transaction proofs" ON storage.objects;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;

    -- Drop table policies
    BEGIN
        DROP POLICY IF EXISTS "Employers can view their own transaction proofs" ON transaction_proofs;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Employers can insert transaction proofs" ON transaction_proofs;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Employers can update their own transaction proofs" ON transaction_proofs;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Workers can view proofs for their payments" ON transaction_proofs;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Admins can view all transaction proofs" ON transaction_proofs;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Admins can update all transaction proofs" ON transaction_proofs;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Authenticated users can insert transaction proofs" ON transaction_proofs;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
END $$;

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

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('transaction_proofs', 'objects') 
AND policyname LIKE '%transaction%' OR policyname LIKE '%authenticated%';

