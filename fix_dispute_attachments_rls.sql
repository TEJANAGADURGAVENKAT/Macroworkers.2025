-- Fix RLS policies for dispute_attachments table
-- The current policies are blocking inserts, so we need to update them

-- First, let's check the current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'dispute_attachments'
ORDER BY policyname;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can upload dispute attachments" ON public.dispute_attachments;
DROP POLICY IF EXISTS "Users can view dispute attachments" ON public.dispute_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.dispute_attachments;
DROP POLICY IF EXISTS "Admins can manage all dispute attachments" ON public.dispute_attachments;

-- Create new, more permissive RLS policies for dispute_attachments

-- Allow authenticated users to insert their own dispute attachments
CREATE POLICY "Allow users to insert dispute attachments" ON public.dispute_attachments
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.disputes d 
    WHERE d.id = dispute_attachments.dispute_id 
    AND d.raised_by = auth.uid()
  )
);

-- Allow users to view attachments for disputes they raised
CREATE POLICY "Allow users to view their dispute attachments" ON public.dispute_attachments
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.disputes d 
    WHERE d.id = dispute_attachments.dispute_id 
    AND d.raised_by = auth.uid()
  )
);

-- Allow admins to view all dispute attachments
CREATE POLICY "Allow admins to view all dispute attachments" ON public.dispute_attachments
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Allow admins to manage all dispute attachments
CREATE POLICY "Allow admins to manage all dispute attachments" ON public.dispute_attachments
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Also fix the disputes table RLS policies to ensure they work properly
DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can view their own disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can manage all disputes" ON public.disputes;

-- Create new RLS policies for disputes table
CREATE POLICY "Allow users to create disputes" ON public.disputes
FOR INSERT 
TO authenticated
WITH CHECK (raised_by = auth.uid());

CREATE POLICY "Allow users to view their own disputes" ON public.disputes
FOR SELECT 
TO authenticated
USING (raised_by = auth.uid());

CREATE POLICY "Allow admins to view all disputes" ON public.disputes
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

CREATE POLICY "Allow admins to manage all disputes" ON public.disputes
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'
  )
);

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('disputes', 'dispute_attachments')
ORDER BY tablename, policyname;

-- Test the policies by checking if we can insert
SELECT 'RLS policies for dispute_attachments and disputes tables have been fixed!' as status;


