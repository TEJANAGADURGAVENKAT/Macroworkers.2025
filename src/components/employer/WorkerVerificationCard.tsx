import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWorkerDocuments } from '@/hooks/useWorkerDocuments';
import { useWorkerInterview } from '@/hooks/useWorkerInterview';
import { InterviewSchedulingModal } from './InterviewSchedulingModal';
import { 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Eye,
  Download,
  AlertTriangle,
  Loader2,
  Edit
} from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface WorkerVerificationCardProps {
  worker: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
    worker_status: string;
    category?: string;
    created_at: string;
    documents: Array<{
      id: string;
      document_type: string;
      verification_status: 'pending' | 'approved' | 'rejected';
      verification_notes?: string;
      verified_at?: string;
    }>;
  };
  onDocumentStatusUpdate: (documentId: string, status: 'approved' | 'rejected', notes?: string) => void;
  onManualStatusUpdate?: (workerId: string, newStatus: string) => void;
}

export const WorkerVerificationCard = ({ worker, onDocumentStatusUpdate, onManualStatusUpdate }: WorkerVerificationCardProps) => {
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documentNotes, setDocumentNotes] = useState('');
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(null);

  const { areAllDocumentsApproved, getApprovedDocumentsCount, getTotalDocumentsCount } = useWorkerDocuments(worker.user_id);
  const { isInterviewScheduled } = useWorkerInterview(worker.user_id);

  const documentTypes = [
    { key: '10th_certificate', label: '10th Certificate', icon: FileText },
    { key: '12th_certificate', label: '12th Certificate', icon: FileText },
    { key: 'graduation_certificate', label: 'Graduation Certificate', icon: FileText },
    { key: 'resume', label: 'Resume/CV', icon: FileText },
    { key: 'kyc_document', label: 'KYC Document', icon: FileText }
  ];

  const getDocumentStatus = (documentType: string) => {
    const doc = worker.documents.find(d => d.document_type === documentType);
    return doc?.verification_status || null;
  };

  const getDocumentNotes = (documentType: string) => {
    const doc = worker.documents.find(d => d.document_type === documentType);
    return doc?.verification_notes || '';
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          variant: 'secondary' as const,
          className: 'bg-success/20 text-success border-success',
          icon: CheckCircle
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          className: 'bg-destructive/20 text-destructive border-destructive',
          icon: XCircle
        };
      case 'pending':
        return {
          label: 'Pending',
          variant: 'secondary' as const,
          className: 'bg-warning/20 text-warning border-warning',
          icon: Clock
        };
      default:
        return {
          label: 'Not Uploaded',
          variant: 'secondary' as const,
          className: 'bg-muted/20 text-muted-foreground border-muted',
          icon: FileText
        };
    }
  };

  const handleDocumentStatusUpdate = async (documentId: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingDocument(documentId);
      await onDocumentStatusUpdate(documentId, status, documentNotes || undefined);
      setDocumentNotes('');
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error updating document status:', error);
    } finally {
      setUpdatingDocument(null);
    }
  };

  const canScheduleInterview = areAllDocumentsApproved() && worker.worker_status === 'interview_pending';
  const approvedCount = getApprovedDocumentsCount();
  const totalCount = getTotalDocumentsCount();
  const progressPercentage = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`transition-all duration-300 ${
          canScheduleInterview 
            ? 'border-success bg-success/5' 
            : worker.worker_status === 'interview_scheduled'
            ? 'border-warning bg-warning/5'
            : 'border-muted'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{worker.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{worker.email}</p>
                  {worker.phone && (
                    <p className="text-sm text-muted-foreground">{worker.phone}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  {worker.category || 'No Category'}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Joined {formatDistanceToNow(new Date(worker.created_at))} ago
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Overview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Document Verification Progress</h4>
                <span className="text-sm text-muted-foreground">
                  {approvedCount} of {totalCount} documents approved
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Documents List */}
            <div className="space-y-3">
              <h4 className="font-medium">Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documentTypes.map((docType) => {
                  const status = getDocumentStatus(docType.key);
                  const notes = getDocumentNotes(docType.key);
                  const statusBadge = getStatusBadge(status);
                  const StatusIcon = statusBadge.icon;
                  const Icon = docType.icon;

                  return (
                    <div
                      key={docType.key}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        status === 'approved' 
                          ? 'bg-success/5 border-success/20' 
                          : status === 'rejected'
                          ? 'bg-destructive/5 border-destructive/20'
                          : status === 'pending'
                          ? 'bg-warning/5 border-warning/20'
                          : 'bg-muted/30 border-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{docType.label}</span>
                        </div>
                        <Badge variant={statusBadge.variant} className={statusBadge.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusBadge.label}
                        </Badge>
                      </div>

                      {notes && (
                        <p className="text-xs text-muted-foreground mb-2">{notes}</p>
                      )}

                      {status && status !== 'not_uploaded' && (
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSelectedDocument(docType.key)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-success hover:text-success"
                                onClick={() => handleDocumentStatusUpdate(
                                  worker.documents.find(d => d.document_type === docType.key)?.id || '',
                                  'approved'
                                )}
                                disabled={updatingDocument === worker.documents.find(d => d.document_type === docType.key)?.id}
                              >
                                {updatingDocument === worker.documents.find(d => d.document_type === docType.key)?.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedDocument(docType.key);
                                  setDocumentNotes('');
                                }}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              {canScheduleInterview && (
                <Button
                  onClick={() => setShowInterviewModal(true)}
                  className="bg-gradient-primary hover:bg-primary-dark"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
              )}

              {worker.worker_status === 'interview_scheduled' && (
                <>
                  <Badge variant="secondary" className="bg-warning/20 text-warning border-warning">
                    <Clock className="h-3 w-3 mr-1" />
                    Interview Scheduled
                  </Badge>
                  <Button
                    onClick={() => setShowInterviewModal(true)}
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary hover:bg-primary/20"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                </>
              )}

              {worker.worker_status === 'active_employee' && (
                <Badge variant="secondary" className="bg-success/20 text-success border-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active Employee
                </Badge>
              )}

              {/* Manual Status Update for Selected Workers */}
              {worker.worker_status === 'interview_scheduled' && onManualStatusUpdate && (
                <Button
                  onClick={() => onManualStatusUpdate(worker.user_id, 'active_employee')}
                  variant="outline"
                  className="bg-success/10 text-success border-success hover:bg-success/20"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Active
                </Button>
              )}
            </div>

            {/* Rejection Notes Modal */}
            {selectedDocument && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Reject Document</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Reason for rejection:</label>
                      <textarea
                        className="w-full mt-1 p-2 border rounded-md"
                        rows={3}
                        value={documentNotes}
                        onChange={(e) => setDocumentNotes(e.target.value)}
                        placeholder="Please provide a reason for rejecting this document..."
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDocument(null);
                          setDocumentNotes('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDocumentStatusUpdate(
                          worker.documents.find(d => d.document_type === selectedDocument)?.id || '',
                          'rejected'
                        )}
                        disabled={updatingDocument === worker.documents.find(d => d.document_type === selectedDocument)?.id}
                      >
                        {updatingDocument === worker.documents.find(d => d.document_type === selectedDocument)?.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Interview Scheduling Modal */}
      <InterviewSchedulingModal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        workerId={worker.user_id}
        workerName={worker.full_name}
      />
    </>
  );
};
