import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
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
  IndianRupee,
  Search,
  Download,
  Eye,
  Filter,
  FileText,
  CheckCircle
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import PaymentStatusTag from "@/components/payments/PaymentStatusTag";
import BankDetailsCard from "@/components/payments/BankDetailsCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentRecord {
  id: string;
  workerName: string;
  workerEmail: string;
  taskTitle: string;
  employerName: string;
  employerEmail: string;
  amount: number;
  status: 'pending' | 'completed';
  approvedAt: string;
  paidAt?: string;
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
    upiId?: string;
  };
}

const PaymentBankDetailsOverview = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBankDetailsModalOpen, setIsBankDetailsModalOpen] = useState(false);
  const [transactionProofUrl, setTransactionProofUrl] = useState<string | null>(null);
  const [isTransactionProofModalOpen, setIsTransactionProofModalOpen] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, statusFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Debug: Check what tables exist and have data
      console.log('=== ADMIN PAYMENT OVERVIEW DEBUG ===');
      
      // Check if task_payment_records table exists and has data
      const { data: paymentRecordsCount, error: countError } = await supabase
        .from('task_payment_records')
        .select('id', { count: 'exact' });
      
      console.log('Payment records count:', paymentRecordsCount, countError);
      
      // Try simpler query first to debug the issue
      console.log('Trying simple payment records query...');
      const { data: simplePaymentRecords, error: simpleError } = await supabase
        .from('task_payment_records')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Simple payment records query result:', { simplePaymentRecords, simpleError });

      // Now try the complex query with joins
      const { data: paymentRecords, error } = await supabase
        .from('task_payment_records')
        .select(`
          *,
          tasks(
            id,
            title,
            created_by
          ),
          worker_profile:profiles!task_payment_records_worker_id_fkey(
            id,
            full_name,
            email,
            user_id
          ),
          employer_profile:profiles!task_payment_records_employer_id_fkey(
            id,
            full_name,
            email,
            user_id
          ),
          worker_bank_details(
            bank_name,
            account_number,
            ifsc_code,
            account_holder_name,
            branch_name,
            upi_id
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Complex payment records query result:', { paymentRecords, error });

      // If complex query fails, use simple data and fetch related info separately
      let finalPaymentRecords = paymentRecords;
      
      if (error || !paymentRecords || paymentRecords.length === 0) {
        console.warn('Complex query failed, using simple query result:', error);
        finalPaymentRecords = simplePaymentRecords;
        
        // If we have simple records but no complex joins, we need to fetch related data
        if (simplePaymentRecords && simplePaymentRecords.length > 0) {
          console.log('Fetching related data separately...');
          
          // Fetch tasks data
          const taskIds = simplePaymentRecords.map(pr => pr.task_id);
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('id, title, created_by')
            .in('id', taskIds);
          
          // Fetch profiles data
          const allUserIds = [
            ...simplePaymentRecords.map(pr => pr.worker_id),
            ...simplePaymentRecords.map(pr => pr.employer_id)
          ];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, email')
            .in('user_id', allUserIds);
          
          // Fetch bank details
          const workerIds = simplePaymentRecords.map(pr => pr.worker_id);
          const { data: bankDetailsData } = await supabase
            .from('worker_bank_details')
            .select('*')
            .in('worker_id', workerIds);
          
          // Combine the data
          finalPaymentRecords = simplePaymentRecords.map(pr => ({
            ...pr,
            tasks: tasksData?.find(t => t.id === pr.task_id),
            worker_profile: profilesData?.find(p => p.user_id === pr.worker_id),
            employer_profile: profilesData?.find(p => p.user_id === pr.employer_id),
            worker_bank_details: bankDetailsData?.find(b => b.worker_id === pr.worker_id)
          }));
          
          console.log('Combined data:', finalPaymentRecords);
        }
      }

      // Transform data into PaymentRecord format
      const paymentsData: PaymentRecord[] = finalPaymentRecords?.map(record => {
        console.log('Processing payment record:', record);
        
        return {
          id: record.id,
          workerName: record.worker_profile?.full_name || 'Unknown Worker',
          workerEmail: record.worker_profile?.email || '',
          taskTitle: record.tasks?.title || 'Unknown Task',
          employerName: record.employer_profile?.full_name || 'Unknown Employer',
          employerEmail: record.employer_profile?.email || '',
          amount: parseFloat(record.amount),
          status: record.payment_status === 'completed' ? 'completed' : 'pending',
          approvedAt: record.payment_initiated_at,
          paidAt: record.payment_completed_at,
          bankDetails: record.worker_bank_details ? {
            accountHolderName: record.worker_bank_details.account_holder_name || 'Not provided',
            bankName: record.worker_bank_details.bank_name || 'Not provided',
            accountNumber: record.worker_bank_details.account_number || 'Not provided',
            ifscCode: record.worker_bank_details.ifsc_code || 'Not provided',
            branchName: record.worker_bank_details.branch_name || 'Not provided',
            upiId: record.worker_bank_details.upi_id || 'Not provided'
          } : {
            accountHolderName: 'Bank details not available',
            bankName: 'Not provided',
            accountNumber: 'Not provided',
            ifscCode: 'Not provided',
            branchName: 'Not provided',
            upiId: 'Not provided'
          }
        };
      }) || [];

      console.log('Transformed payments data:', paymentsData);

      setPayments(paymentsData);
    } catch (error: any) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.workerName.toLowerCase().includes(query) ||
        p.employerName.toLowerCase().includes(query) ||
        p.taskTitle.toLowerCase().includes(query) ||
        p.bankDetails.bankName.toLowerCase().includes(query) ||
        p.bankDetails.accountNumber.includes(query)
      );
    }

    setFilteredPayments(filtered);
  };

  const handleViewBankDetails = async (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setIsBankDetailsModalOpen(true);
    
    // Load transaction proof if payment is completed
    if (payment.status === 'completed') {
      try {
        const { data: transactionProof, error } = await supabase
          .from('transaction_proofs')
          .select('file_url, file_name, file_type')
          .eq('payment_record_id', payment.id)
          .single();

        if (error) {
          console.log('No transaction proof found:', error.message);
          setTransactionProofUrl(null);
        } else if (transactionProof?.file_url) {
          setTransactionProofUrl(transactionProof.file_url);
        }
      } catch (error) {
        console.error('Error loading transaction proof:', error);
        setTransactionProofUrl(null);
      }
    } else {
      setTransactionProofUrl(null);
    }
  };

  const handleViewTransactionProof = () => {
    setIsTransactionProofModalOpen(true);
  };

  const handleExportData = () => {
    // Export to CSV (simplified version)
    const csv = [
      ["Worker", "Task", "Employer", "Amount", "Bank", "Account Number", "IFSC", "Status", "Approved Date", "Paid Date"].join(","),
      ...filteredPayments.map(p => [
        p.workerName,
        p.taskTitle,
        p.employerName,
        p.amount,
        p.bankDetails.bankName,
        p.bankDetails.accountNumber,
        p.bankDetails.ifscCode,
        p.status,
        new Date(p.approvedAt).toLocaleDateString(),
        p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-details-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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

  // Calculate statistics using useMemo for better performance
  const stats = useMemo(() => {
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const completedPayments = payments.filter(p => p.status === 'completed');
    
    return {
      pendingPayments: pendingPayments.length,
      completedPayments: completedPayments.length,
      pendingAmount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
      totalPaidAmount: completedPayments.reduce((sum, p) => sum + p.amount, 0)
    };
  }, [payments]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              Payment & Bank Details Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor all worker payments and bank account information
            </p>
          </div>
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Payments</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedPayments}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold text-orange-600">₹{formatINR(stats.pendingAmount)}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">₹{formatINR(stats.totalPaidAmount)}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by worker, employer, task, bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="completed">Completed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">All Payment Records</CardTitle>
            <CardDescription>
              Showing {filteredPayments.length} of {payments.length} total records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>IFSC</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className={payment.status === 'completed' ? 'bg-green-50/30' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.workerName}</p>
                            <p className="text-xs text-muted-foreground">{payment.workerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{payment.taskTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {getRelativeTime(payment.approvedAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.employerName}</p>
                            <p className="text-xs text-muted-foreground">{payment.employerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{payment.bankDetails.bankName}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.bankDetails.accountNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.bankDetails.ifscCode}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-semibold text-green-600">
                            <IndianRupee className="h-4 w-4" />
                            {formatINR(payment.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <PaymentStatusTag status={payment.status} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBankDetails(payment)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details Modal */}
        <Dialog open={isBankDetailsModalOpen} onOpenChange={setIsBankDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Complete Payment Details</DialogTitle>
            </DialogHeader>
            <Separator className="my-4" />
            {selectedPayment && (
              <div className="space-y-4">
                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Worker</p>
                    <p className="font-medium">{selectedPayment.workerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employer</p>
                    <p className="font-medium">{selectedPayment.employerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Task</p>
                    <p className="font-medium">{selectedPayment.taskTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-green-600 text-lg">
                      ₹{formatINR(selectedPayment.amount)}
                    </p>
                  </div>
                </div>

                {/* Bank Details */}
                <BankDetailsCard
                  bankDetails={selectedPayment.bankDetails}
                  workerName={selectedPayment.workerName}
                  showTitle={false}
                />

                {/* Transaction Proof Section */}
                {selectedPayment.status === 'completed' && transactionProofUrl && (
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
                            onClick={handleViewTransactionProof}
                          >
                            Transaction Proof: Click to View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <span className="font-medium">Payment Status:</span>
                  <PaymentStatusTag status={selectedPayment.status} />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
      </motion.div>
    </div>
  );
};

export default PaymentBankDetailsOverview;


