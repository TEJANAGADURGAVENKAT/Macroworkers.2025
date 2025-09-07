-- Add foreign key constraint to enable proper joins between task_submissions and profiles
-- This allows us to join task_submissions.worker_id with profiles.user_id

BEGIN;

-- Add foreign key constraint from task_submissions.worker_id to profiles.user_id
ALTER TABLE public.task_submissions 
ADD CONSTRAINT task_submissions_worker_id_profiles_user_id_fkey 
FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_task_submissions_worker_id ON public.task_submissions(worker_id);

COMMIT;


