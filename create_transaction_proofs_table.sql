-- Create transaction_proofs table for storing payment transaction proofs
CREATE TABLE IF NOT EXISTS transaction_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_record_id UUID REFERENCES task_payment_records(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    worker_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- File information
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    
    -- Transaction details
    transaction_amount DECIMAL(10,2) NOT NULL,
    transaction_reference TEXT NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status and metadata
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verification_notes TEXT,
    verified_by UUID REFERENCES profiles(user_id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_proofs_payment_record_id ON transaction_proofs(payment_record_id);
CREATE INDEX IF NOT EXISTS idx_transaction_proofs_employer_id ON transaction_proofs(employer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_proofs_worker_id ON transaction_proofs(worker_id);
CREATE INDEX IF NOT EXISTS idx_transaction_proofs_task_id ON transaction_proofs(task_id);
CREATE INDEX IF NOT EXISTS idx_transaction_proofs_status ON transaction_proofs(status);
CREATE INDEX IF NOT EXISTS idx_transaction_proofs_created_at ON transaction_proofs(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE transaction_proofs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_proofs
-- Allow authenticated users to insert transaction proofs
CREATE POLICY "Authenticated users can insert transaction proofs" ON transaction_proofs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Employers can view proofs they uploaded
CREATE POLICY "Employers can view their own transaction proofs" ON transaction_proofs
    FOR SELECT USING (auth.uid() = employer_id);

-- Employers can insert proofs for their payments
CREATE POLICY "Employers can insert transaction proofs" ON transaction_proofs
    FOR INSERT WITH CHECK (auth.uid() = employer_id);

-- Employers can update their own proofs (for status changes)
CREATE POLICY "Employers can update their own transaction proofs" ON transaction_proofs
    FOR UPDATE USING (auth.uid() = employer_id);

-- Workers can view proofs for their payments
CREATE POLICY "Workers can view proofs for their payments" ON transaction_proofs
    FOR SELECT USING (auth.uid() = worker_id);

-- Admins can view all proofs
CREATE POLICY "Admins can view all transaction proofs" ON transaction_proofs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all proofs (for verification)
CREATE POLICY "Admins can update all transaction proofs" ON transaction_proofs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_transaction_proofs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transaction_proofs_updated_at
    BEFORE UPDATE ON transaction_proofs
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_proofs_updated_at();

-- Create storage bucket for transaction proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-proofs', 'transaction-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for transaction-proofs bucket
CREATE POLICY "Employers can upload transaction proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'transaction-proofs'
    );

CREATE POLICY "Employers can view their own transaction proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'transaction-proofs'
    );

CREATE POLICY "Workers can view proofs for their payments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'transaction-proofs'
    );

CREATE POLICY "Admins can view all transaction proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'transaction-proofs'
    );

-- Allow authenticated users to upload transaction proofs
CREATE POLICY "Authenticated users can upload transaction proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'transaction-proofs' AND
        auth.role() = 'authenticated'
    );

-- Add comment
COMMENT ON TABLE transaction_proofs IS 'Stores transaction proof documents uploaded by employers for payment verification';
COMMENT ON COLUMN transaction_proofs.payment_record_id IS 'Reference to the payment record this proof belongs to';
COMMENT ON COLUMN transaction_proofs.file_url IS 'URL to the uploaded file in Supabase Storage';
COMMENT ON COLUMN transaction_proofs.status IS 'Verification status: pending, verified, rejected';
COMMENT ON COLUMN transaction_proofs.transaction_reference IS 'External transaction reference number';
