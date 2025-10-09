import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const EmployerPayments = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if employer is approved - redirect if not
  useEffect(() => {
    if (profile && profile.worker_status !== 'active_employee') {
      toast({
        title: "Access Restricted",
        description: "Please complete document verification to access payments.",
        variant: "destructive"
      });
      navigate('/employer/verify');
    }
  }, [profile, navigate, toast]);
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Manage your payments and billing</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/employer">← Back to Dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{formatINR(500)}</p>
            <Button className="mt-4" disabled>Deposit Funds (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployerPayments;