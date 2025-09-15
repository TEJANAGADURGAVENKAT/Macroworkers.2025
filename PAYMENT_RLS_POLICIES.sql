-- =====================================================
-- PAYMENT DATABASE RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Enable RLS on all payment tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateway_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1. PAYMENT METHODS POLICIES
-- =====================================================

-- Users can view their own payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payment methods
CREATE POLICY "Users can insert own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment methods
CREATE POLICY "Users can update own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own payment methods
CREATE POLICY "Users can delete own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all payment methods
CREATE POLICY "Admins can view all payment methods" ON payment_methods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all payment methods
CREATE POLICY "Admins can update all payment methods" ON payment_methods
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 2. PAYMENT TRANSACTIONS POLICIES
-- =====================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions (limited fields)
CREATE POLICY "Users can update own transactions" ON payment_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users cannot delete transactions
CREATE POLICY "Users cannot delete transactions" ON payment_transactions
    FOR DELETE USING (false);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON payment_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all transactions
CREATE POLICY "Admins can update all transactions" ON payment_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete transactions (for cleanup)
CREATE POLICY "Admins can delete transactions" ON payment_transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 3. PAYMENT REQUESTS POLICIES
-- =====================================================

-- Users can view their own payment requests
CREATE POLICY "Users can view own payment requests" ON payment_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payment requests
CREATE POLICY "Users can insert own payment requests" ON payment_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment requests (limited fields)
CREATE POLICY "Users can update own payment requests" ON payment_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Users cannot delete payment requests
CREATE POLICY "Users cannot delete payment requests" ON payment_requests
    FOR DELETE USING (false);

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests" ON payment_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all payment requests
CREATE POLICY "Admins can update all payment requests" ON payment_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete payment requests
CREATE POLICY "Admins can delete payment requests" ON payment_requests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 4. WALLET BALANCES POLICIES
-- =====================================================

-- Users can view their own wallet balance
CREATE POLICY "Users can view own wallet balance" ON wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

-- Users cannot insert wallet balances (system managed)
CREATE POLICY "Users cannot insert wallet balances" ON wallet_balances
    FOR INSERT WITH CHECK (false);

-- Users cannot update wallet balances (system managed)
CREATE POLICY "Users cannot update wallet balances" ON wallet_balances
    FOR UPDATE USING (false);

-- Users cannot delete wallet balances
CREATE POLICY "Users cannot delete wallet balances" ON wallet_balances
    FOR DELETE USING (false);

-- Admins can view all wallet balances
CREATE POLICY "Admins can view all wallet balances" ON wallet_balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update wallet balances
CREATE POLICY "Admins can update wallet balances" ON wallet_balances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert wallet balances (for new users)
CREATE POLICY "System can insert wallet balances" ON wallet_balances
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. PAYMENT SETTINGS POLICIES
-- =====================================================

-- Everyone can view payment settings (public information)
CREATE POLICY "Everyone can view payment settings" ON payment_settings
    FOR SELECT USING (true);

-- Only admins can modify payment settings
CREATE POLICY "Only admins can insert payment settings" ON payment_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update payment settings" ON payment_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete payment settings" ON payment_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 6. PAYMENT FEES POLICIES
-- =====================================================

-- Everyone can view payment fees (public information)
CREATE POLICY "Everyone can view payment fees" ON payment_fees
    FOR SELECT USING (true);

-- Only admins can modify payment fees
CREATE POLICY "Only admins can insert payment fees" ON payment_fees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update payment fees" ON payment_fees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete payment fees" ON payment_fees
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 7. PAYMENT GATEWAY LOGS POLICIES
-- =====================================================

-- Users can view their own gateway logs
CREATE POLICY "Users can view own gateway logs" ON payment_gateway_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payment_transactions 
            WHERE id = payment_gateway_logs.transaction_id 
            AND user_id = auth.uid()
        )
    );

-- Users cannot insert gateway logs (system managed)
CREATE POLICY "Users cannot insert gateway logs" ON payment_gateway_logs
    FOR INSERT WITH CHECK (false);

-- Users cannot update gateway logs
CREATE POLICY "Users cannot update gateway logs" ON payment_gateway_logs
    FOR UPDATE USING (false);

-- Users cannot delete gateway logs
CREATE POLICY "Users cannot delete gateway logs" ON payment_gateway_logs
    FOR DELETE USING (false);

-- Admins can view all gateway logs
CREATE POLICY "Admins can view all gateway logs" ON payment_gateway_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert gateway logs
CREATE POLICY "System can insert gateway logs" ON payment_gateway_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 8. SPECIAL POLICIES FOR EMPLOYERS
-- =====================================================

-- Employers can view transactions related to their tasks
CREATE POLICY "Employers can view task-related transactions" ON payment_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = payment_transactions.task_id 
            AND created_by = auth.uid()
        )
    );

-- Employers can view payment requests from workers on their tasks
CREATE POLICY "Employers can view task-related payment requests" ON payment_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM task_submissions ts
            JOIN tasks t ON ts.task_id = t.id
            WHERE ts.worker_id = payment_requests.user_id
            AND t.created_by = auth.uid()
        )
    );

-- =====================================================
-- 9. FUNCTION-BASED POLICIES FOR COMPLEX SCENARIOS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns the resource
CREATE OR REPLACE FUNCTION owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMIT ALL POLICIES
-- =====================================================
COMMIT; 