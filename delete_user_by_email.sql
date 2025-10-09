-- Delete user by email - Simple version
-- Replace 'kavya@techvitta.in' with the actual email you want to delete

BEGIN;

-- Delete user by email (handles all related data automatically)
DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT := 'kavya@techvitta.in'; -- Change this email
BEGIN
    -- Get the user ID
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found with email: %', user_email;
    END IF;
    
    RAISE NOTICE 'Deleting user: % (ID: %)', user_email, user_uuid;
    
    -- Delete all related data in the correct order
    DELETE FROM public.task_submissions WHERE worker_id = user_uuid OR employer_id = user_uuid;
    DELETE FROM public.task_assignments WHERE worker_id = user_uuid;
    DELETE FROM public.worker_documents WHERE worker_id = user_uuid OR verified_by = user_uuid;
    DELETE FROM public.worker_interviews WHERE worker_id = user_uuid OR employer_id = user_uuid;
    DELETE FROM public.worker_status_logs WHERE worker_id = user_uuid OR changed_by = user_uuid;
    DELETE FROM public.tasks WHERE created_by = user_uuid;
    DELETE FROM public.profiles WHERE user_id = user_uuid;
    DELETE FROM auth.users WHERE id = user_uuid;
    
    RAISE NOTICE 'User deleted successfully: %', user_email;
END $$;

COMMIT;


