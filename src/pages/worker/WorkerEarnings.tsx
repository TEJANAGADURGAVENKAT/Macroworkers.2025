import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp,
  Clock,
  Download,
  Wallet,
  CreditCard,
  Calendar,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { checkWorkerBankDetails } from "@/lib/bank-details-validation";
import { BankDetailsValidationModal } from "@/components/ui/bank-details-validation-modal";

interface EarningsData {
  currentBalance: number;
  totalEarned: number;
  thisWeek: number;
  pendingPayments: number;
  averagePerTask: number;
}

interface StatisticsData {
  tasksCompleted: number;
  successRate: number;
  totalTasks: number;
}

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  employer?: string;
  processor?: string;
}

interface MonthlyEarning {
  month: string;
  amount: number;
}

const WorkerEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData>({
    currentBalance: 0,
    totalEarned: 0,
    thisWeek: 0,
    pendingPayments: 0,
    averagePerTask: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData>({
    tasksCompleted: 0,
    successRate: 0,
    totalTasks: 0
  });
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [hasBankDetails, setHasBankDetails] = useState<boolean | null>(null);

  // Load wallet balance from wallet_balances table
  const loadWalletBalance = async () => {
    if (!user) return { currentBalance: 0, totalEarned: 0, pendingBalance: 0 };

    try {
      const { data: wallet, error } = await supabase
        .from('wallet_balances')
        .select('available_balance, total_earned, pending_balance')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading wallet balance:', error);
        return { currentBalance: 0, totalEarned: 0, pendingBalance: 0 };
      }

      return {
        currentBalance: wallet?.available_balance || 0,
        totalEarned: wallet?.total_earned || 0,
        pendingBalance: wallet?.pending_balance || 0
      };
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      return { currentBalance: 0, totalEarned: 0, pendingBalance: 0 };
    }
  };

  // Load recent transactions from payment_transactions table
  const loadRecentTransactions = async () => {
    if (!user) return [];

    try {
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select(`
          id,
          transaction_type,
          amount,
          status,
          description,
          created_at,
          task:tasks(title, created_by),
          submission:task_submissions(task:tasks(title))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading transactions:', error);
        return [];
      }

      return (transactions || []).map(transaction => ({
        id: transaction.id,
        type: transaction.transaction_type,
        description: transaction.description || transaction.task?.title || transaction.submission?.task?.title || 'Payment',
        amount: transaction.transaction_type === 'withdrawal' ? -transaction.amount : transaction.amount,
        date: new Date(transaction.created_at).toISOString().split('T')[0],
        status: transaction.status,
        employer: transaction.task?.created_by ? 'Employer' : undefined,
        processor: transaction.transaction_type === 'withdrawal' ? 'Bank Transfer' : undefined
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  };

  // Calculate weekly earnings
  const calculateWeeklyEarnings = async () => {
    if (!user) return 0;

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('transaction_type', 'payment')
        .gte('created_at', oneWeekAgo.toISOString());

      if (error) {
        console.error('Error loading weekly earnings:', error);
        return 0;
      }

      return (transactions || []).reduce((sum, transaction) => sum + transaction.amount, 0);
    } catch (error) {
      console.error('Error calculating weekly earnings:', error);
      return 0;
    }
  };

  // Calculate monthly earnings
  const calculateMonthlyEarnings = async () => {
    if (!user) return [];

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select('amount, created_at, transaction_type')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('transaction_type', 'payment')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (error) {
        console.error('Error loading monthly earnings:', error);
        return [];
      }

      // Group by month
      const monthlyData: { [key: string]: number } = {};
      (transactions || []).forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + transaction.amount;
      });

      // Convert to array and sort by date
      return Object.entries(monthlyData)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 6); // Last 6 months
    } catch (error) {
      console.error('Error calculating monthly earnings:', error);
      return [];
    }
  };

  // Calculate average per task
  const calculateAveragePerTask = async () => {
    if (!user) return 0;

    try {
      const { data: submissions, error } = await supabase
        .from('task_submissions')
        .select(`
          task:tasks(budget)
        `)
        .eq('worker_id', user.id)
        .eq('status', 'approved');

      if (error) {
        console.error('Error loading task submissions:', error);
        return 0;
      }

      const completedTasks = submissions || [];
      if (completedTasks.length === 0) return 0;

      const totalEarnings = completedTasks.reduce((sum, submission) => 
        sum + (submission.task?.budget || 0), 0
      );

      return totalEarnings / completedTasks.length;
    } catch (error) {
      console.error('Error calculating average per task:', error);
      return 0;
    }
  };

  // Calculate real statistics from database
  const calculateStatistics = async () => {
    if (!user) return { tasksCompleted: 0, successRate: 0, totalTasks: 0 };

    try {
      // Get all task submissions for the user
      const { data: allSubmissions, error: allError } = await supabase
        .from('task_submissions')
        .select('status')
        .eq('worker_id', user.id);

      if (allError) {
        console.error('Error loading all submissions:', allError);
        return { tasksCompleted: 0, successRate: 0, totalTasks: 0 };
      }

      const submissions = allSubmissions || [];
      const totalTasks = submissions.length;
      
      // Count approved/completed tasks
      const completedTasks = submissions.filter(sub => 
        sub.status === 'approved' || sub.status === 'completed'
      ).length;

      // Calculate success rate
      const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        tasksCompleted: completedTasks,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
        totalTasks
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return { tasksCompleted: 0, successRate: 0, totalTasks: 0 };
    }
  };

  // Load all earnings data
  const loadEarningsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [
        walletData,
        transactions,
        weeklyEarnings,
        monthlyData,
        averagePerTask,
        statisticsData
      ] = await Promise.all([
        loadWalletBalance(),
        loadRecentTransactions(),
        calculateWeeklyEarnings(),
        calculateMonthlyEarnings(),
        calculateAveragePerTask(),
        calculateStatistics()
      ]);

      setEarningsData({
        currentBalance: walletData.currentBalance,
        totalEarned: walletData.totalEarned,
        thisWeek: weeklyEarnings,
        pendingPayments: walletData.pendingBalance,
        averagePerTask
      });

      setRecentTransactions(transactions);
      setMonthlyEarnings(monthlyData);
      setStatistics(statisticsData);

    } catch (error) {
      console.error('Error loading earnings data:', error);
      setError('Failed to load earnings data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarningsData();
    if (user) {
      checkBankDetails();
    }
  }, [user]);

  const checkBankDetails = async () => {
    if (!user) return;
    
    try {
      const bankDetailsCheck = await checkWorkerBankDetails(user.id);
      setHasBankDetails(bankDetailsCheck.hasBankDetails);
      
      // Show modal if no bank details and there are pending payments
      if (!bankDetailsCheck.hasBankDetails && earningsData.pendingPayments > 0) {
        setShowBankDetailsModal(true);
      }
    } catch (error) {
      console.error('Error checking bank details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10 text-success";
      case "pending": return "bg-warning/10 text-warning";
      case "failed": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === "withdrawal" ? "-" : "+";
    const color = type === "withdrawal" ? "text-destructive" : "text-success";
    return (
      <span className={`font-semibold ${color}`}>
        {prefix}{formatINR(Math.abs(amount))}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Earnings</h1>
              <p className="text-muted-foreground">Track your income and manage withdrawals</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/worker">← Back to Dashboard</Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading earnings data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Earnings</h1>
              <p className="text-muted-foreground">Track your income and manage withdrawals</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/worker">← Back to Dashboard</Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  onClick={loadEarningsData}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Earnings</h1>
            <p className="text-muted-foreground">Track your income and manage withdrawals</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/worker">← Back to Dashboard</Link>
          </Button>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-3xl font-bold text-success">{formatINR(earningsData.currentBalance)}</p>
                </div>
                <div className="p-3 bg-gradient-primary rounded-full">
                  <Wallet className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div className="mt-4">
                <Button className="w-full bg-gradient-primary" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Withdraw Funds (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold">{formatINR(earningsData.totalEarned)}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{formatINR(earningsData.thisWeek)}</p>
                </div>
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{formatINR(earningsData.pendingPayments)}</p>
                </div>
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === "earning" ? "bg-success/10" : "bg-primary/10"
                      }`}>
                        {transaction.type === "earning" ? (
                          <ArrowUp className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.employer || transaction.processor} • {transaction.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {formatAmount(transaction.amount, transaction.type)}
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(transaction.status)}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground">Complete tasks to see your earnings here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Summary & Withdrawal Options */}
          <div className="space-y-6">
            {/* Monthly Earnings */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {monthlyEarnings.length > 0 ? (
                  monthlyEarnings.map((month, index) => (
                  <div key={month.month} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{month.month}</span>
                    <span className="font-semibold">{formatINR(month.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No monthly earnings yet</p>
                    <p className="text-sm text-muted-foreground">Complete tasks to see your monthly earnings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <CreditCard className="h-4 w-4 mr-2" />
                  PayPal (Coming Soon)
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Bank Transfer (Coming Soon)
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Wallet className="h-4 w-4 mr-2" />
                  Crypto Wallet (Coming Soon)
                </Button>
              </CardContent>
            </Card>

            {/* Earnings Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average per task</span>
                  <span className="font-semibold text-success">{formatINR(earningsData.averagePerTask)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tasks completed</span>
                  <span className="font-semibold">{statistics.tasksCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success rate</span>
                  <span className={`font-semibold ${statistics.successRate >= 80 ? 'text-success' : statistics.successRate >= 60 ? 'text-warning' : 'text-destructive'}`}>
                    {statistics.successRate.toFixed(1)}%
                  </span>
                </div>
                {statistics.totalTasks > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total tasks attempted</span>
                      <span className="font-semibold">{statistics.totalTasks}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* totalEarnings Modal */}
      <BankDetailsValidationModal
        isOpen={showBankDetailsModal}
        onClose={() => setShowBankDetailsModal(false)}
        hasBankDetails={hasBankDetails || false}
      />
    </div>
  );
};

export default WorkerEarnings;