-- Create transaction-proofs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-proofs', 'transaction-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for transaction-proofs bucket
CREATE POLICY "Allow authenticated uploads to transaction-proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'transaction-proofs' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated access to transaction-proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'transaction-proofs' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated updates to transaction-proofs" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'transaction-proofs' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated deletes to transaction-proofs" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'transaction-proofs' AND
        auth.role() = 'authenticated'
    );

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'transaction-proofs';

