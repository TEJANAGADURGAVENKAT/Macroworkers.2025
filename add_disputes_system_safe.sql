-- SAFE Disputes System Addition
-- This script ONLY ADDS new tables and policies
-- It will NOT modify or affect any existing tables or policies
-- Run this in your Supabase SQL Editor

BEGIN;

-- 1. Create disputes table (NEW - won't affect existing tables)
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispute_id character varying NOT NULL UNIQUE,
  raised_by uuid NOT NULL,
  against uuid,
  dispute_type character varying NOT NULL CHECK (dispute_type = ANY (ARRAY['payment'::character varying, 'quality'::character varying, 'rejection'::character varying, 'behavior'::character varying, 'contract'::character varying, 'other'::character varying])),
  related_task_id uuid,
  related_payment_id uuid,
  related_submission_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  status character varying NOT NULL DEFAULT 'open'::character varying CHECK (status = ANY (ARRAY['open'::character varying, 'under_review'::character varying, 'resolved'::character varying, 'rejected'::character varying])),
  priority character varying DEFAULT 'medium'::character varying CHECK (priority = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])),
  admin_notes text,
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT disputes_pkey PRIMARY KEY (id),
  CONSTRAINT disputes_raised_by_fkey FOREIGN KEY (raised_by) REFERENCES public.profiles(user_id),
  CONSTRAINT disputes_against_fkey FOREIGN KEY (against) REFERENCES public.profiles(user_id),
  CONSTRAINT disputes_related_task_id_fkey FOREIGN KEY (related_task_id) REFERENCES public.tasks(id),
  CONSTRAINT disputes_related_submission_id_fkey FOREIGN KEY (related_submission_id) REFERENCES public.task_submissions(id),
  CONSTRAINT disputes_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.profiles(user_id)
);

-- 2. Create dispute_attachments table (NEW - won't affect existing tables)
CREATE TABLE IF NOT EXISTS public.dispute_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispute_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT dispute_attachments_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE,
  CONSTRAINT dispute_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(user_id)
);

-- 3. Create dispute_comments table (NEW - won't affect existing tables)
CREATE TABLE IF NOT EXISTS public.dispute_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL,
  commenter_id uuid NOT NULL,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispute_comments_pkey PRIMARY KEY (id),
  CONSTRAINT dispute_comments_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE,
  CONSTRAINT dispute_comments_commenter_id_fkey FOREIGN KEY (commenter_id) REFERENCES public.profiles(user_id)
);

-- 4. Create indexes for better performance (NEW - won't affect existing indexes)
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by ON public.disputes(raised_by);
CREATE INDEX IF NOT EXISTS idx_disputes_against ON public.disputes(against);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_type ON public.disputes(dispute_type);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON public.disputes(created_at);
CREATE INDEX IF NOT EXISTS idx_dispute_attachments_dispute_id ON public.dispute_attachments(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_comments_dispute_id ON public.dispute_comments(dispute_id);

-- 5. Enable RLS on new dispute tables (NEW - won't affect existing RLS)
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_comments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for disputes table (NEW - won't affect existing policies)
CREATE POLICY "Users can view their own disputes" 
ON public.disputes 
FOR SELECT 
USING (
  raised_by = auth.uid() OR 
  against = auth.uid() OR
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Users can create disputes" 
ON public.disputes 
FOR INSERT 
WITH CHECK (raised_by = auth.uid());

CREATE POLICY "Users can update their own open disputes" 
ON public.disputes 
FOR UPDATE 
USING (raised_by = auth.uid() AND status = 'open')
WITH CHECK (raised_by = auth.uid() AND status = 'open');

CREATE POLICY "Admins can manage all disputes" 
ON public.disputes 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin'));

-- 7. Create RLS policies for dispute_attachments table (NEW)
CREATE POLICY "Users can view dispute attachments" 
ON public.dispute_attachments 
FOR SELECT 
USING (
  dispute_id IN (
    SELECT id FROM public.disputes 
    WHERE raised_by = auth.uid() OR 
          against = auth.uid() OR
          auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin')
  )
);

CREATE POLICY "Users can upload dispute attachments" 
ON public.dispute_attachments 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() AND
  dispute_id IN (
    SELECT id FROM public.disputes WHERE raised_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attachments" 
ON public.dispute_attachments 
FOR DELETE 
USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all dispute attachments" 
ON public.dispute_attachments 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin'));

-- 8. Create RLS policies for dispute_comments table (NEW)
CREATE POLICY "Users can view dispute comments" 
ON public.dispute_comments 
FOR SELECT 
USING (
  dispute_id IN (
    SELECT id FROM public.disputes 
    WHERE raised_by = auth.uid() OR 
          against = auth.uid() OR
          auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin')
  )
);

CREATE POLICY "Users can add dispute comments" 
ON public.dispute_comments 
FOR INSERT 
WITH CHECK (
  commenter_id = auth.uid() AND
  dispute_id IN (
    SELECT id FROM public.disputes 
    WHERE raised_by = auth.uid() OR 
          against = auth.uid() OR
          auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin')
  )
);

CREATE POLICY "Users can update their own comments" 
ON public.dispute_comments 
FOR UPDATE 
USING (commenter_id = auth.uid())
WITH CHECK (commenter_id = auth.uid());

CREATE POLICY "Users can delete their own comments" 
ON public.dispute_comments 
FOR DELETE 
USING (commenter_id = auth.uid());

CREATE POLICY "Admins can manage all dispute comments" 
ON public.dispute_comments 
FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin'));

-- 9. Create function to generate dispute IDs (NEW - won't affect existing functions)
CREATE OR REPLACE FUNCTION generate_dispute_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
BEGIN
    -- Generate a random alphanumeric ID
    new_id := upper(substring(md5(random()::text) from 1 for 5));
    
    -- Check if ID already exists, if so generate a new one
    SELECT COUNT(*) INTO counter FROM public.disputes WHERE dispute_id = new_id;
    
    WHILE counter > 0 LOOP
        new_id := upper(substring(md5(random()::text) from 1 for 5));
        SELECT COUNT(*) INTO counter FROM public.disputes WHERE dispute_id = new_id;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-generate dispute IDs (NEW - won't affect existing triggers)
CREATE OR REPLACE FUNCTION set_dispute_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dispute_id IS NULL OR NEW.dispute_id = '' THEN
        NEW.dispute_id := generate_dispute_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_dispute_id_trigger
    BEFORE INSERT ON public.disputes
    FOR EACH ROW
    EXECUTE FUNCTION set_dispute_id();

-- 11. Create function to update updated_at timestamp (NEW - won't affect existing functions)
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create triggers for updated_at (NEW - won't affect existing triggers)
CREATE TRIGGER update_disputes_updated_at_trigger
    BEFORE UPDATE ON public.disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_disputes_updated_at();

-- 13. Create storage bucket for dispute attachments (NEW - won't affect existing buckets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-attachments', 'dispute-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 14. Create storage policies for dispute attachments (NEW - won't affect existing storage policies)
CREATE POLICY "Users can upload dispute attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'dispute-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view dispute attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'dispute-attachments' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'admin')
  )
);

CREATE POLICY "Users can delete their own dispute attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'dispute-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

COMMIT;

-- Verification queries (run these after the main script to confirm everything worked)
-- SELECT 'Disputes system created successfully!' as status;
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'dispute%';
-- SELECT policyname FROM pg_policies WHERE tablename IN ('disputes', 'dispute_attachments', 'dispute_comments');


