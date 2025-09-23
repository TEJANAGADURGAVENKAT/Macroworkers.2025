import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  AlertCircle, 
  FileText, 
  Clock, 
  Calendar,
  CheckCircle2,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { canWorkerAccessJobs, canWorkerSubmitTasks, getWorkerStatusInfo } from "@/lib/worker-status-utils";

interface WorkerStatusGuardProps {
  children: ReactNode;
  requiresJobAccess?: boolean;
  requiresTaskSubmission?: boolean;
  fallbackRoute?: string;
}

const WorkerStatusGuard: React.FC<WorkerStatusGuardProps> = ({
  children,
  requiresJobAccess = false,
  requiresTaskSubmission = false,
  fallbackRoute = "/worker"
}) => {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only apply to workers
  if (profile?.role !== 'worker') {
    return <>{children}</>;
  }

  const workerStatus = profile?.worker_status;
  const statusInfo = getWorkerStatusInfo(workerStatus as any);

  // Check if worker has required access level
  const hasJobAccess = canWorkerAccessJobs(workerStatus);
  const hasTaskSubmissionAccess = canWorkerSubmitTasks(workerStatus);

  // If access is required but not available, show restriction message
  if (requiresJobAccess && !hasJobAccess) {
    return <WorkerAccessRestricted statusInfo={statusInfo} type="jobs" />;
  }

  if (requiresTaskSubmission && !hasTaskSubmissionAccess) {
    return <WorkerAccessRestricted statusInfo={statusInfo} type="tasks" />;
  }

  // If worker is not active, redirect certain routes to dashboard
  if (workerStatus !== 'active_employee') {
    const restrictedPaths = ['/worker/jobs', '/worker/tasks', '/worker/earnings'];
    if (restrictedPaths.includes(location.pathname)) {
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return <>{children}</>;
};

interface WorkerAccessRestrictedProps {
  statusInfo: ReturnType<typeof getWorkerStatusInfo>;
  type: 'jobs' | 'tasks';
}

const WorkerAccessRestricted: React.FC<WorkerAccessRestrictedProps> = ({ statusInfo, type }) => {
  const getStatusIcon = () => {
    switch (statusInfo.status) {
      case 'document_upload_pending':
        return FileText;
      case 'verification_pending':
        return Clock;
      case 'interview_pending':
        return Calendar;
      case 'active_employee':
        return CheckCircle2;
      case 'rejected':
        return X;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = () => {
    switch (statusInfo.status) {
      case 'document_upload_pending':
        return 'warning';
      case 'verification_pending':
        return 'warning';
      case 'interview_pending':
        return 'primary';
      case 'active_employee':
        return 'success';
      case 'rejected':
        return 'destructive';
      default:
        return 'muted';
    }
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className={`border-2 ${
          statusColor === 'success' ? 'border-success bg-success/5' :
          statusColor === 'warning' ? 'border-warning bg-warning/5' :
          statusColor === 'primary' ? 'border-primary bg-primary/5' :
          statusColor === 'destructive' ? 'border-destructive bg-destructive/5' :
          'border-muted'
        }`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${
                statusColor === 'success' ? 'bg-success/20' :
                statusColor === 'warning' ? 'bg-warning/20' :
                statusColor === 'primary' ? 'bg-primary/20' :
                statusColor === 'destructive' ? 'bg-destructive/20' :
                'bg-muted'
              }`}>
                <StatusIcon className={`h-8 w-8 ${
                  statusColor === 'success' ? 'text-success' :
                  statusColor === 'warning' ? 'text-warning' :
                  statusColor === 'primary' ? 'text-primary' :
                  statusColor === 'destructive' ? 'text-destructive' :
                  'text-muted-foreground'
                }`} />
              </div>
            </div>
            
            <CardTitle className="text-2xl mb-2">
              Access Restricted
            </CardTitle>
            <p className="text-muted-foreground">
              You need to complete your onboarding process to access {type === 'jobs' ? 'job listings' : 'task submissions'}.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className={`${
              statusColor === 'warning' ? 'border-warning bg-warning/5' :
              statusColor === 'primary' ? 'border-primary bg-primary/5' :
              statusColor === 'destructive' ? 'border-destructive bg-destructive/5' :
              'border-muted'
            }`}>
              <StatusIcon className={`h-4 w-4 ${
                statusColor === 'warning' ? 'text-warning' :
                statusColor === 'primary' ? 'text-primary' :
                statusColor === 'destructive' ? 'text-destructive' :
                'text-muted-foreground'
              }`} />
              <AlertDescription>
                <strong>Current Status:</strong> {statusInfo.title}
                <br />
                {statusInfo.description}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold">Next Steps:</h3>
              <ul className="space-y-2">
                {statusInfo.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center space-x-4">
              <Button asChild>
                <Link to="/worker">
                  Go to Dashboard
                </Link>
              </Button>
              
              {statusInfo.status === 'document_upload_pending' && (
                <Button variant="outline" asChild>
                  <Link to="/worker/onboarding/documents">
                    Upload Documents
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerStatusGuard;
