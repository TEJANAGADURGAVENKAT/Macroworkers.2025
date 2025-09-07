-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'worker')) DEFAULT 'worker',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- Update tasks table to use proper foreign keys and add more fields
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS slots INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS completed_slots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update RLS policies for tasks to work with profiles
DROP POLICY IF EXISTS "Employers can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employers can view their created tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workers can view their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin can update all tasks" ON public.tasks;

CREATE POLICY "Employees can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'employee'
) AND created_by = auth.uid());

CREATE POLICY "Employees can view their created tasks" 
ON public.tasks 
FOR SELECT 
USING (created_by = auth.uid() AND EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'employee'
));

CREATE POLICY "Workers can view available tasks" 
ON public.tasks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'worker'
));

CREATE POLICY "Admins can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

CREATE POLICY "Admins can update all tasks" 
ON public.tasks 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- Create task submissions table
CREATE TABLE public.task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_text TEXT,
  proof_files TEXT[], -- URLs to uploaded files
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT
);

-- Enable RLS on task_submissions
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for task_submissions
CREATE POLICY "Workers can insert their own submissions" 
ON public.task_submissions 
FOR INSERT 
WITH CHECK (worker_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'worker'
));

CREATE POLICY "Workers can view their own submissions" 
ON public.task_submissions 
FOR SELECT 
USING (worker_id = auth.uid());

CREATE POLICY "Task creators can view submissions for their tasks" 
ON public.task_submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.tasks t 
  WHERE t.id = task_id AND t.created_by = auth.uid()
));

CREATE POLICY "Admins can view all submissions" 
ON public.task_submissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = auth.uid() AND p.role = 'admin'
));

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

update auth.users
set email_confirmed_at = now(), confirmed_at = now()
where email in ('worker@demo.com','employer@demo.com','admin@demo.com');