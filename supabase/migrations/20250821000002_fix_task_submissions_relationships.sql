-- Fix task_submissions table relationships
-- Add a foreign key to profiles table for better joins

BEGIN;

-- Add a foreign key constraint to link task_submissions.worker_id to profiles.user_id
-- This will allow proper joins between task_submissions and profiles tables
ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_worker_id_profiles_fkey 
FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker_id ON public.task_submissions(worker_id);

COMMIT;
