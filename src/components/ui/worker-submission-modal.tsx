import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Image, 
  File, 
  Download, 
  ExternalLink, 
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/utils";

interface WorkerSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    id: string;
    task_id: string;
    worker_id: string;
    proof_text: string | null;
    proof_files: string[] | null;
    proof_type?: 'text' | 'file' | 'both';
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    reviewed_at: string | null;
    reviewer_notes: string | null;
    task: {
      id: string;
      title: string;
      budget: number;
      created_by: string;
    };
  } | null;
}

interface FileWithUrl {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export function WorkerSubmissionModal({ isOpen, onClose, submission }: WorkerSubmissionModalProps) {
  const [files, setFiles] = useState<FileWithUrl[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && submission?.proof_files?.length) {
      loadFileUrls();
    } else {
      setFiles([]);
      setError(null);
    }
  }, [isOpen, submission]);

  const loadFileUrls = async () => {
    if (!submission?.proof_files?.length) return;

    setLoading(true);
    setError(null);

    try {
      const filePromises = submission.proof_files.map(async (fileName) => {
        try {
          console.log(`Attempting to get signed URL for: ${submission.worker_id}/${fileName}`);
          
          const { data, error } = await supabase.storage
            .from('submission-files')
            .createSignedUrl(`${submission.worker_id}/${fileName}`, 3600); // 1 hour expiry

          if (error) {
            console.error(`Error getting signed URL for ${fileName}:`, error);
            return {
              name: fileName,
              url: '',
              type: 'unknown',
              error: error.message
            };
          }

          console.log(`Successfully got signed URL for ${fileName}:`, data.signedUrl);
          return {
            name: fileName,
            url: data.signedUrl,
            type: getFileType(fileName),
            size: 0 // We don't have size info in the current setup
          };
        } catch (err) {
          console.error(`Error processing file ${fileName}:`, err);
          return {
            name: fileName,
            url: '',
            type: 'unknown',
            error: 'Failed to load file'
          };
        }
      });

      const fileResults = await Promise.all(filePromises);
      console.log('File results:', fileResults);
      setFiles(fileResults);
    } catch (err: any) {
      console.error('Error loading files:', err);
      setError(err?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['doc', 'docx'].includes(extension || '')) return 'document';
    if (['txt'].includes(extension || '')) return 'text';
    return 'file';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'pdf': return <File className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <X className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            My Submission - {submission.task?.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Submission Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Task</p>
                <p className="font-semibold">{submission.task?.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatTimeAgo(submission.submitted_at)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p className="font-semibold text-success">{formatINR(submission.task?.budget || 0)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(submission.status)}
                  <Badge className={submission.status === 'approved' ? 'bg-success/10 text-success' : 
                                   submission.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 
                                   'bg-warning/10 text-warning'}>
                    {submission.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Text Proof */}
            {submission.proof_text && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text Proof
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="whitespace-pre-wrap">{submission.proof_text}</p>
                </div>
              </div>
            )}

            {/* File Proofs */}
            {submission.proof_files && submission.proof_files.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <File className="h-4 w-4" />
                  File Proofs ({submission.proof_files.length})
                </h3>
                
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading files...</span>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{file.type}</p>
                          </div>
                        </div>
                        
                        {file.error ? (
                          <Badge variant="destructive">Object not found</Badge>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = file.url;
                                link.download = file.name;
                                link.click();
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Review Notes */}
            {submission.reviewer_notes && (
              <div className="space-y-2">
                <h3 className="font-semibold">Review Notes</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p>{submission.reviewer_notes}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
