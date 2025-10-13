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
import { 
  CreditCard, 
  IndianRupee, 
  CheckCircle, 
  AlertCircle,
  Loader2
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

              {/* Warning Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-900">
                    Important: Payment Confirmation
                  </p>
                  <p className="text-sm text-yellow-800">
                    Please ensure you transfer the exact amount to the provided bank account. 
                    This action will mark the payment as completed and cannot be undone.
                  </p>
                </div>
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
                <Button
                  onClick={handleMakePayment}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="h-4 w-4 mr-2" />
                      Confirm & Pay ₹{formatINR(amount)}
                    </>
                  )}
                </Button>
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
                  Payment Successful!
                </h3>
                <p className="text-muted-foreground">
                  ₹{formatINR(amount)} has been paid to {workerName}
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


