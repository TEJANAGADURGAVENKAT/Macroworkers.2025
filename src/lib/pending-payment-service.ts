import { supabase } from "@/integrations/supabase/client";

export interface PendingPaymentDetails {
  id: string;
  task_id: string;
  worker_id: string;
  employer_id: string;
  amount: number;
  payment_status: string;
  created_at: string;
  task_title: string;
  worker_name: string;
  employer_name: string;
  pending_reason: string;
  responsible_party: 'worker' | 'employer' | 'both';
}

export const paymentService = {
  // Get all pending details payments using direct query
  async getPendingDetailsPayments(): Promise<PendingPaymentDetails[]> {
    const { data, error } = await supabase
      .from('task_payment_records')
      .select(`
        id,
        task_id,
        worker_id,
        employer_id,
        amount,
        payment_status,
        created_at,
        tasks!inner(
          id,
          title
        ),
        profiles!task_payment_records_worker_id_fkey(
          user_id,
          full_name
        ),
        profiles!task_payment_records_employer_id_fkey(
          user_id,
          full_name
        )
      `)
      .eq('payment_status', 'pending_details')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending details payments:', error);
      throw error;
    }

    // Transform the data to match the expected format
    return data?.map(record => ({
      id: record.id,
      task_id: record.task_id,
      worker_id: record.worker_id,
      employer_id: record.employer_id,
      amount: record.amount,
      payment_status: record.payment_status,
      created_at: record.created_at,
      task_title: record.tasks?.title || 'Unknown Task',
      worker_name: record.profiles?.full_name || 'Unknown Worker',
      employer_name: record.profiles?.full_name || 'Unknown Employer',
      pending_reason: 'Details Missing', // This will be determined by checking bank details and transaction proof
      responsible_party: 'both' as const // This will be determined by checking bank details and transaction proof
    })) || [];
  },

  // Get pending details payments for a specific user (worker or employer)
  async getPendingDetailsPaymentsForUser(userId: string, userRole: 'worker' | 'employer'): Promise<PendingPaymentDetails[]> {
    const { data, error } = await supabase
      .from('task_payment_records')
      .select(`
        id,
        task_id,
        worker_id,
        employer_id,
        amount,
        payment_status,
        created_at,
        tasks!inner(
          id,
          title
        ),
        profiles!task_payment_records_worker_id_fkey(
          user_id,
          full_name
        ),
        profiles!task_payment_records_employer_id_fkey(
          user_id,
          full_name
        )
      `)
      .eq('payment_status', 'pending_details')
      .eq(userRole === 'worker' ? 'worker_id' : 'employer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending details payments for user:', error);
      throw error;
    }

    // Transform the data to match the expected format
    return data?.map(record => ({
      id: record.id,
      task_id: record.task_id,
      worker_id: record.worker_id,
      employer_id: record.employer_id,
      amount: record.amount,
      payment_status: record.payment_status,
      created_at: record.created_at,
      task_title: record.tasks?.title || 'Unknown Task',
      worker_name: record.profiles?.full_name || 'Unknown Worker',
      employer_name: record.profiles?.full_name || 'Unknown Employer',
      pending_reason: 'Details Missing',
      responsible_party: 'both' as const
    })) || [];
  },

  // Check if bank details are complete for a worker
  async checkBankDetailsComplete(workerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_bank_details_complete', { worker_id_param: workerId });

    if (error) {
      console.error('Error checking bank details:', error);
      return false;
    }

    return data || false;
  },

  // Check if transaction proof exists for a payment
  async checkTransactionProofExists(paymentRecordId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('has_transaction_proof', { payment_record_id_param: paymentRecordId });

    if (error) {
      console.error('Error checking transaction proof:', error);
      return false;
    }

    return data || false;
  },

  // Update payment status to processing when details are complete
  async updatePaymentStatusToProcessing(paymentRecordId: string): Promise<void> {
    const { error } = await supabase
      .from('task_payment_records')
      .update({
        payment_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecordId);

    if (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Get payment details with bank details and transaction proof status
  async getPaymentDetailsWithStatus(paymentRecordId: string): Promise<{
    payment: any;
    bankDetailsComplete: boolean;
    transactionProofExists: boolean;
    canProcess: boolean;
  }> {
    const { data: payment, error: paymentError } = await supabase
      .from('task_payment_records')
      .select('*')
      .eq('id', paymentRecordId)
      .single();

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      throw paymentError;
    }

    const bankDetailsComplete = await this.checkBankDetailsComplete(payment.worker_id);
    const transactionProofExists = await this.checkTransactionProofExists(paymentRecordId);
    const canProcess = bankDetailsComplete && transactionProofExists;

    return {
      payment,
      bankDetailsComplete,
      transactionProofExists,
      canProcess
    };
  }
};
