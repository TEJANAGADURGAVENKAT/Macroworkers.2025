import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface InterviewStatusGuardProps {
  children: ReactNode;
  fallbackRoute?: string;
}

const InterviewStatusGuard: React.FC<InterviewStatusGuardProps> = ({
  children,
  fallbackRoute = "/worker"
}) => {
  const { profile, loading } = useAuth();

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

  const workerStatus = profile?.status || profile?.worker_status;

  // Check if worker has access to interview schedule
  const hasInterviewAccess = ['interview_pending', 'interview_scheduled', 'accepted'].includes(workerStatus);

  // If access is not available, show restriction message
  if (!hasInterviewAccess) {
    return <InterviewAccessRestricted status={workerStatus} />;
  }

  return <>{children}</>;
};

interface InterviewAccessRestrictedProps {
  status?: string;
}

const InterviewAccessRestricted: React.FC<InterviewAccessRestrictedProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'document_upload_pending':
        return Calendar;
      case 'verification_pending':
        return Clock;
      case 'accepted':
        return CheckCircle2;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'document_upload_pending':
        return 'warning';
      case 'verification_pending':
        return 'primary';
      case 'accepted':
        return 'success';
      default:
        return 'muted';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'document_upload_pending':
        return {
          title: 'Documents Required',
          description: 'Please upload all required documents before scheduling an interview.',
          nextSteps: ['Upload 10th certificate', 'Upload 12th certificate', 'Upload graduation certificate', 'Upload resume/CV', 'Upload KYC/Government ID']
        };
      case 'verification_pending':
        return {
          title: 'Documents Under Review',
          description: 'Your documents are being reviewed. You will be notified when they are approved.',
          nextSteps: ['Wait for document verification', 'Check for any rejection notifications', 'Re-upload rejected documents if needed']
        };
      case 'accepted':
        return {
          title: 'Application Accepted',
          description: 'Congratulations! You have been accepted. You can now access the full platform.',
          nextSteps: ['Browse available jobs', 'Start working on tasks', 'Build your rating and reputation']
        };
      default:
        return {
          title: 'Access Restricted',
          description: 'You need to complete your onboarding process to access interview scheduling.',
          nextSteps: ['Complete document upload', 'Wait for verification', 'Contact support if needed']
        };
    }
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();
  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className={`border-2 ${
          statusColor === 'success' ? 'border-success bg-success/5' :
          statusColor === 'warning' ? 'border-warning bg-warning/5' :
          statusColor === 'primary' ? 'border-primary bg-primary/5' :
          'border-muted'
        }`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${
                statusColor === 'success' ? 'bg-success/20' :
                statusColor === 'warning' ? 'bg-warning/20' :
                statusColor === 'primary' ? 'bg-primary/20' :
                'bg-muted'
              }`}>
                <StatusIcon className={`h-8 w-8 ${
                  statusColor === 'success' ? 'text-success' :
                  statusColor === 'warning' ? 'text-warning' :
                  statusColor === 'primary' ? 'text-primary' :
                  'text-muted-foreground'
                }`} />
              </div>
            </div>
            
            <CardTitle className="text-2xl mb-2">
              {statusMessage.title}
            </CardTitle>
            <p className="text-muted-foreground">
              {statusMessage.description}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className={`${
              statusColor === 'warning' ? 'border-warning bg-warning/5' :
              statusColor === 'primary' ? 'border-primary bg-primary/5' :
              'border-muted'
            }`}>
              <StatusIcon className={`h-4 w-4 ${
                statusColor === 'warning' ? 'text-warning' :
                statusColor === 'primary' ? 'text-primary' :
                'text-muted-foreground'
              }`} />
              <AlertDescription>
                <strong>Current Status:</strong> {status?.replace('_', ' ').toUpperCase() || 'Unknown'}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-semibold">Next Steps:</h3>
              <ul className="space-y-2">
                {statusMessage.nextSteps.map((step, index) => (
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
              
              {status === 'document_upload_pending' && (
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

export default InterviewStatusGuard;

