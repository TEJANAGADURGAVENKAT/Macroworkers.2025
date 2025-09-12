-- Add policies to allow employers to update task submissions
BEGIN;

-- Allow task creators (employers) to update submissions for their tasks
CREATE POLICY "Task creators can update submissions for their tasks" 
ON public.task_submissions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.tasks t 
  WHERE t.id = task_id AND t.created_by = auth.uid()
));

-- Allow admins to update all submissions
CREATE POLICY "Admins can update all submissions" 
ON public.task_submissions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

COMMIT;
