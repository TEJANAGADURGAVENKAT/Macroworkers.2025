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
  Upload,
  X,
  Building
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DocumentStatus {
  document_type: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
}

const EmployerStatus = () => {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const documentTypeLabels = {
    '10th_certificate': 'CIN - Company Incorporation Details',
    '12th_certificate': 'Memorandum of Association (MoA)',
    'graduation_certificate': 'Articles of Association (AoA)',
    'resume': 'Digital Signature Certificate (DSC)',
    'kyc_document': 'Director Identification Number (DIN)'
  };

  const requiredDocuments = Object.keys(documentTypeLabels);

  useEffect(() => {
    if (user) {
      loadVerificationData();
    }
  }, [user]);

  const loadVerificationData = async () => {
    if (!user) return;

    try {
      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('worker_documents')
        .select('document_type, verification_status, verification_notes')
        .eq('worker_id', user.id);

      if (documentsError) throw documentsError;

      setDocuments(documentsData || []);

    } catch (error: any) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmployerStatus = () => {
    return profile?.worker_status || 'verification_pending';
  };

  const getStatusInfo = () => {
    const status = getEmployerStatus();
    
    switch (status) {
      case 'verification_pending':
        return {
          title: 'Documents Under Review',
          description: 'Your company documents are being verified by our admin team. You will receive access to your dashboard once approved.',
          color: 'warning',
          icon: Clock,
          action: null
        };
      case 'active_employee':
        return {
          title: 'Welcome to Macroworkers!',
          description: 'Your company has been verified. You can now create tasks and manage your workforce.',
          color: 'success',
          icon: CheckCircle2,
          action: { label: 'Go to Dashboard', link: '/employer' }
        };
      case 'rejected':
        return {
          title: 'Verification Not Approved',
          description: 'Unfortunately, your company verification was not approved. Please contact support for more information.',
          color: 'destructive',
          icon: X,
          action: null
        };
      default:
        return {
          title: 'Getting Started',
          description: 'Complete your company verification process',
          color: 'muted',
          icon: Building,
          action: null
        };
    }
  };

  const getDocumentProgress = () => {
    const uploadedCount = documents.length;
    return (uploadedCount / requiredDocuments.length) * 100;
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find(d => d.document_type === documentType);
    return doc?.verification_status || 'not_uploaded';
  };

  const getStatusBadge = (documentType: string) => {
    const status = getDocumentStatus(documentType);
    
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          variant: 'secondary' as const,
          className: 'bg-success/20 text-success border-success',
          icon: CheckCircle2
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          className: 'bg-destructive/20 text-destructive border-destructive',
          icon: X
        };
      case 'pending':
        return {
          label: 'Under Review',
          variant: 'secondary' as const,
          className: 'bg-warning/20 text-warning border-warning',
          icon: Clock
        };
      default:
        return {
          label: 'Not Uploaded',
          variant: 'secondary' as const,
          className: 'bg-muted/20 text-muted-foreground border-muted',
          icon: Upload
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const progress = getDocumentProgress();

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-2 border-dashed border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <StatusIcon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">{statusInfo.title}</CardTitle>
            <p className="text-muted-foreground">{statusInfo.description}</p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Verification Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {statusInfo.action && (
                <Button asChild className="w-full">
                  <Link to={statusInfo.action.link}>
                    {statusInfo.action.label}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Document Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Company Documents Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredDocuments.map((documentType, index) => {
                const badge = getStatusBadge(documentType);
                const BadgeIcon = badge.icon;
                
                return (
                  <motion.div
                    key={documentType}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                        <BadgeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{documentTypeLabels[documentType as keyof typeof documentTypeLabels]}</p>
                        <p className="text-sm text-muted-foreground">
                          {documentType === '10th_certificate' ? 'Required' : 'Optional'}
                        </p>
                      </div>
                    </div>
                    
                    <Badge 
                      variant={badge.variant} 
                      className={badge.className}
                    >
                      {badge.label}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status-specific alerts */}
      {getEmployerStatus() === 'rejected' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Verification Rejected:</strong> Your company verification was not approved. 
              Please contact our support team for assistance or re-submit your documents.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {getEmployerStatus() === 'verification_pending' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Verification in Progress:</strong> Our admin team is reviewing your company documents. 
              This process typically takes 1-2 business days. You will receive an email notification once the review is complete.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
};

export default EmployerStatus;


