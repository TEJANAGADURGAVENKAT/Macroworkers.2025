import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  IndianRupee, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Upload,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/utils";
import BankDetailsCard from "./BankDetailsCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  upiId?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerName: string;
  taskTitle: string;
  amount: number;
  bankDetails: BankDetails;
  onPaymentSuccess: () => void;
}

const PaymentModal = ({
  isOpen,
  onClose,
  workerName,
  taskTitle,
  amount,
  bankDetails,
  onPaymentSuccess
}: PaymentModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [transactionProof, setTransactionProof] = useState<File | null>(null);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if bank details are properly provided
      const hasValidBankDetails = bankDetails.accountHolderName !== 'Not provided' &&
        bankDetails.bankName !== 'Not provided' &&
        bankDetails.accountNumber !== 'Not provided' &&
        bankDetails.ifscCode !== 'Not provided';

      if (!hasValidBankDetails) {
        toast({
          title: "Bank Details Required",
          description: "Please ensure the worker has provided complete bank details before uploading transaction proof.",
          variant: "destructive",
        });
        // Reset the file input
        event.target.value = '';
        return;
      }

      setTransactionProof(file);
      setProofUploaded(true);
      toast({
        title: "Transaction Proof Uploaded",
        description: "Please confirm the payment to complete the process.",
      });
    }
  };

  const handleConfirmPayment = async () => {
    // Check if bank details are properly provided
    const hasValidBankDetails = bankDetails.accountHolderName !== 'Not provided' &&
      bankDetails.bankName !== 'Not provided' &&
      bankDetails.accountNumber !== 'Not provided' &&
      bankDetails.ifscCode !== 'Not provided';

    if (!hasValidBankDetails) {
      toast({
        title: "Bank Details Required",
        description: "Please ensure the worker has provided complete bank details before confirming payment.",
        variant: "destructive",
      });
      return;
    }

    if (!transactionProof) {
      toast({
        title: "Error",
        description: "Please upload transaction proof first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Upload file to Supabase Storage
      const fileExt = transactionProof.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transaction-proofs')
        .upload(filePath, transactionProof);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('transaction-proofs')
        .getPublicUrl(filePath);

      // Find the worker by name
      const { data: workerProfile, error: workerError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('full_name', workerName)
        .eq('role', 'worker')
        .single();

      if (workerError) throw workerError;

      // Find the task by title and employer
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('title', taskTitle)
        .eq('created_by', user.id)
        .single();

      if (taskError) throw taskError;

      // Check if payment record already exists
      const { data: existingPayment, error: checkError } = await supabase
        .from('task_payment_records')
        .select('id, payment_status')
        .eq('task_id', task.id)
        .eq('worker_id', workerProfile.user_id)
        .eq('employer_id', user.id)
        .maybeSingle();

      let paymentRecord;
      
      if (existingPayment && !checkError) {
        // Update existing payment record
        const { data: updatedPayment, error: updateError } = await supabase
          .from('task_payment_records')
          .update({
            payment_status: 'processing',
            payment_method: 'bank_transfer',
            payment_initiated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id)
          .select()
          .single();

        if (updateError) throw updateError;
        paymentRecord = updatedPayment;
      } else {
        // Create new payment record
        const { data: newPayment, error: paymentError } = await supabase
          .from('task_payment_records')
          .insert({
            task_id: task.id,
            worker_id: workerProfile.user_id,
            employer_id: user.id,
            amount: amount,
            payment_status: 'processing',
            payment_method: 'bank_transfer',
            payment_initiated_at: new Date().toISOString(),
            created_by: user.id
          })
          .select()
          .single();

        if (paymentError) throw paymentError;
        paymentRecord = newPayment;
      }

      // Save transaction proof to database
      const { error: proofError } = await supabase
        .from('transaction_proofs')
        .insert({
          payment_record_id: paymentRecord.id,
          employer_id: user.id,
          worker_id: workerProfile.user_id,
          task_id: task.id,
          file_name: transactionProof.name,
          file_size: transactionProof.size,
          file_type: transactionProof.type,
          file_url: publicUrl,
          transaction_amount: amount,
          transaction_reference: `TXN_${Date.now()}`,
          status: 'pending'
        });

      if (proofError) throw proofError;

      // Update payment status to completed (transaction proof uploaded)
      const { error: updateError } = await supabase
        .from('task_payment_records')
        .update({
          payment_status: 'completed',
          payment_completed_at: new Date().toISOString(),
          external_transaction_id: `TXN_${Date.now()}`,
          gateway_response: { status: 'success', message: 'Payment processed successfully' }
        })
        .eq('id', paymentRecord.id);

      if (updateError) throw updateError;

      setIsConfirmed(true);
      setPaymentComplete(true);
      
      toast({
        title: "Payment Confirmed Successfully!",
        description: "Transaction proof has been submitted and payment is confirmed.",
      });
      
      onPaymentSuccess();
      
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakePayment = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to make payments.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Find the worker by name (in real implementation, you'd have worker_id)
      const { data: workerProfile, error: workerError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('full_name', workerName)
        .eq('role', 'worker')
        .single();

      if (workerError) throw workerError;

      // Find the task by title and employer
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('title', taskTitle)
        .eq('created_by', user.id)
        .single();

      if (taskError) throw taskError;

      // Create payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('task_payment_records')
        .insert({
          task_id: task.id,
          worker_id: workerProfile.user_id,
          employer_id: user.id,
          amount: amount,
          payment_status: 'processing',
          payment_method: 'bank_transfer',
          payment_initiated_at: new Date().toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Simulate payment processing (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Update payment status to completed
      const { error: updateError } = await supabase
        .from('task_payment_records')
        .update({
          payment_status: 'completed',
          payment_completed_at: new Date().toISOString(),
          external_transaction_id: `TXN_${Date.now()}`,
          gateway_response: { status: 'success', message: 'Payment processed successfully' }
        })
        .eq('id', paymentRecord.id);

      if (updateError) throw updateError;

      // Create audit log
      await supabase.rpc('create_payment_audit_log', {
        p_action_type: 'payment_completed',
        p_action_description: `Payment of ₹${amount} completed successfully to ${workerName}`,
        p_payment_record_id: paymentRecord.id,
        p_task_id: task.id,
        p_worker_id: workerProfile.user_id,
        p_employer_id: user.id,
        p_previous_status: 'processing',
        p_new_status: 'completed'
      });

      setIsProcessing(false);
      setPaymentComplete(true);

      toast({
        title: "Payment Successful!",
        description: `₹${formatINR(amount)} paid to ${workerName}`,
        duration: 4000
      });

      // Callback to parent component
      onPaymentSuccess();

      // Close modal after showing success
      setTimeout(() => {
        setPaymentComplete(false);
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error processing payment:', error);
      setIsProcessing(false);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      setPaymentComplete(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Make Payment
          </DialogTitle>
          <DialogDescription>
            Review bank details and confirm payment to worker
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <AnimatePresence mode="wait">
          {!paymentComplete ? (
            <motion.div
              key="payment-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Task & Payment Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Worker</p>
                    <p className="font-semibold text-lg">{workerName}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Task Approved
                  </Badge>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground">Task</p>
                  <p className="font-medium">{taskTitle}</p>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Amount</span>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {formatINR(amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Transfer funds to the following account:
                </h3>
                <BankDetailsCard 
                  bankDetails={bankDetails} 
                  workerName={workerName}
                  showTitle={false}
                />
              </div>

              {/* Transaction Proof Upload */}
              <div className="space-y-4">
                {/* Check if bank details are properly provided */}
                {(() => {
                  const hasValidBankDetails = bankDetails.accountHolderName !== 'Not provided' &&
                    bankDetails.bankName !== 'Not provided' &&
                    bankDetails.accountNumber !== 'Not provided' &&
                    bankDetails.ifscCode !== 'Not provided';

                  if (!hasValidBankDetails) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-red-900">
                            Bank Details Required
                          </p>
                          <p className="text-sm text-red-800">
                            The worker has not provided complete bank details. Please ask them to update their bank information before proceeding with payment.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-yellow-900">
                            Important: Payment Confirmation
                          </p>
                          <p className="text-sm text-yellow-800">
                            Please ensure you transfer the exact amount to the provided bank account. 
                            Upload transaction proof after making the payment.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="transaction-proof" className="text-sm font-medium">
                          Upload Transaction Proof
                        </Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="transaction-proof"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleProofUpload}
                            disabled={isProcessing || isConfirmed}
                            className="flex-1"
                          />
                          {transactionProof && (
                            <div className="flex items-center gap-2 text-green-600">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{transactionProof.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                {(() => {
                  const hasValidBankDetails = bankDetails.accountHolderName !== 'Not provided' &&
                    bankDetails.bankName !== 'Not provided' &&
                    bankDetails.accountNumber !== 'Not provided' &&
                    bankDetails.ifscCode !== 'Not provided';

                  if (!hasValidBankDetails) {
                    return (
                      <Button
                        disabled={true}
                        className="flex-1 bg-gray-400"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Enter Bank Details First
                      </Button>
                    );
                  }

                  if (!proofUploaded) {
                    return (
                      <Button
                        disabled={true}
                        className="flex-1 bg-gray-400"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Proof First
                      </Button>
                    );
                  }

                  if (!isConfirmed) {
                    return (
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Payment Completed ₹{formatINR(amount)}
                          </>
                        )}
                      </Button>
                    );
                  }

                  return (
                    <Button
                      disabled={true}
                      className="flex-1 bg-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmed
                    </Button>
                  );
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-600">
                  Payment Successfully Completed!
                </h3>
                <p className="text-muted-foreground">
                  Transaction proof submitted and payment confirmed for ₹{formatINR(amount)} to {workerName}
                </p>
              </div>
              
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Payment Completed
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;


