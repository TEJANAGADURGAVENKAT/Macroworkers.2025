-- COMPLETE user deletion script for your database schema
-- This handles ALL tables that reference the user
-- Run this in your Supabase SQL Editor

BEGIN;

DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT := 'kavya@techvitta.in'; -- Change this email if needed
BEGIN
    -- Get the user ID first
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found with email: %', user_email;
    END IF;
    
    RAISE NOTICE 'Deleting user: % (ID: %)', user_email, user_uuid;
    
    -- Delete in correct order to handle foreign key constraints
    
    -- 1. Payment-related tables (NEW - these were missing from previous script)
    DELETE FROM public.payment_gateway_logs 
    WHERE transaction_id IN (
        SELECT id FROM public.payment_transactions WHERE user_id = user_uuid
    );
    
    DELETE FROM public.payment_transactions WHERE user_id = user_uuid;
    DELETE FROM public.payment_requests WHERE user_id = user_uuid;
    DELETE FROM public.payment_methods WHERE user_id = user_uuid;
    DELETE FROM public.wallet_balances WHERE user_id = user_uuid;
    
    -- 2. Task-related tables
    DELETE FROM public.task_submissions WHERE worker_id = user_uuid;
    DELETE FROM public.task_submissions WHERE employer_id = user_uuid;
    DELETE FROM public.task_assignments WHERE worker_id = user_uuid;
    DELETE FROM public.task_views WHERE viewer_id = user_uuid;
    
    -- 3. Worker-related tables
    DELETE FROM public.worker_documents WHERE worker_id = user_uuid;
    DELETE FROM public.worker_documents WHERE verified_by = user_uuid;
    DELETE FROM public.worker_interviews WHERE worker_id = user_uuid;
    DELETE FROM public.worker_interviews WHERE employer_id = user_uuid;
    DELETE FROM public.worker_status_logs WHERE worker_id = user_uuid;
    DELETE FROM public.worker_status_logs WHERE changed_by = user_uuid;
    
    -- 4. Task creation (if user is an employer)
    DELETE FROM public.tasks WHERE created_by = user_uuid;
    
    -- 5. Submissions (legacy table)
    DELETE FROM public.submissions WHERE created_by = user_uuid;
    
    -- 6. Payments (legacy table)
    DELETE FROM public.payments WHERE employer_id = user_uuid;
    DELETE FROM public.payments WHERE worker_id = user_uuid;
    
    -- 7. Profile (main user data)
    DELETE FROM public.profiles WHERE user_id = user_uuid;
    
    -- 8. Legacy users table (if it exists and has data)
    DELETE FROM public.users WHERE id = user_uuid;
    
    -- 9. Auth user (this will cascade to other auth tables)
    DELETE FROM auth.users WHERE id = user_uuid;
    
    RAISE NOTICE 'User deleted successfully: % (ID: %)', user_email, user_uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
END $$;

COMMIT;

-- Verification query (run this after deletion to confirm)
-- SELECT 'User deleted successfully' as status 
-- WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kavya@techvitta.in');

