import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  X, 
  Eye, 
  FileText, 
  GraduationCap,
  IdCard,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface WorkerWithDocuments {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  category: string;
  worker_status: string;
  created_at: string;
  documents: {
    id: string;
    document_type: string;
    file_name: string;
    file_path: string;
    verification_status: string;
    verification_notes?: string;
    created_at: string;
  }[];
}

const WorkerVerification = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Check if employer is approved - redirect if not
  useEffect(() => {
    if (profile && profile.worker_status !== 'active_employee') {
      toast({
        title: "Access Restricted",
        description: "Please complete document verification to access worker verification.",
        variant: "destructive"
      });
      navigate('/employer/verify');
    }
  }, [profile, navigate, toast]);
  
  const [workers, setWorkers] = useState<WorkerWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDocument, setProcessingDocument] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithDocuments | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const documentTypeLabels = {
    '10th_certificate': '10th Certificate',
    '12th_certificate': '12th Certificate',
    'graduation_certificate': 'Graduation Certificate',
    'resume': 'Resume / CV',
    'kyc_document': 'KYC / Government ID'
  };

  const documentTypeIcons = {
    '10th_certificate': GraduationCap,
    '12th_certificate': GraduationCap,
    'graduation_certificate': GraduationCap,
    'resume': FileText,
    'kyc_document': IdCard
  };

  useEffect(() => {
    if (user && profile?.role === 'employer') {
      loadWorkersForVerification();
    }
  }, [user, profile]);

  const loadWorkersForVerification = async () => {
    try {
      // Get workers with verification_pending or document_upload_pending status
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, category, worker_status, created_at')
        .eq('role', 'worker')
        .in('worker_status', ['verification_pending', 'document_upload_pending'])
        .order('created_at', { ascending: false });

      if (workersError) throw workersError;

      // Get documents for each worker
      const workersWithDocuments: WorkerWithDocuments[] = [];

      for (const worker of workersData || []) {
        const { data: documentsData, error: documentsError } = await supabase
          .from('worker_documents')
          .select('id, document_type, file_name, file_path, verification_status, verification_notes, created_at')
          .eq('worker_id', worker.user_id)
          .order('created_at', { ascending: false });

        if (documentsError) {
          console.error('Error loading documents for worker:', worker.user_id, documentsError);
          continue;
        }

        workersWithDocuments.push({
          ...worker,
          documents: documentsData || []
        });
      }

      setWorkers(workersWithDocuments);
    } catch (error: any) {
      console.error('Error loading workers:', error);
      toast({
        title: "Error loading workers",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentFileUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('worker-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error: any) {
      console.error('Error getting file URL:', error);
      toast({
        title: "Error loading document",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', notes?: string) => {
    if (!user) return;

    setProcessingDocument(documentId);

    try {
      const { error } = await supabase
        .from('worker_documents')
        .update({
          verification_status: action === 'approve' ? 'approved' : 'rejected',
          verification_notes: notes || null,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: `Document ${action}d`,
        description: `The document has been ${action}d successfully`,
      });

      // Reload workers data
      await loadWorkersForVerification();
      setVerificationNotes("");
      
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast({
        title: "Error updating document",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingDocument(null);
    }
  };

  const handlePreviewDocument = async (filePath: string) => {
    const url = await getDocumentFileUrl(filePath);
    if (url) {
      setPreviewUrl(url);
    }
  };

  const getWorkerStatusBadge = (status: string) => {
    switch (status) {
      case 'verification_pending':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning">Verification Pending</Badge>;
      case 'document_upload_pending':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Documents Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-success/20 text-success border-success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Worker Verification</h1>
          <p className="text-muted-foreground">
            Review and verify worker documents for registration approval
          </p>
        </motion.div>

        {workers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No workers pending verification</h3>
              <p className="text-muted-foreground">
                All workers have been verified or no new registrations are pending.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {workers.map((worker, index) => (
              <motion.div
                key={worker.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{worker.full_name}</CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{worker.email}</span>
                            </div>
                            {worker.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{worker.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Registered {formatDistanceToNow(new Date(worker.created_at))} ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {worker.category && (
                          <Badge variant="outline">{worker.category}</Badge>
                        )}
                        {getWorkerStatusBadge(worker.worker_status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4">
                      <h4 className="font-medium mb-2">Uploaded Documents ({worker.documents.length}/5)</h4>
                      
                      {worker.documents.length === 0 ? (
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            No documents uploaded yet. Worker needs to upload required documents.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid gap-3">
                          {worker.documents.map((document) => {
                            const Icon = documentTypeIcons[document.document_type as keyof typeof documentTypeIcons] || FileText;
                            
                            return (
                              <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${
                                    document.verification_status === 'approved' ? 'bg-success/20' :
                                    document.verification_status === 'rejected' ? 'bg-destructive/20' :
                                    'bg-warning/20'
                                  }`}>
                                    <Icon className={`h-4 w-4 ${
                                      document.verification_status === 'approved' ? 'text-success' :
                                      document.verification_status === 'rejected' ? 'text-destructive' :
                                      'text-warning'
                                    }`} />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {documentTypeLabels[document.document_type as keyof typeof documentTypeLabels] || document.document_type}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{document.file_name}</p>
                                    {document.verification_notes && (
                                      <p className="text-sm text-destructive mt-1">
                                        Note: {document.verification_notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  {getDocumentStatusBadge(document.verification_status)}
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreviewDocument(document.file_path)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>

                                  {document.verification_status === 'pending' && (
                                    <div className="flex space-x-1">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            disabled={processingDocument === document.id}
                                          >
                                            <X className="h-4 w-4 mr-1" />
                                            Reject
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Reject Document</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <p>Please provide a reason for rejecting this document:</p>
                                            <Textarea
                                              placeholder="Enter rejection reason..."
                                              value={verificationNotes}
                                              onChange={(e) => setVerificationNotes(e.target.value)}
                                              rows={3}
                                            />
                                            <div className="flex space-x-2 justify-end">
                                              <Button
                                                variant="outline"
                                                onClick={() => setVerificationNotes("")}
                                              >
                                                Cancel
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                onClick={() => handleDocumentAction(document.id, 'reject', verificationNotes)}
                                                disabled={!verificationNotes.trim() || processingDocument === document.id}
                                              >
                                                {processingDocument === document.id ? (
                                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                ) : (
                                                  <X className="h-4 w-4 mr-1" />
                                                )}
                                                Reject
                                              </Button>
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-success hover:text-success"
                                        onClick={() => handleDocumentAction(document.id, 'approve')}
                                        disabled={processingDocument === document.id}
                                      >
                                        {processingDocument === document.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : (
                                          <CheckCircle2 className="h-4 w-4 mr-1" />
                                        )}
                                        Approve
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Document Preview Dialog */}
        {previewUrl && (
          <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Document Preview</DialogTitle>
                <DialogDescription>
                  Preview the uploaded document before making a verification decision.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] border rounded-lg"
                  title="Document Preview"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default WorkerVerification;
