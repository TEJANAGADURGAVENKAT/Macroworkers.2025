-- =====================================================
-- PAYMENT & BANK DETAILS DATABASE SETUP
-- =====================================================
-- This script creates all necessary tables for the 
-- Payment & Bank Details feature implementation
-- =====================================================

BEGIN;

-- =====================================================
-- 1. WORKER BANK DETAILS TABLE
-- =====================================================
-- Stores bank account information for workers
-- Used for employer payments to workers

CREATE TABLE IF NOT EXISTS public.worker_bank_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  bank_name text NOT NULL,
  account_holder_name text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  branch_name text,
  upi_id text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT worker_bank_details_pkey PRIMARY KEY (id),
  CONSTRAINT worker_bank_details_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT worker_bank_details_unique_worker UNIQUE (worker_id),
  
  -- Validation constraints
  CONSTRAINT worker_bank_details_account_number_length CHECK (length(account_number) >= 9 AND length(account_number) <= 18),
  CONSTRAINT worker_bank_details_ifsc_format CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  CONSTRAINT worker_bank_details_upi_format CHECK (upi_id IS NULL OR upi_id ~ '^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$')
);

-- =====================================================
-- 2. TASK PAYMENT RECORDS TABLE
-- =====================================================
-- Links tasks with workers and tracks payment status
-- Replaces the simple 'payments' table with more detailed tracking

CREATE TABLE IF NOT EXISTS public.task_payment_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  employer_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_method text DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'upi', 'wallet', 'other')),
  
  -- Payment execution details
  payment_initiated_at timestamp with time zone,
  payment_completed_at timestamp with time zone,
  payment_failed_at timestamp with time zone,
  failure_reason text,
  
  -- Transaction references
  external_transaction_id text,
  gateway_response jsonb,
  
  -- Audit fields
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid, -- Who initiated the payment (employer/admin)
  
  CONSTRAINT task_payment_records_pkey PRIMARY KEY (id),
  CONSTRAINT task_payment_records_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
  CONSTRAINT task_payment_records_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT task_payment_records_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT task_payment_records_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id),
  
  -- Business logic constraints
  CONSTRAINT task_payment_records_amount_positive CHECK (amount > 0),
  CONSTRAINT task_payment_records_unique_task_worker UNIQUE (task_id, worker_id)
);

-- =====================================================
-- 3. PAYMENT APPROVAL WORKFLOW TABLE
-- =====================================================
-- Tracks the approval workflow for payments
-- Links task submissions to payment approvals

CREATE TABLE IF NOT EXISTS public.payment_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  submission_id uuid,
  employer_id uuid NOT NULL,
  
  -- Approval status
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'under_review')),
  approval_notes text,
  
  -- Approval workflow
  submitted_for_approval_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  approved_by uuid,
  rejected_by uuid,
  
  -- Bank details visibility
  bank_details_visible_to_employer boolean DEFAULT false,
  bank_details_visible_at timestamp with time zone,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT payment_approvals_pkey PRIMARY KEY (id),
  CONSTRAINT payment_approvals_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
  CONSTRAINT payment_approvals_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT payment_approvals_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.task_submissions(id) ON DELETE CASCADE,
  CONSTRAINT payment_approvals_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT payment_approvals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(user_id),
  CONSTRAINT payment_approvals_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.profiles(user_id),
  
  -- Business logic constraints
  CONSTRAINT payment_approvals_unique_task_worker UNIQUE (task_id, worker_id)
);

-- =====================================================
-- 4. PAYMENT AUDIT LOG TABLE
-- =====================================================
-- Comprehensive audit trail for all payment activities
-- Tracks changes, status updates, and user actions

CREATE TABLE IF NOT EXISTS public.payment_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_record_id uuid,
  task_id uuid,
  worker_id uuid,
  employer_id uuid,
  
  -- Audit details
  action_type text NOT NULL CHECK (action_type IN (
    'bank_details_added', 'bank_details_updated', 'bank_details_verified',
    'payment_initiated', 'payment_processing', 'payment_completed', 
    'payment_failed', 'payment_cancelled',
    'approval_requested', 'approval_granted', 'approval_rejected',
    'bank_details_made_visible', 'status_changed'
  )),
  action_description text NOT NULL,
  previous_status text,
  new_status text,
  metadata jsonb,
  
  -- User context
  performed_by uuid,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT payment_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT payment_audit_logs_payment_record_id_fkey FOREIGN KEY (payment_record_id) REFERENCES public.task_payment_records(id) ON DELETE CASCADE,
  CONSTRAINT payment_audit_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
  CONSTRAINT payment_audit_logs_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT payment_audit_logs_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT payment_audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(user_id)
);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Worker Bank Details indexes
CREATE INDEX IF NOT EXISTS idx_worker_bank_details_worker_id ON public.worker_bank_details(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_bank_details_active ON public.worker_bank_details(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_worker_bank_details_verified ON public.worker_bank_details(is_verified) WHERE is_verified = true;

-- Task Payment Records indexes
CREATE INDEX IF NOT EXISTS idx_task_payment_records_task_id ON public.task_payment_records(task_id);
CREATE INDEX IF NOT EXISTS idx_task_payment_records_worker_id ON public.task_payment_records(worker_id);
CREATE INDEX IF NOT EXISTS idx_task_payment_records_employer_id ON public.task_payment_records(employer_id);
CREATE INDEX IF NOT EXISTS idx_task_payment_records_status ON public.task_payment_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_task_payment_records_completed ON public.task_payment_records(payment_completed_at) WHERE payment_status = 'completed';

-- Payment Approvals indexes
CREATE INDEX IF NOT EXISTS idx_payment_approvals_task_id ON public.payment_approvals(task_id);
CREATE INDEX IF NOT EXISTS idx_payment_approvals_worker_id ON public.payment_approvals(worker_id);
CREATE INDEX IF NOT EXISTS idx_payment_approvals_employer_id ON public.payment_approvals(employer_id);
CREATE INDEX IF NOT EXISTS idx_payment_approvals_status ON public.payment_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_payment_approvals_approved ON public.payment_approvals(approved_at) WHERE approval_status = 'approved';

-- Payment Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_payment_record_id ON public.payment_audit_logs(payment_record_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_task_id ON public.payment_audit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_worker_id ON public.payment_audit_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_performed_by ON public.payment_audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_performed_at ON public.payment_audit_logs(performed_at);
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_action_type ON public.payment_audit_logs(action_type);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.worker_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Worker Bank Details Policies
CREATE POLICY "Users can view their own bank details" ON public.worker_bank_details
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Users can insert their own bank details" ON public.worker_bank_details
  FOR INSERT WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Users can update their own bank details" ON public.worker_bank_details
  FOR UPDATE USING (worker_id = auth.uid());

CREATE POLICY "Employers can view bank details after approval" ON public.worker_bank_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payment_approvals pa
      WHERE pa.worker_id = worker_bank_details.worker_id
      AND pa.bank_details_visible_to_employer = true
      AND pa.employer_id IN (
        SELECT user_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'employer'
      )
    )
  );

CREATE POLICY "Admins can view all bank details" ON public.worker_bank_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Task Payment Records Policies
CREATE POLICY "Workers can view their payment records" ON public.task_payment_records
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Employers can view payment records for their tasks" ON public.task_payment_records
  FOR SELECT USING (
    employer_id IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Employers can create payment records for their tasks" ON public.task_payment_records
  FOR INSERT WITH CHECK (
    employer_id IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Employers can update payment records for their tasks" ON public.task_payment_records
  FOR UPDATE USING (
    employer_id IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Admins can manage all payment records" ON public.task_payment_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Payment Approvals Policies
CREATE POLICY "Workers can view their payment approvals" ON public.payment_approvals
  FOR SELECT USING (worker_id = auth.uid());

CREATE POLICY "Employers can view approvals for their tasks" ON public.payment_approvals
  FOR SELECT USING (
    employer_id IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Employers can update approvals for their tasks" ON public.payment_approvals
  FOR UPDATE USING (
    employer_id IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Admins can manage all payment approvals" ON public.payment_approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Payment Audit Logs Policies (Read-only for most users)
CREATE POLICY "Users can view audit logs for their payments" ON public.payment_audit_logs
  FOR SELECT USING (
    worker_id = auth.uid() OR 
    employer_id IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'employer'
    )
  );

CREATE POLICY "Admins can view all audit logs" ON public.payment_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 7. HELPER FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update bank_details_visible_to_employer
CREATE OR REPLACE FUNCTION update_bank_details_visibility()
RETURNS TRIGGER AS $$
BEGIN
  -- When a payment approval is approved, make bank details visible to employer
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    UPDATE public.payment_approvals 
    SET 
      bank_details_visible_to_employer = true,
      bank_details_visible_at = now(),
      approved_at = now(),
      approved_by = auth.uid()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for payment approval status changes
CREATE TRIGGER trigger_update_bank_details_visibility
  AFTER UPDATE ON public.payment_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_details_visibility();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_payment_audit_log(
  p_action_type text,
  p_action_description text,
  p_payment_record_id uuid DEFAULT NULL,
  p_task_id uuid DEFAULT NULL,
  p_worker_id uuid DEFAULT NULL,
  p_employer_id uuid DEFAULT NULL,
  p_previous_status text DEFAULT NULL,
  p_new_status text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.payment_audit_logs (
    payment_record_id,
    task_id,
    worker_id,
    employer_id,
    action_type,
    action_description,
    previous_status,
    new_status,
    metadata,
    performed_by
  ) VALUES (
    p_payment_record_id,
    p_task_id,
    p_worker_id,
    p_employer_id,
    p_action_type,
    p_action_description,
    p_previous_status,
    p_new_status,
    p_metadata,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Uncomment the following section to insert sample data for testing

/*
-- Sample worker bank details
INSERT INTO public.worker_bank_details (worker_id, bank_name, account_holder_name, account_number, ifsc_code, branch_name, upi_id) VALUES
(
  (SELECT user_id FROM public.profiles WHERE role = 'worker' LIMIT 1),
  'State Bank of India',
  'John Doe',
  '123456789012',
  'SBIN0001234',
  'Main Branch',
  'john.doe@sbi'
);

-- Sample payment approval
INSERT INTO public.payment_approvals (task_id, worker_id, employer_id, approval_status) VALUES
(
  (SELECT id FROM public.tasks LIMIT 1),
  (SELECT user_id FROM public.profiles WHERE role = 'worker' LIMIT 1),
  (SELECT user_id FROM public.profiles WHERE role = 'employer' LIMIT 1),
  'approved'
);
*/

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.worker_bank_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.task_payment_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_approvals TO authenticated;
GRANT SELECT ON public.payment_audit_logs TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_payment_audit_log TO authenticated;

COMMIT;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- Your Payment & Bank Details database is now ready!
-- 
-- Tables created:
-- ✅ worker_bank_details - Store worker bank account info
-- ✅ task_payment_records - Track payment transactions
-- ✅ payment_approvals - Manage payment approval workflow
-- ✅ payment_audit_logs - Complete audit trail
-- 
-- Features enabled:
-- ✅ Row Level Security (RLS) policies
-- ✅ Performance indexes
-- ✅ Data validation constraints
-- ✅ Audit logging functions
-- ✅ Bank details visibility controls
-- 
-- Next steps:
-- 1. Update your frontend code to use these tables
-- 2. Test the payment flow with real data
-- 3. Configure your payment gateway integration
-- 
-- =====================================================

