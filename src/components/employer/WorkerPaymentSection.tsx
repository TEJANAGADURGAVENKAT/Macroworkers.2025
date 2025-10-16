import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CreditCard, 
  Eye, 
  IndianRupee,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import PaymentStatusTag from "@/components/payments/PaymentStatusTag";
import PaymentModal from "@/components/payments/PaymentModal";
import BankDetailsCard from "@/components/payments/BankDetailsCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkerPayment {
  id: string;
  workerName: string;
  taskTitle: string;
  amount: number;
  status: 'pending' | 'pending_details' | 'processing' | 'completed';
  paymentStatus: string;
  paymentRecordId?: string;
  approvedAt: string;
  paidAt?: string;
  bankDetails?: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
    upiId?: string;
  };
}

const WorkerPaymentSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<WorkerPayment | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBankDetailsModalOpen, setIsBankDetailsModalOpen] = useState(false);
  const [isTransactionProofModalOpen, setIsTransactionProofModalOpen] = useState(false);
  const [transactionProofUrl, setTransactionProofUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
    fixIncompletePayments();
  }, []);

  const fixIncompletePayments = async () => {
    try {
      // Fix completed payments with incomplete bank details
      const { error: fixError } = await supabase.rpc('fix_incomplete_payments');
      if (fixError) {
        console.warn('Could not auto-fix incomplete payments:', fixError);
      }
    } catch (error) {
      console.warn('Auto-fix function not available:', error);
    }
  };

  const loadPayments = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
        // Load approved task submissions for this employer
        console.log('Loading approved submissions for employer:', user.id);
        const { data: approvedSubmissions, error: submissionsError } = await supabase
          .from('task_submissions')
          .select(`
            id,
            task_id,
            worker_id,
            status,
            reviewed_at,
            tasks!inner(
              id,
              title,
              budget,
              created_by
            ),
            profiles!task_submissions_worker_id_fkey(
              id,
              full_name,
              user_id
            )
          `)
          .eq('status', 'approved')
          .eq('employer_id', user.id);

        console.log('Approved submissions result:', { approvedSubmissions, submissionsError });

      if (submissionsError) throw submissionsError;

      // Filter tasks created by this employer
      const employerTasks = approvedSubmissions?.filter(submission => 
        submission.tasks.created_by === user.id
      ) || [];

      console.log('Employer tasks after filtering:', employerTasks);

      // Load payment records for these tasks
      const taskIds = employerTasks.map(task => task.task_id);
      const { data: paymentRecords, error: paymentsError } = await supabase
        .from('task_payment_records')
        .select('*')
        .in('task_id', taskIds);

      if (paymentsError) throw paymentsError;

      // Load bank details for workers
      const workerIds = employerTasks.map(task => task.worker_id);
      console.log('Loading bank details for worker IDs:', workerIds);
      console.log('Worker names from submissions:', employerTasks.map(task => task.profiles?.full_name));
      
      // Try different query approaches to debug the issue
      console.log('=== BANK DETAILS DEBUG ===');
      console.log('Worker IDs to query:', workerIds);
      
      // Approach 1: Query with specific worker IDs
      const { data: bankDetails, error: bankError } = await supabase
        .from('worker_bank_details')
        .select('*')
        .in('worker_id', workerIds);

      console.log('Approach 1 - Query with worker IDs:', { bankDetails, bankError });

      // Approach 2: Query all bank details to see what exists
      const { data: allBankDetails, error: allBankError } = await supabase
        .from('worker_bank_details')
        .select('*');

      console.log('Approach 2 - All bank details in database:', { allBankDetails, allBankError });

      // Approach 3: Query with manual worker ID (Kalyani's ID)
      const kalyaniId = '793f843c-491a-4211-8ab1-8c05fed61aa3';
      const { data: kalyaniBankDetails, error: kalyaniError } = await supabase
        .from('worker_bank_details')
        .select('*')
        .eq('worker_id', kalyaniId);

      console.log('Approach 3 - Kalyani bank details:', { kalyaniBankDetails, kalyaniError });

      if (bankError) {
        console.error('Error loading bank details:', bankError);
        throw bankError;
      }

      // If no bank details found, log this for debugging
      if (!bankDetails || bankDetails.length === 0) {
        console.warn('No bank details found for workers:', workerIds);
        console.warn('Worker names:', employerTasks.map(task => task.profiles?.full_name));
        
        // Let's try a different approach - query bank details directly
        console.log('Trying direct bank details query...');
        const { data: allBankDetails, error: directError } = await supabase
          .from('worker_bank_details')
          .select('*');
        
        console.log('All bank details in database:', allBankDetails);
        console.log('Direct query error:', directError);
        
      } else {
        console.log('Found bank details for workers:', bankDetails.map(bd => ({ 
          worker_id: bd.worker_id, 
          bank_name: bd.bank_name, 
          account_holder: bd.account_holder_name 
        })));
      }

      // Combine data into payment objects
      const paymentsData: WorkerPayment[] = employerTasks.map(submission => {
        const paymentRecord = paymentRecords?.find(p => p.task_id === submission.task_id && p.worker_id === submission.worker_id);
        const bankDetail = bankDetails?.find(b => b.worker_id === submission.worker_id);
        
        // Determine the correct status based on payment record and bank details
        let status: 'pending' | 'pending_details' | 'processing' | 'completed' = 'pending';
        
        // Check if bank details are complete
        const hasCompleteBankDetails = bankDetail?.account_holder_name && 
          bankDetail?.account_holder_name !== 'Not provided' &&
          bankDetail?.bank_name && 
          bankDetail?.bank_name !== 'Not provided' &&
          bankDetail?.account_number && 
          bankDetail?.account_number !== 'Not provided' &&
          bankDetail?.ifsc_code && 
          bankDetail?.ifsc_code !== 'Not provided';
        
        if (paymentRecord) {
          // If payment record exists, use its status but validate completeness
          if (paymentRecord.payment_status === 'completed') {
            // Double-check: completed payments should have complete bank details
            if (hasCompleteBankDetails) {
              status = 'completed';
            } else {
              // Force to pending_details if bank details are incomplete
              status = 'pending_details';
            }
          } else if (paymentRecord.payment_status === 'processing') {
            status = 'processing';
          } else if (paymentRecord.payment_status === 'pending_details') {
            status = 'pending_details';
          } else {
            status = 'pending';
          }
        } else {
          // No payment record exists, check if bank details are complete
          if (!hasCompleteBankDetails) {
            status = 'pending_details';
          } else {
            status = 'pending';
          }
        }

        return {
          id: submission.id,
          workerName: submission.profiles?.full_name || 'Unknown Worker',
          taskTitle: submission.tasks.title,
          amount: parseFloat(submission.tasks.budget || '0'),
          status: status,
          paymentStatus: paymentRecord?.payment_status || 'pending',
          paymentRecordId: paymentRecord?.id,
          approvedAt: submission.reviewed_at || submission.created_at,
          paidAt: paymentRecord?.payment_completed_at,
          bankDetails: {
            accountHolderName: bankDetail?.account_holder_name || 'Not provided',
            bankName: bankDetail?.bank_name || 'Not provided',
            accountNumber: bankDetail?.account_number || 'Not provided',
            ifscCode: bankDetail?.ifsc_code || 'Not provided',
            branchName: bankDetail?.branch_name || 'Not provided',
            upiId: bankDetail?.upi_id || 'Not provided'
          }
        };
      });

      console.log('Final payments data:', paymentsData);
      setPayments(paymentsData);
    } catch (error: any) {
      console.error('Error loading payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBankDetails = (payment: WorkerPayment) => {
    console.log('Viewing bank details for payment:', payment);
    console.log('Bank details:', payment.bankDetails);
    setSelectedPayment(payment);
    setIsBankDetailsModalOpen(true);
  };

  const handleMakePayment = (payment: WorkerPayment) => {
    setSelectedPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    // Reload payments to reflect the new status
    loadPayments();
  };

  const handleViewTransactionProof = async (payment: WorkerPayment) => {
    try {
      console.log('Loading transaction proof for payment:', payment);
      console.log('Payment record ID:', payment.paymentRecordId);
      console.log('Payment record ID type:', typeof payment.paymentRecordId);
      console.log('Payment record ID truthy check:', !!payment.paymentRecordId);
      
      if (!payment.paymentRecordId || payment.paymentRecordId === 'undefined' || payment.paymentRecordId === 'null') {
        console.error('Payment record ID is missing or invalid:', payment.paymentRecordId);
        toast({
          title: "No Payment Record Found",
          description: `Payment record ID not found. Value: ${payment.paymentRecordId}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Proceeding to query transaction proof with ID:', payment.paymentRecordId);

      // Get transaction proof details using the payment record ID
      const { data: transactionProof, error: proofError } = await supabase
        .from('transaction_proofs')
        .select('file_url, file_name, file_type')
        .eq('payment_record_id', payment.paymentRecordId)
        .single();

      console.log('Transaction proof query result:', { transactionProof, proofError });

      if (proofError) {
        console.error('Error loading transaction proof:', proofError);
        toast({
          title: "No Transaction Proof Found",
          description: `Transaction proof file not found in database. Error: ${proofError.message}`,
          variant: "destructive",
        });
        return;
      }

      if (transactionProof?.file_url) {
        console.log('Transaction proof file URL found:', transactionProof.file_url);
        setTransactionProofUrl(transactionProof.file_url);
        setIsTransactionProofModalOpen(true);
      } else {
        console.log('Transaction proof found but no file URL:', transactionProof);
        toast({
          title: "No Transaction Proof Found",
          description: "Transaction proof file URL not found.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error loading transaction proof:', error);
      toast({
        title: "Error",
        description: `Failed to load transaction proof: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const pendingDetailsPayments = payments.filter(p => p.status === 'pending_details');
  const processingPayments = payments.filter(p => p.status === 'processing');
  const completedPayments = payments.filter(p => p.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Worker Payment Details
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage payments for approved tasks
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Pending Payments</p>
            <p className="text-2xl font-bold text-orange-600">{pendingPayments.length}</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Pending Details</p>
            <p className="text-2xl font-bold text-purple-600">{pendingDetailsPayments.length}</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Processing</p>
            <p className="text-2xl font-bold text-yellow-600">{processingPayments.length}</p>
          </div>
          <Separator orientation="vertical" className="h-12" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedPayments.length}</p>
          </div>
        </div>
      </div>

      {/* Pending Details Payments */}
      {pendingDetailsPayments.length > 0 && (
        <Card className="shadow-md border-l-4 border-l-purple-400">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              Pending Details Payments
            </CardTitle>
            <CardDescription>
              Payments waiting for bank details or transaction proof completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDetailsPayments.map((payment) => (
                    <TableRow key={payment.id} className="bg-purple-50/50">
                      <TableCell className="font-medium">{payment.workerName}</TableCell>
                      <TableCell className="max-w-xs truncate">{payment.taskTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold text-purple-600">
                          <IndianRupee className="h-4 w-4" />
                          {formatINR(payment.amount)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getRelativeTime(payment.approvedAt)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusTag status="pending_details" size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBankDetails(payment)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMakePayment(payment)}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={payment.bankDetails?.accountHolderName === 'Not provided'}
                          >
                            <IndianRupee className="h-3.5 w-3.5 mr-1" />
                            Complete Payment
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Pending Payments
            </CardTitle>
            <CardDescription>
              Workers waiting for payment after task approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.workerName}</TableCell>
                      <TableCell className="max-w-xs truncate">{payment.taskTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold text-green-600">
                          <IndianRupee className="h-4 w-4" />
                          {formatINR(payment.amount)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getRelativeTime(payment.approvedAt)}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusTag status="pending" size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBankDetails(payment)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMakePayment(payment)}
                          >
                            <IndianRupee className="h-3.5 w-3.5 mr-1" />
                            Make Payment
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Payments */}
      {completedPayments.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completed Payments
            </CardTitle>
            <CardDescription>
              Payment history for approved tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPayments.map((payment) => (
                    <TableRow key={payment.id} className="bg-green-50/50">
                      <TableCell className="font-medium">{payment.workerName}</TableCell>
                      <TableCell className="max-w-xs truncate">{payment.taskTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold text-green-600">
                          <IndianRupee className="h-4 w-4" />
                          {formatINR(payment.amount)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.paidAt ? getRelativeTime(payment.paidAt) : "Recently"}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusTag status="completed" size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBankDetails(payment)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Payments */}
      {payments.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Approved Tasks Yet</h3>
            <p className="text-muted-foreground">
              When you approve tasks, worker payment details will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bank Details Modal */}
      <Dialog open={isBankDetailsModalOpen} onOpenChange={setIsBankDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Worker Bank Details</DialogTitle>
          </DialogHeader>
          <Separator className="my-4" />
          {selectedPayment?.bankDetails && (
            <div className="space-y-6">
              <BankDetailsCard
                bankDetails={selectedPayment.bankDetails}
                workerName={selectedPayment.workerName}
                showTitle={false}
              />
              
              {/* Transaction Proof Section */}
              {selectedPayment.paymentStatus === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-900">
                        Payment Completed
                      </p>
                      <p className="text-sm text-green-800">
                        Transaction proof has been submitted and payment is confirmed.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <FileText className="h-4 w-4 text-green-600" />
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm text-green-700 font-medium hover:text-green-800"
                          onClick={() => handleViewTransactionProof(selectedPayment)}
                        >
                          Transaction Proof: Click to View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          workerName={selectedPayment.workerName}
          taskTitle={selectedPayment.taskTitle}
          amount={selectedPayment.amount}
          bankDetails={selectedPayment.bankDetails!}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Transaction Proof Modal */}
      <Dialog open={isTransactionProofModalOpen} onOpenChange={setIsTransactionProofModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Transaction Proof
            </DialogTitle>
          </DialogHeader>
          <Separator className="my-4" />
          {transactionProofUrl && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Click the button below to view/download the transaction proof file.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={() => window.open(transactionProofUrl, '_blank')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Transaction Proof
                </Button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">
                  File URL: {transactionProofUrl}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkerPaymentSection;


