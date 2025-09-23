import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Video,
  MapPin,
  Upload,
  Eye,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";

interface DocumentStatus {
  document_type: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
}

interface InterviewInfo {
  id: string;
  scheduled_date: string;
  mode: 'online' | 'offline';
  meeting_link?: string;
  location?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  result?: 'selected' | 'rejected' | 'pending';
  feedback?: string;
}

const OnboardingStatus = () => {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [interview, setInterview] = useState<InterviewInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const documentTypeLabels = {
    '10th_certificate': '10th Certificate',
    '12th_certificate': '12th Certificate',
    'graduation_certificate': 'Graduation Certificate',
    'resume': 'Resume / CV',
    'kyc_document': 'KYC / Government ID'
  };

  const requiredDocuments = Object.keys(documentTypeLabels);

  useEffect(() => {
    if (user) {
      loadOnboardingData();
    }
  }, [user]);

  const loadOnboardingData = async () => {
    if (!user) return;

    try {
      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('worker_documents')
        .select('document_type, verification_status, verification_notes')
        .eq('worker_id', user.id);

      if (documentsError) throw documentsError;

      setDocuments(documentsData || []);

      // Load interview if exists
      const { data: interviewData, error: interviewError } = await supabase
        .from('worker_interviews')
        .select('*')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!interviewError && interviewData) {
        setInterview(interviewData);
      }

    } catch (error: any) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkerStatus = () => {
    return profile?.worker_status || 'document_upload_pending';
  };

  const getStatusInfo = () => {
    const status = getWorkerStatus();
    
    switch (status) {
      case 'document_upload_pending':
        return {
          title: 'Upload Documents',
          description: 'Please upload all required documents to continue',
          color: 'warning',
          icon: Upload,
          action: { label: 'Upload Documents', link: '/worker/onboarding/documents' }
        };
      case 'verification_pending':
        return {
          title: 'Documents Under Review',
          description: 'Your documents are being verified by our team',
          color: 'warning',
          icon: Clock,
          action: null
        };
      case 'interview_pending':
        return {
          title: 'Ready for Interview',
          description: interview ? 'Your interview has been scheduled' : 'Waiting for interview to be scheduled',
          color: 'primary',
          icon: Calendar,
          action: null
        };
      case 'active_employee':
        return {
          title: 'Welcome to Macroworkers!',
          description: 'You are now an active employee and can start working on tasks',
          color: 'success',
          icon: CheckCircle2,
          action: { label: 'Browse Jobs', link: '/worker/jobs' }
        };
      case 'rejected':
        return {
          title: 'Application Not Approved',
          description: 'Unfortunately, your application was not approved',
          color: 'destructive',
          icon: X,
          action: null
        };
      default:
        return {
          title: 'Getting Started',
          description: 'Complete your onboarding process',
          color: 'muted',
          icon: FileText,
          action: null
        };
    }
  };

  const getDocumentProgress = () => {
    const uploadedCount = requiredDocuments.filter(type => 
      documents.some(doc => doc.document_type === type)
    ).length;
    return (uploadedCount / requiredDocuments.length) * 100;
  };

  const getVerificationProgress = () => {
    const approvedCount = requiredDocuments.filter(type => 
      documents.some(doc => doc.document_type === type && doc.verification_status === 'approved')
    ).length;
    return (approvedCount / requiredDocuments.length) * 100;
  };

  const getRejectedDocuments = () => {
    return documents.filter(doc => doc.verification_status === 'rejected');
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`border-2 ${
          statusInfo.color === 'success' ? 'border-success bg-success/5' :
          statusInfo.color === 'warning' ? 'border-warning bg-warning/5' :
          statusInfo.color === 'primary' ? 'border-primary bg-primary/5' :
          statusInfo.color === 'destructive' ? 'border-destructive bg-destructive/5' :
          'border-muted'
        }`}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                statusInfo.color === 'success' ? 'bg-success/20' :
                statusInfo.color === 'warning' ? 'bg-warning/20' :
                statusInfo.color === 'primary' ? 'bg-primary/20' :
                statusInfo.color === 'destructive' ? 'bg-destructive/20' :
                'bg-muted'
              }`}>
                <StatusIcon className={`h-5 w-5 ${
                  statusInfo.color === 'success' ? 'text-success' :
                  statusInfo.color === 'warning' ? 'text-warning' :
                  statusInfo.color === 'primary' ? 'text-primary' :
                  statusInfo.color === 'destructive' ? 'text-destructive' :
                  'text-muted-foreground'
                }`} />
              </div>
              <div>
                <CardTitle className="text-xl">{statusInfo.title}</CardTitle>
                <p className="text-muted-foreground">{statusInfo.description}</p>
              </div>
            </div>
          </CardHeader>

          {statusInfo.action && (
            <CardContent>
              <Link to={statusInfo.action.link}>
                <Button className="bg-primary hover:bg-primary/90">
                  {statusInfo.action.label}
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Document Status */}
      {getWorkerStatus() !== 'active_employee' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Document Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{Math.round(getDocumentProgress())}%</span>
                </div>
                <Progress value={getDocumentProgress()} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Verification Progress</span>
                  <span>{Math.round(getVerificationProgress())}%</span>
                </div>
                <Progress value={getVerificationProgress()} />
              </div>

              <div className="grid gap-2">
                {requiredDocuments.map(docType => {
                  const doc = documents.find(d => d.document_type === docType);
                  const label = documentTypeLabels[docType as keyof typeof documentTypeLabels];
                  
                  return (
                    <div key={docType} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{label}</span>
                      {doc ? (
                        <Badge variant={
                          doc.verification_status === 'approved' ? 'secondary' :
                          doc.verification_status === 'rejected' ? 'destructive' :
                          'secondary'
                        } className={
                          doc.verification_status === 'approved' ? 'bg-success/20 text-success border-success' :
                          doc.verification_status === 'rejected' ? '' :
                          'bg-warning/20 text-warning border-warning'
                        }>
                          {doc.verification_status === 'approved' ? 'Approved' :
                           doc.verification_status === 'rejected' ? 'Rejected' :
                           'Pending'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          Not Uploaded
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              {getRejectedDocuments().length > 0 && (
                <Alert className="border-destructive bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <strong>Some documents were rejected:</strong>
                    <ul className="mt-2 space-y-1">
                      {getRejectedDocuments().map(doc => (
                        <li key={doc.document_type} className="text-sm">
                          • {documentTypeLabels[doc.document_type as keyof typeof documentTypeLabels]}: {doc.verification_notes}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {getWorkerStatus() === 'document_upload_pending' || getRejectedDocuments().length > 0 ? (
                <Link to="/worker/onboarding/documents">
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    {getRejectedDocuments().length > 0 ? 'Re-upload Documents' : 'Upload Documents'}
                  </Button>
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Interview Information */}
      {interview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Interview Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Date & Time</span>
                  </div>
                  <p className="text-sm">
                    {format(new Date(interview.scheduled_date), 'PPP')} at{' '}
                    {format(new Date(interview.scheduled_date), 'p')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({formatDistanceToNow(new Date(interview.scheduled_date), { addSuffix: true })})
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {interview.mode === 'online' ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {interview.mode === 'online' ? 'Online Meeting' : 'In-Person Meeting'}
                    </span>
                  </div>
                  {interview.mode === 'online' && interview.meeting_link && (
                    <a 
                      href={interview.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Join Meeting
                    </a>
                  )}
                  {interview.mode === 'offline' && interview.location && (
                    <p className="text-sm">{interview.location}</p>
                  )}
                </div>
              </div>

              {interview.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Notes:</strong> {interview.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Badge variant={
                  interview.status === 'completed' && interview.result === 'selected' ? 'secondary' :
                  interview.status === 'completed' && interview.result === 'rejected' ? 'destructive' :
                  interview.status === 'scheduled' ? 'secondary' :
                  'secondary'
                } className={
                  interview.status === 'completed' && interview.result === 'selected' ? 'bg-success/20 text-success border-success' :
                  interview.status === 'completed' && interview.result === 'rejected' ? '' :
                  interview.status === 'scheduled' ? 'bg-primary/20 text-primary border-primary' :
                  'bg-warning/20 text-warning border-warning'
                }>
                  {interview.status === 'completed' && interview.result === 'selected' ? 'Selected' :
                   interview.status === 'completed' && interview.result === 'rejected' ? 'Not Selected' :
                   interview.status === 'scheduled' ? 'Scheduled' :
                   interview.status}
                </Badge>
              </div>

              {interview.feedback && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Feedback:</strong> {interview.feedback}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default OnboardingStatus;
