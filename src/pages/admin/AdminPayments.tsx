import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Textarea 
} from "@/components/ui/textarea";
import { 
  IndianRupee, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/utils";
import paymentService from "@/lib/payment-service";
import { 
  PaymentTransaction, 
  PaymentRequest, 
  WalletBalance,
  PaymentStats,
  PaymentMethod,
  TRANSACTION_STATUSES,
  PAYMENT_REQUEST_STATUSES
} from "@/integrations/supabase/payment-types";

const AdminPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  
  // Filter states
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<string>("all");
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);

  useEffect(() => {
    if (user) {
      loadPaymentData();
    }
  }, [user]);

  const loadPaymentData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load all data in parallel
      const [stats, txnData, reqData, walletData] = await Promise.all([
        paymentService.getAdminPaymentStats(),
        loadAllTransactions(),
        loadAllPaymentRequests(),
        loadAllWalletBalances()
      ]);

      setPaymentStats(stats);
      setTransactions(txnData);
      setPaymentRequests(reqData);
      setWalletBalances(walletData);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllTransactions = async (): Promise<PaymentTransaction[]> => {
    // In a real app, you'd implement pagination
    // For now, loading all transactions
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        user_profile:profiles!payment_transactions_user_id_fkey(
          full_name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return data || [];
  };

  const loadAllPaymentRequests = async (): Promise<PaymentRequest[]> => {
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        user_profile:profiles!payment_requests_user_id_fkey(
          full_name,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const loadAllWalletBalances = async (): Promise<WalletBalance[]> => {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select(`
        *,
        user_profile:profiles!wallet_balances_user_id_fkey(
          full_name,
          email,
          role
        )
      `)
      .order('available_balance', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPaymentData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Payment data updated successfully",
    });
  };

  const handleProcessRequest = async (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    setProcessingRequest(true);
    try {
      await paymentService.processWithdrawalRequest(requestId, status, notes);
      
      toast({
        title: "Request Processed",
        description: `Payment request ${status} successfully`,
      });
      
      // Refresh data
      await loadPaymentData();
      setIsRequestModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: "Failed to process payment request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-success/10 text-success";
      case "pending":
        return "bg-warning/10 text-warning";
      case "processing":
        return "bg-blue-10 text-blue-600";
      case "failed":
      case "rejected":
        return "bg-destructive/10 text-destructive";
      case "cancelled":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Filtered data
  const filteredTransactions = transactions.filter(t => 
    (transactionStatusFilter === "all" || t.status === transactionStatusFilter) &&
    (searchTerm === "" || 
      t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRequests = paymentRequests.filter(r => 
    (requestStatusFilter === "all" || r.status === requestStatusFilter) &&
    (searchTerm === "" || 
      r.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payment dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage all payment operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{paymentStats.total_transactions}</p>
                </div>
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatINR(paymentStats.total_amount)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold">{formatINR(paymentStats.pending_amount)}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Amount</p>
                  <p className="text-2xl font-bold">{formatINR(paymentStats.completed_amount)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
          <TabsTrigger value="requests">Payment Requests ({paymentRequests.length})</TabsTrigger>
          <TabsTrigger value="wallets">Wallet Balances ({walletBalances.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Transactions</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={transactionStatusFilter} onValueChange={setTransactionStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.values(TRANSACTION_STATUSES).map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {transaction.transaction_id.substring(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {transaction.user_profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.user_profile?.email || 'No email'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatINR(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Requests</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={requestStatusFilter} onValueChange={setRequestStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.values(PAYMENT_REQUEST_STATUSES).map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {request.user_profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.user_profile?.email || 'No email'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatINR(request.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(request.request_date)}
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                Process
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Process Payment Request</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>User</Label>
                                  <p className="text-sm font-medium">
                                    {request.user_profile?.full_name || 'Unknown User'}
                                  </p>
                                </div>
                                <div>
                                  <Label>Amount</Label>
                                  <p className="text-sm font-medium">
                                    {formatINR(request.amount)}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleProcessRequest(request.id, 'approved')}
                                    disabled={processingRequest}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleProcessRequest(request.id, 'rejected')}
                                    disabled={processingRequest}
                                    className="flex-1"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallet Balances Tab */}
        <TabsContent value="wallets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Wallet Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Available Balance</TableHead>
                    <TableHead>Pending Balance</TableHead>
                    <TableHead>Total Earned</TableHead>
                    <TableHead>Total Withdrawn</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletBalances.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {wallet.user_profile?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {wallet.user_profile?.email || 'No email'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-success">
                        {formatINR(wallet.available_balance)}
                      </TableCell>
                      <TableCell className="font-medium text-warning">
                        {formatINR(wallet.pending_balance)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatINR(wallet.total_earned)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatINR(wallet.total_withdrawn)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeAgo(wallet.last_updated)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Payment Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentStats?.monthly_stats && paymentStats.monthly_stats.length > 0 ? (
                  <div className="space-y-3">
                    {paymentStats.monthly_stats.slice(0, 6).map((stat) => (
                      <div key={stat.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{stat.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {stat.count} transactions
                          </span>
                          <span className="font-medium">
                            {formatINR(stat.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No monthly data available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full"
                          style={{ 
                            width: `${paymentStats ? (paymentStats.completed_amount / paymentStats.total_amount) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {formatINR(paymentStats?.completed_amount || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-warning h-2 rounded-full"
                          style={{ 
                            width: `${paymentStats ? (paymentStats.pending_amount / paymentStats.total_amount) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {formatINR(paymentStats?.pending_amount || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-destructive h-2 rounded-full"
                          style={{ 
                            width: `${paymentStats ? (paymentStats.failed_amount / paymentStats.total_amount) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {formatINR(paymentStats?.failed_amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPayments; 