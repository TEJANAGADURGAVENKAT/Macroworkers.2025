-- Create task_views table to track task view statistics
-- This will help employers see how many workers have viewed their tasks

BEGIN;

-- Create task_views table
CREATE TABLE IF NOT EXISTS public.task_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_views_task_id ON public.task_views(task_id);
CREATE INDEX IF NOT EXISTS idx_task_views_viewed_at ON public.task_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_task_views_viewer_id ON public.task_views(viewer_id);

-- Enable RLS
ALTER TABLE public.task_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert a view record
CREATE POLICY "Anyone can insert task views" ON public.task_views
FOR INSERT WITH CHECK (true);

-- Task creators can view view statistics for their tasks
CREATE POLICY "Task creators can view their task view statistics" ON public.task_views
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_id AND t.created_by = auth.uid()
  )
);

-- Admins can view all task view statistics
CREATE POLICY "Admins can view all task view statistics" ON public.task_views
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  )
);

COMMIT;

