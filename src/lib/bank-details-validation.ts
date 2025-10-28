import { supabase } from '@/integrations/supabase/client';

export interface BankDetailsValidationResult {
  hasBankDetails: boolean;
  bankDetails?: {
    id: string;
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    branch_name?: string;
    upi_id?: string;
  };
  error?: string;
}

/**
 * Check if a worker has bank details entered
 * @param workerId - The worker's user ID
 * @returns Promise with validation result
 */
export const checkWorkerBankDetails = async (workerId: string): Promise<BankDetailsValidationResult> => {
  try {
    const { data, error } = await supabase
      .from('worker_bank_details')
      .select('*')
      .eq('worker_id', workerId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - worker has no bank details
        return {
          hasBankDetails: false
        };
      }
      throw error;
    }

    return {
      hasBankDetails: true,
      bankDetails: data
    };
  } catch (error) {
    console.error('Error checking bank details:', error);
    return {
      hasBankDetails: false,
      error: 'Failed to check bank details'
    };
  }
};

/**
 * Get the bank details validation message for popup
 * @param hasBankDetails - Whether worker has bank details
 * @returns Formatted message object
 */
export const getBankDetailsValidationMessage = (hasBankDetails: boolean) => {
  if (hasBankDetails) {
    return {
      title: "Bank Details Found",
      description: "Your bank details are set up correctly.",
      type: "success" as const
    };
  }

  return {
    title: "Bank Details Required",
    description: "You need to add your bank details before you can receive payments. Please go to your profile and add your bank information.",
    type: "warning" as const,
    actionText: "Add Bank Details",
    actionUrl: "/worker/profile/bank-details"
  };
};


