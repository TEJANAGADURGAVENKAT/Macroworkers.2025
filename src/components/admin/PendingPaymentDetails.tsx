import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  Clock, 
  User, 
  CreditCard,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/utils";
import { paymentService, PendingPaymentDetails } from "@/lib/pending-payment-service";
import { useAuth } from "@/hooks/useAuth";

const PendingPaymentDetails = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const payments = await paymentService.getPendingDetailsPayments();
      setPendingPayments(payments);
    } catch (error: any) {
      console.error('Error loading pending payments:', error);
      toast({
        title: "Error",
        description: "Failed to load pending payment details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingPayments();
    setRefreshing(false);
  };

  const getStatusIcon = (responsibleParty: string) => {
    switch (responsibleParty) {
      case 'worker':
        return <User className="h-4 w-4 text-orange-600" />;
      case 'employer':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'both':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (responsibleParty: string) => {
    switch (responsibleParty) {
      case 'worker':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'employer':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'both':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionButton = (payment: PendingPaymentDetails) => {
    if (payment.responsible_party === 'worker') {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
          onClick={() => {
            toast({
              title: "Action Required",
              description: `Contact ${payment.worker_name} to complete bank details.`,
            });
          }}
        >
          <User className="h-4 w-4 mr-2" />
          Contact Worker
        </Button>
      );
    } else if (payment.responsible_party === 'employer') {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={() => {
            toast({
              title: "Action Required",
              description: `Contact ${payment.employer_name} to upload transaction proof.`,
            });
          }}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Contact Employer
        </Button>
      );
    } else {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => {
            toast({
              title: "Action Required",
              description: `Contact both ${payment.worker_name} and ${payment.employer_name} to complete required details.`,
            });
          }}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Contact Both
        </Button>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading pending payments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Payment Details</h2>
          <p className="text-gray-600 mt-1">
            Payments waiting for bank details or transaction proof completion
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {pendingPayments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Pending Payments
            </h3>
            <p className="text-gray-600">
              All payments have complete bank details and transaction proofs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingPayments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-l-4 border-l-orange-400">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.responsible_party)}
                      <div>
                        <CardTitle className="text-lg">{payment.task_title}</CardTitle>
                        <p className="text-sm text-gray-600">
                          {payment.worker_name} • {payment.employer_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(payment.responsible_party)}>
                        {payment.pending_reason}
                      </Badge>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          {formatINR(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Payment Details</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Amount:</strong> {formatINR(payment.amount)}</p>
                        <p><strong>Status:</strong> {payment.payment_status}</p>
                        <p><strong>Created:</strong> {new Date(payment.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Missing Information</h4>
                      <div className="space-y-1 text-sm">
                        {payment.responsible_party === 'worker' && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <User className="h-4 w-4" />
                            <span>Worker bank details incomplete</span>
                          </div>
                        )}
                        {payment.responsible_party === 'employer' && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <FileText className="h-4 w-4" />
                            <span>Transaction proof not uploaded</span>
                          </div>
                        )}
                        {payment.responsible_party === 'both' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-orange-600">
                              <User className="h-4 w-4" />
                              <span>Worker bank details incomplete</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-600">
                              <FileText className="h-4 w-4" />
                              <span>Transaction proof not uploaded</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Actions</h4>
                      <div className="space-y-2">
                        {getActionButton(payment)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to payment details or open modal
                            toast({
                              title: "Payment Details",
                              description: `Payment ID: ${payment.id}`,
                            });
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900">How to Resolve Pending Payments</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• <strong>Worker Action:</strong> Ask workers to complete their bank details in their profile</li>
              <li>• <strong>Employer Action:</strong> Ask employers to upload transaction proof after making payments</li>
              <li>• <strong>Automatic Processing:</strong> Payments will automatically move to processing once both requirements are met</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPaymentDetails;


