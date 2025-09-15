import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  ArrowDown
} from "lucide-react";
import { formatINR } from "@/lib/utils";

const WorkerEarnings = () => {
  const earningsData = {
    currentBalance: 247.50,
    totalEarned: 1456.25,
    thisWeek: 45.75,
    pendingPayments: 12.25,
    averagePerTask: 3.81
  };

  const recentTransactions = [
    {
      id: 1,
      type: "earning",
      description: "Instagram Follow Task",
      amount: 0.50,
      date: "2024-01-20",
      status: "completed",
      employer: "SocialGrow Co."
    },
    {
      id: 2,
      type: "earning",
      description: "App Testing Task",
      amount: 3.00,
      date: "2024-01-19",
      status: "pending",
      employer: "TechStart Inc."
    },
    {
      id: 3,
      type: "withdrawal",
      description: "PayPal Withdrawal",
      amount: -50.00,
      date: "2024-01-18",
      status: "completed",
      processor: "PayPal"
    },
    {
      id: 4,
      type: "earning",
      description: "Survey Completion",
      amount: 1.25,
      date: "2024-01-17",
      status: "completed",
      employer: "MarketRes Ltd."
    },
    {
      id: 5,
      type: "earning",
      description: "Product Review",
      amount: 2.75,
      date: "2024-01-16",
      status: "completed",
      employer: "ReviewPro"
    }
  ];

  const monthlyEarnings = [
    { month: "Jan 2024", amount: 247.50 },
    { month: "Dec 2023", amount: 198.75 },
    { month: "Nov 2023", amount: 156.25 },
    { month: "Oct 2023", amount: 143.50 },
    { month: "Sep 2023", amount: 167.80 },
    { month: "Aug 2023", amount: 189.45 }
  ];

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
                {recentTransactions.map((transaction, index) => (
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
                ))}
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
                {monthlyEarnings.map((month, index) => (
                  <div key={month.month} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{month.month}</span>
                    <span className="font-semibold">{formatINR(month.amount)}</span>
                  </div>
                ))}
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
                  <span className="font-semibold">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success rate</span>
                  <span className="font-semibold text-success">98%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerEarnings;