// =====================================================
// PAYMENT SERVICE FUNCTIONS
// =====================================================

import { supabase } from '@/integrations/supabase/client';
import { 
  PaymentMethod, 
  PaymentTransaction, 
  PaymentRequest, 
  WalletBalance,
  PaymentStats,
  UserPaymentStats,
  AddPaymentMethodForm,
  CreatePaymentRequestForm,
  UpdatePaymentRequestForm
} from '@/integrations/supabase/payment-types';

// =====================================================
// PAYMENT METHODS
// =====================================================

export const paymentService = {
  // Get user's payment methods
  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Add new payment method
  async addPaymentMethod(userId: string, paymentMethod: AddPaymentMethodForm): Promise<PaymentMethod> {
    // If this is the first payment method, make it default
    const existingMethods = await this.getUserPaymentMethods(userId);
    const isDefault = existingMethods.length === 0 || paymentMethod.is_default;

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: userId,
        method_type: paymentMethod.method_type,
        account_details: paymentMethod.account_details,
        is_default: isDefault,
        is_verified: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update payment method
  async updatePaymentMethod(methodId: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', methodId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete payment method
  async deletePaymentMethod(methodId: string): Promise<void> {
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodId);

    if (error) throw error;
  },

  // Set default payment method
  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    // Unset current default
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    // Set new default
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', methodId);

    if (error) throw error;
  },

  // =====================================================
  // WALLET BALANCES
  // =====================================================

  // Get user's wallet balance
  async getUserWalletBalance(userId: string): Promise<WalletBalance | null> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  // Create wallet balance for new user
  async createWalletBalance(userId: string): Promise<WalletBalance> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .insert({
        user_id: userId,
        available_balance: 0.00,
        pending_balance: 0.00,
        total_earned: 0.00,
        total_withdrawn: 0.00
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update wallet balance
  async updateWalletBalance(userId: string, updates: Partial<WalletBalance>): Promise<WalletBalance> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .update({
        ...updates,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // =====================================================
  // PAYMENT TRANSACTIONS
  // =====================================================

  // Get user's transactions
  async getUserTransactions(userId: string, limit = 50, offset = 0): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  // Get transaction by ID
  async getTransactionById(transactionId: string): Promise<PaymentTransaction | null> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create new transaction
  async createTransaction(transaction: Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentTransaction> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        ...transaction,
        transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update transaction status
  async updateTransactionStatus(transactionId: string, status: PaymentTransaction['status'], metadata?: Record<string, any>): Promise<PaymentTransaction> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update({
        status,
        metadata: metadata ? { ...metadata, updated_at: new Date().toISOString() } : undefined
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // =====================================================
  // PAYMENT REQUESTS
  // =====================================================

  // Get user's payment requests
  async getUserPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create payment request
  async createPaymentRequest(userId: string, request: CreatePaymentRequestForm): Promise<PaymentRequest> {
    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        user_id: userId,
        amount: request.amount,
        currency: 'INR',
        payment_method_id: request.payment_method_id,
        status: 'pending',
        request_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update payment request (admin only)
  async updatePaymentRequest(requestId: string, updates: UpdatePaymentRequestForm): Promise<PaymentRequest> {
    const { data, error } = await supabase
      .from('payment_requests')
      .update({
        ...updates,
        processed_date: updates.status !== 'pending' ? new Date().toISOString() : undefined
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // =====================================================
  // PAYMENT STATISTICS
  // =====================================================

  // Get user payment statistics
  async getUserPaymentStats(userId: string): Promise<UserPaymentStats> {
    const wallet = await this.getUserWalletBalance(userId);
    const transactions = await this.getUserTransactions(userId, 1000);

    return {
      total_earned: wallet?.total_earned || 0,
      total_withdrawn: wallet?.total_withdrawn || 0,
      available_balance: wallet?.available_balance || 0,
      pending_balance: wallet?.pending_balance || 0,
      transaction_count: transactions.length,
      last_transaction_date: transactions[0]?.created_at
    };
  },

  // Get admin payment statistics
  async getAdminPaymentStats(): Promise<PaymentStats> {
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('amount, status, created_at');

    if (error) throw error;

    const totalAmount = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const pendingAmount = transactions?.filter(t => t.status === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const completedAmount = transactions?.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const failedAmount = transactions?.filter(t => t.status === 'failed').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Monthly statistics
    const monthlyStats = transactions?.reduce((acc, t) => {
      const month = new Date(t.created_at).toISOString().substring(0, 7);
      const existing = acc.find(m => m.month === month);
      if (existing) {
        existing.amount += t.amount || 0;
        existing.count += 1;
      } else {
        acc.push({ month, amount: t.amount || 0, count: 1 });
      }
      return acc;
    }, [] as { month: string; amount: number; count: number }[]) || [];

    return {
      total_transactions: transactions?.length || 0,
      total_amount: totalAmount,
      pending_amount: pendingAmount,
      completed_amount: completedAmount,
      failed_amount: failedAmount,
      monthly_stats: monthlyStats.sort((a, b) => b.month.localeCompare(a.month))
    };
  },

  // =====================================================
  // PAYMENT PROCESSING
  // =====================================================

  // Process payment for completed task
  async processTaskPayment(taskId: string, submissionId: string, amount: number, workerId: string): Promise<PaymentTransaction> {
    // Create payment transaction
    const transaction = await this.createTransaction({
      user_id: workerId,
      task_id: taskId,
      submission_id: submissionId,
      transaction_type: 'payment',
      amount: amount,
      currency: 'INR',
      status: 'pending',
      description: `Payment for task completion`
    });

    // Update wallet balance
    const wallet = await this.getUserWalletBalance(workerId);
    if (wallet) {
      await this.updateWalletBalance(workerId, {
        available_balance: wallet.available_balance + amount,
        total_earned: wallet.total_earned + amount
      });
    }

    // Update transaction status to completed
    return await this.updateTransactionStatus(transaction.id, 'completed');
  },

  // Process withdrawal request
  async processWithdrawalRequest(requestId: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<void> {
    const request = await this.updatePaymentRequest(requestId, { status, admin_notes: adminNotes });

    if (status === 'approved') {
      // Create withdrawal transaction
      await this.createTransaction({
        user_id: request.user_id,
        transaction_type: 'withdrawal',
        amount: request.amount,
        currency: request.currency,
        status: 'processing',
        description: 'Withdrawal request approved'
      });

      // Update wallet balance
      const wallet = await this.getUserWalletBalance(request.user_id);
      if (wallet) {
        await this.updateWalletBalance(request.user_id, {
          available_balance: wallet.available_balance - request.amount,
          total_withdrawn: wallet.total_withdrawn + request.amount
        });
      }
    }
  },

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  // Calculate fees for amount
  calculateFees(amount: number, feeType: 'platform_fee' | 'transaction_fee' | 'withdrawal_fee'): number {
    // This would typically fetch from payment_fees table
    // For now, using default values
    const fees = {
      platform_fee: { percentage: 5.0, fixed: 0 },
      transaction_fee: { percentage: 2.5, fixed: 0 },
      withdrawal_fee: { percentage: 0, fixed: 10 }
    };

    const fee = fees[feeType];
    return (amount * fee.percentage / 100) + fee.fixed;
  },

  // Format amount for display
  formatAmount(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Generate transaction ID
  generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Get transaction proof for a payment
  async getTransactionProof(transactionId: string): Promise<{ file_url: string; file_name: string; file_type: string } | null> {
    try {
      // First, try to find the transaction proof by transaction ID
      const { data: transactionProof, error } = await supabase
        .from('transaction_proofs')
        .select('file_url, file_name, file_type')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.log('No transaction proof found by transaction ID:', error.message);
        return null;
      }

      return transactionProof;
    } catch (error) {
      console.error('Error loading transaction proof:', error);
      return null;
    }
  },

  // Get transaction proof by payment record ID
  async getTransactionProofByPaymentRecord(paymentRecordId: string): Promise<{ file_url: string; file_name: string; file_type: string } | null> {
    try {
      const { data: transactionProof, error } = await supabase
        .from('transaction_proofs')
        .select('file_url, file_name, file_type')
        .eq('payment_record_id', paymentRecordId)
        .single();

      if (error) {
        console.log('No transaction proof found by payment record ID:', error.message);
        return null;
      }

      return transactionProof;
    } catch (error) {
      console.error('Error loading transaction proof:', error);
      return null;
    }
  }
};

export default paymentService; 