// =====================================================
// PAYMENT DATABASE TYPESCRIPT TYPES
// =====================================================

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: 'bank_account' | 'upi' | 'paytm' | 'phonepe' | 'razorpay' | 'stripe';
  account_details: {
    // Bank Account
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
    account_holder_name?: string;
    
    // UPI
    upi_id?: string;
    
    // Digital Wallets
    wallet_id?: string;
    phone_number?: string;
    
    // Stripe
    stripe_account_id?: string;
    stripe_customer_id?: string;
    
    // Common
    is_verified?: boolean;
    verification_date?: string;
  };
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  transaction_id: string;
  user_id: string;
  task_id?: string;
  submission_id?: string;
  transaction_type: 'payment' | 'withdrawal' | 'refund' | 'bonus' | 'fee';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method_id?: string;
  gateway_response?: {
    gateway_name: string;
    transaction_id: string;
    status: string;
    response_code?: string;
    error_message?: string;
    metadata?: Record<string, any>;
  };
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  request_date: string;
  processed_date?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSetting {
  id: string;
  setting_key: string;
  setting_value: string | number | boolean | Array<any> | Record<string, any>;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentFee {
  id: string;
  fee_type: 'platform_fee' | 'transaction_fee' | 'withdrawal_fee';
  fee_percentage: number;
  fee_fixed: number;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentGatewayLog {
  id: string;
  transaction_id: string;
  gateway_name: string;
  request_data?: Record<string, any>;
  response_data?: Record<string, any>;
  status: string;
  error_message?: string;
  created_at: string;
}

// =====================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// =====================================================

export interface PaymentTransactionWithDetails extends PaymentTransaction {
  user_profile?: {
    full_name: string;
    email: string;
    role: string;
  };
  task_details?: {
    title: string;
    budget: number;
    status: string;
  };
  submission_details?: {
    status: string;
    submitted_at: string;
  };
  payment_method?: PaymentMethod;
}

export interface PaymentRequestWithDetails extends PaymentRequest {
  user_profile?: {
    full_name: string;
    email: string;
    role: string;
  };
  payment_method?: PaymentMethod;
}

export interface WalletBalanceWithProfile extends WalletBalance {
  user_profile?: {
    full_name: string;
    email: string;
    role: string;
  };
}

// =====================================================
// PAYMENT STATISTICS TYPES
// =====================================================

export interface PaymentStats {
  total_transactions: number;
  total_amount: number;
  pending_amount: number;
  completed_amount: number;
  failed_amount: number;
  monthly_stats: {
    month: string;
    amount: number;
    count: number;
  }[];
}

export interface UserPaymentStats {
  total_earned: number;
  total_withdrawn: number;
  available_balance: number;
  pending_balance: number;
  transaction_count: number;
  last_transaction_date?: string;
}

// =====================================================
// PAYMENT FORM TYPES
// =====================================================

export interface AddPaymentMethodForm {
  method_type: PaymentMethod['method_type'];
  account_details: PaymentMethod['account_details'];
  is_default?: boolean;
}

export interface CreatePaymentRequestForm {
  amount: number;
  payment_method_id: string;
  description?: string;
}

export interface UpdatePaymentRequestForm {
  status: PaymentRequest['status'];
  admin_notes?: string;
}

// =====================================================
// PAYMENT GATEWAY TYPES
// =====================================================

export interface PaymentGatewayConfig {
  name: string;
  is_active: boolean;
  api_key?: string;
  secret_key?: string;
  webhook_url?: string;
  supported_currencies: string[];
  supported_methods: PaymentMethod['method_type'][];
  fees: {
    percentage: number;
    fixed: number;
  };
}

export interface PaymentGatewayResponse {
  success: boolean;
  transaction_id?: string;
  gateway_transaction_id?: string;
  status: string;
  message: string;
  error_code?: string;
  metadata?: Record<string, any>;
}

// =====================================================
// ENUM TYPES
// =====================================================

export const PAYMENT_METHOD_TYPES = {
  BANK_ACCOUNT: 'bank_account',
  UPI: 'upi',
  PAYTM: 'paytm',
  PHONEPE: 'phonepe',
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
} as const;

export const TRANSACTION_TYPES = {
  PAYMENT: 'payment',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
  BONUS: 'bonus',
  FEE: 'fee',
} as const;

export const TRANSACTION_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
} as const;

// =====================================================
// UTILITY TYPES
// =====================================================

export type PaymentMethodType = typeof PAYMENT_METHOD_TYPES[keyof typeof PAYMENT_METHOD_TYPES];
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];
export type TransactionStatus = typeof TRANSACTION_STATUSES[keyof typeof TRANSACTION_STATUSES];
export type PaymentRequestStatus = typeof PAYMENT_REQUEST_STATUSES[keyof typeof PAYMENT_REQUEST_STATUSES]; 